import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { User } from "@/lib/models/User";

export async function POST(request: NextRequest) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { customer_name, phone, email, address, note, payment_method, items, total_amount, order_code, status } = body;
  if (!customer_name || !phone || !address || !Array.isArray(items) || items.length === 0 || total_amount == null) {
    return NextResponse.json({ error: "Thiếu thông tin đơn hàng" }, { status: 400 });
  }

  // Resolve referral from cookie
  const cookieStore = await cookies();
  const bantuRef = cookieStore.get("bantu_ref")?.value;
  let collaboratorId: string | null = null;
  let collaboratorCode: string | null = null;

  if (bantuRef) {
    await connectDB();
    const u = await User.findOne({
      referralCode: bantuRef,
      role: "collaborator",
      status: "active",
    }).select("_id referralCode").lean();
    if (u) {
      collaboratorId = u._id.toString();
      collaboratorCode = u.referralCode;
    }
  }

  const finalCode = order_code || `BT-${Math.floor(100000 + Math.random() * 900000)}`;
  const order = await Order.create({
    orderCode: finalCode,
    customerName: String(customer_name).trim(),
    phone: String(phone).trim(),
    email: email ? String(email).trim() : "",
    address: String(address).trim(),
    note: note ? String(note).trim() : "",
    paymentMethod: payment_method === "bank" ? "Chuyển khoản" : "COD",
    totalAmount: Number(total_amount),
    status: status || (payment_method === "bank" ? "Chờ thanh toán" : "Chờ xử lý"),
    items,
    collaboratorId,
    collaboratorCode,
    commissionStatus: collaboratorId ? "pending" : "none",
  });

  return NextResponse.json({ id: order._id.toString(), order_code: order.orderCode });
}
