import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { requireCollaborator, isErrorResponse } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const session = await requireCollaborator(req);
  if (isErrorResponse(session)) return session;

  await connectDB();
  const user = await User.findById(session.id).select(
    "email fullName phone bankName bankAccount bankHolder referralCode commissionBalance status"
  ).lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ profile: user });
}

export async function PATCH(req: NextRequest) {
  const session = await requireCollaborator(req);
  if (isErrorResponse(session)) return session;

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const update: Record<string, unknown> = {};
  if (typeof body.fullName === "string") update.fullName = body.fullName.trim();
  if (typeof body.phone === "string") {
    if (body.phone && !/^0\d{9,10}$/.test(body.phone)) {
      return NextResponse.json({ error: "Số điện thoại không hợp lệ" }, { status: 400 });
    }
    update.phone = body.phone.trim();
  }
  if (typeof body.bankName === "string") update.bankName = body.bankName.trim();
  if (typeof body.bankAccount === "string") update.bankAccount = body.bankAccount.trim();
  if (typeof body.bankHolder === "string") update.bankHolder = body.bankHolder.trim();

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Không có trường nào để cập nhật" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findByIdAndUpdate(session.id, { $set: update }, { new: true })
    .select("fullName phone bankName bankAccount bankHolder")
    .lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ profile: user });
}
