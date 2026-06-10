import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  let body: any;
  try { body = await request.json(); } catch { body = {}; }
  const { status } = body;
  if (!status) return NextResponse.json({ error: "Missing status" }, { status: 400 });

  await connectDB();
  const order = await Order.findOneAndUpdate(
    { orderCode: code },
    { $set: { status } },
    { new: true }
  ).select("_id orderCode status").lean();

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
}
