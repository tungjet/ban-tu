import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, getServiceClient } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await verifyAdmin(request);
  if (error || !user) return NextResponse.json({ error }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { status, admin_note } = body;

  if (!["approved", "rejected", "paid"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const service = getServiceClient();

  const { data: w } = await service.from("withdrawals").select("*").eq("id", id).single();
  if (!w) return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });

  if (status === "approved" && w.status === "pending") {
    const { error: commErr } = await service.from("commissions").insert({
      collaborator_id: w.collaborator_id,
      order_id: null,
      amount: -Number(w.amount),
      type: "withdrawal",
      note: `Yêu cầu rút tiền #${id.slice(-6)}`,
      created_by: user.id,
      created_by_email: user.email,
    });
    if (commErr) return NextResponse.json({ error: commErr.message }, { status: 500 });
  }

  const { error: updErr } = await service
    .from("withdrawals")
    .update({
      status,
      admin_note: admin_note || null,
      processed_by: user.id,
      processed_by_email: user.email,
      processed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
