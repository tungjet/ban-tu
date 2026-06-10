import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { requireCollaborator, isErrorResponse } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const session = await requireCollaborator(req);
  if (isErrorResponse(session)) return session;

  await connectDB();
  const items = await Order.find({
    collaboratorId: session.id,
    deletedAt: null,
  })
    .select("orderCode customerName totalAmount status commissionStatus commissionAmount createdAt")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ orders: items });
}
