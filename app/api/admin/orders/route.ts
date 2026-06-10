import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";

export async function GET() {
  const session = await requireAdmin(new NextRequest(new Request("http://localhost")));
  if (isErrorResponse(session)) return session;

  await connectDB();
  const orders = await Order.find({ deletedAt: null })
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (isErrorResponse(session)) return session;

  const body = await req.json();
  const orderCode =
    body.orderCode || `BT-${Math.floor(100000 + Math.random() * 900000)}`;

  await connectDB();
  const order = await Order.create({
    ...body,
    orderCode,
    createdBy: session.id,
    createdByEmail: session.email,
  });
  return NextResponse.json({ order });
}
