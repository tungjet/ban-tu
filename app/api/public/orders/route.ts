import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServiceClient } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

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
    const anon = createClient(supabaseUrl, supabaseAnonKey);
    const { data } = await anon
      .from("public_profiles_referral")
      .select("id, referral_code")
      .eq("referral_code", bantuRef)
      .maybeSingle();
    if (data) {
      collaboratorId = data.id;
      collaboratorCode = data.referral_code;
    }
  }

  const service = getServiceClient();
  const finalCode = order_code || `BT-${Math.floor(100000 + Math.random() * 900000)}`;

  const { data, error } = await service
    .from("orders")
    .insert({
      order_code: finalCode,
      customer_name: String(customer_name).trim(),
      phone: String(phone).trim(),
      email: email ? String(email).trim() : "",
      address: String(address).trim(),
      note: note ? String(note).trim() : "",
      payment_method: payment_method === "bank" ? "Chuyển khoản" : "COD",
      total_amount: Number(total_amount),
      status: status || (payment_method === "bank" ? "Chờ thanh toán" : "Chờ xử lý"),
      items,
      collaborator_id: collaboratorId,
      collaborator_code: collaboratorCode,
      commission_status: collaboratorId ? "pending" : "none",
    })
    .select("id, order_code")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data.id, order_code: data.order_code });
}
