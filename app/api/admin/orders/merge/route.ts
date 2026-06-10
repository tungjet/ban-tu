import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { OrderLog } from "@/lib/models/OrderLog";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (isErrorResponse(session)) return session;

  const {
    primaryOrderId,
    mergedItems,
    mergedTotal,
    mergeNote,
    secondaryOrderIds,
    logPayload,
  } = await req.json();

  await connectDB();

  const primary = await Order.findByIdAndUpdate(primaryOrderId, {
    items: mergedItems,
    totalAmount: mergedTotal,
    note: mergeNote,
  });
  if (!primary) {
    return NextResponse.json({ error: "Primary order not found" }, { status: 404 });
  }

  if (Array.isArray(secondaryOrderIds) && secondaryOrderIds.length > 0) {
    await Order.updateMany(
      { _id: { $in: secondaryOrderIds } },
      {
        deletedAt: new Date(),
        deletedBy: logPayload?.changedBy ?? session.id,
        deletedByEmail: logPayload?.changedByEmail ?? session.email,
      }
    );
  }

  if (logPayload) {
    await OrderLog.create({
      ...logPayload,
      changedBy: logPayload.changedBy ?? session.id,
      changedByEmail: logPayload.changedByEmail ?? session.email,
    });
  }

  return NextResponse.json({ success: true });
}
