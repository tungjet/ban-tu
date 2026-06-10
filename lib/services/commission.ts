import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { Commission } from "@/lib/models/Commission";
import { User } from "@/lib/models/User";
import { StoreSettings } from "@/lib/models/StoreSettings";
import { Product } from "@/lib/models/Product";
import { Withdrawal } from "@/lib/models/Withdrawal";

export async function applyOrderStatusCommission(
  orderId: string,
  newStatus: string,
  previousStatus: string,
  context: { userId: string; userEmail: string }
): Promise<void> {
  if (newStatus === previousStatus) return;

  await connectDB();
  const order = await Order.findById(orderId);
  if (!order || !order.collaboratorId) return;

  if (newStatus === "Đã hoàn thành") {
    if (order.commissionStatus === "earned") return;

    const hadEarnedBefore = await Commission.exists({
      orderId: order._id,
      type: "order_earned",
    });
    const isReEarn = !!hadEarnedBefore;

    const settings = await StoreSettings.findOne().lean();
    const defaultPct = settings?.defaultCommissionPercent ?? 5;

    let total = 0;
    for (const item of order.items) {
      const product = await Product.findById(item.id)
        .select("commissionPercent")
        .lean();
      const pct = product?.commissionPercent ?? defaultPct;
      total += Math.round(item.price * item.quantity * pct / 100);
    }

    await Commission.create({
      collaboratorId: order.collaboratorId,
      orderId: order._id,
      amount: total,
      type: "order_earned",
      note: isReEarn ? "Tính lại sau khi admin chuyển trạng thái" : null,
      createdBy: context.userId,
      createdByEmail: context.userEmail,
    });

    order.commissionAmount = total;
    order.commissionStatus = "earned";
    await order.save();

    await User.findByIdAndUpdate(order.collaboratorId, {
      $inc: { commissionBalance: total },
    });
  } else if (
    previousStatus === "Đã hoàn thành" &&
    order.commissionStatus === "earned" &&
    order.commissionAmount
  ) {
    await Commission.create({
      collaboratorId: order.collaboratorId,
      orderId: order._id,
      amount: -order.commissionAmount,
      type: "refund",
      note: "Hoàn tác do admin chuyển trạng thái đơn",
      createdBy: context.userId,
      createdByEmail: context.userEmail,
    });
    order.commissionStatus = "cancelled";
    await order.save();
    await User.findByIdAndUpdate(order.collaboratorId, {
      $inc: { commissionBalance: -order.commissionAmount },
    });
  }
}

export async function applyWithdrawalApproval(
  withdrawalId: string,
  context: { userId: string; userEmail: string }
): Promise<void> {
  await connectDB();
  const w = await Withdrawal.findById(withdrawalId);
  if (!w || w.status !== "pending") return;

  await Commission.create({
    collaboratorId: w.collaboratorId,
    orderId: null,
    amount: -w.amount,
    type: "withdrawal",
    note: `Yêu cầu rút tiền #${w._id.toString().slice(-6)}`,
    createdBy: context.userId,
    createdByEmail: context.userEmail,
  });
  const updated = await User.findOneAndUpdate(
    { _id: w.collaboratorId, commissionBalance: { $gte: w.amount } },
    { $inc: { commissionBalance: -w.amount } }
  );
  if (!updated) {
    throw new Error("Số dư không đủ");
  }
}
