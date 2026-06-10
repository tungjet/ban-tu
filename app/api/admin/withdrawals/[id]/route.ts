import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Withdrawal } from "@/lib/models/Withdrawal";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";
import { applyWithdrawalApproval } from "@/lib/services/commission";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(req);
  if (isErrorResponse(session)) return session;
  const { id } = await params;
  const body = await req.json();
  const { status, admin_note } = body;

  if (!["approved", "rejected", "paid"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await connectDB();
  const w = await Withdrawal.findById(id);
  if (!w) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (status === "approved" && w.status === "pending") {
    await applyWithdrawalApproval(id, {
      userId: session.id,
      userEmail: session.email,
    });
  }

  w.status = status;
  w.adminNote = admin_note || null;
  w.processedBy = session.id;
  w.processedByEmail = session.email;
  w.processedAt = new Date();
  await w.save();

  return NextResponse.json({ ok: true });
}
