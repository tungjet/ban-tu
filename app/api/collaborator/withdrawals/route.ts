import { NextRequest, NextResponse } from "next/server";
import { verifyCollaborator } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { user, error, supabase } = await verifyCollaborator(request);
  if (error || !user || !supabase) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { data, error: dbErr } = await supabase
    .from("withdrawals")
    .select("*")
    .eq("collaborator_id", user.id)
    .order("created_at", { ascending: false });

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ withdrawals: data || [] });
}

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

  const amount = Number(body.amount);
  const bank_name = String(body.bank_name || "").trim();
  const bank_account = String(body.bank_account || "").trim();
  const bank_holder = String(body.bank_holder || "").trim();

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Số tiền không hợp lệ" }, { status: 400 });
  }
  if (!bank_name || !bank_account || !bank_holder) {
    return NextResponse.json({ error: "Thiếu thông tin ngân hàng" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("commission_balance")
    .eq("id", user.id)
    .single();

  if (!profile || Number(profile.commission_balance) < amount) {
    return NextResponse.json({ error: "Số dư không đủ" }, { status: 400 });
  }

  const { error: insErr } = await supabase.from("withdrawals").insert({
    collaborator_id: user.id,
    amount,
    bank_name,
    bank_account,
    bank_holder,
    status: "pending",
  });

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
