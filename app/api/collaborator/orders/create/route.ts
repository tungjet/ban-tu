import { NextRequest, NextResponse } from "next/server";
import { verifyCollaborator, getServiceClient } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const { user, error, supabase } = await verifyCollaborator(request);
  if (error || !user || !supabase) {
    return NextResponse.json({ error }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { customer_name, phone, email, address, note, items } = body;

  if (!customer_name || !phone || !address || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Thiếu thông tin đơn hàng" }, { status: 400 });
  }

  const total = items.reduce((s: number, i: any) => s + Number(i.price) * Number(i.quantity), 0);
  const order_code = `BT-${Math.floor(100000 + Math.random() * 900000)}`;

  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", user.id)
    .single();

  // Use service client to bypass admin-only RLS on orders INSERT
  const service = getServiceClient();
  const { data, error: insErr } = await service.from("orders").insert({
    order_code,
    customer_name: String(customer_name).trim(),
    phone: String(phone).trim(),
    email: email ? String(email).trim() : "",
    address: String(address).trim(),
    note: note ? String(note).trim() : "",
    items,
    total_amount: total,
    payment_method: "COD",
    status: "Chờ xử lý",
    collaborator_id: user.id,
    collaborator_code: profile?.referral_code || null,
    commission_status: "pending",
    created_by: user.id,
  }).select("id, order_code").single();

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id, order_code: data.order_code });
}
