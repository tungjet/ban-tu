import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";
import { applyOrderStatusCommission } from "@/lib/services/commission";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(req);
  if (isErrorResponse(session)) return session;
  const { id } = await params;
  const body = await req.json();

  await connectDB();
  const prev = await Order.findById(id);
  if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const prevStatus = prev.status;
  Object.assign(prev, body, {
    updatedBy: session.id,
    updatedByEmail: session.email,
  });
  await prev.save();

  if (body.status && body.status !== prevStatus) {
    await applyOrderStatusCommission(id, body.status, prevStatus, {
      userId: session.id,
      userEmail: session.email,
    });
  }

  return NextResponse.json({ order: prev });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(req);
  if (isErrorResponse(session)) return session;
  const { id } = await params;

  await connectDB();
  const updated = await Order.findByIdAndUpdate(id, {
    deletedAt: new Date(),
    deletedBy: session.id,
    deletedByEmail: session.email,
  });
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
