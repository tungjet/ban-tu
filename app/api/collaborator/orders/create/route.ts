import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { User } from "@/lib/models/User";
import { requireCollaborator, isErrorResponse } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  const session = await requireCollaborator(req);
  if (isErrorResponse(session)) return session;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { customer_name, phone, email, address, note, items } = body;
  if (!customer_name || !phone || !address || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Thiếu thông tin đơn hàng" }, { status: 400 });
  }

  await connectDB();
  const total = items.reduce((s: number, i: any) => s + Number(i.price) * Number(i.quantity), 0);
  const orderCode = `BT-${Math.floor(100000 + Math.random() * 900000)}`;
  const user = await User.findById(session.id).select("referralCode").lean();

  const order = await Order.create({
    orderCode,
    customerName: String(customer_name).trim(),
    phone: String(phone).trim(),
    email: email ? String(email).trim() : "",
    address: String(address).trim(),
    note: note ? String(note).trim() : "",
    items,
    totalAmount: total,
    paymentMethod: "COD",
    status: "Chờ xử lý",
    collaboratorId: session.id,
    collaboratorCode: user?.referralCode || null,
    commissionStatus: "pending",
    createdBy: session.id,
    createdByEmail: session.email,
  });

  return NextResponse.json({ ok: true, id: order._id.toString(), order_code: order.orderCode });
}
