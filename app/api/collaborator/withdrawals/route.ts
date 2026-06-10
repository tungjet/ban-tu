import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Withdrawal } from "@/lib/models/Withdrawal";
import { User } from "@/lib/models/User";
import { requireCollaborator, isErrorResponse } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const session = await requireCollaborator(req);
  if (isErrorResponse(session)) return session;

  await connectDB();
  const items = await Withdrawal.find({ collaboratorId: session.id })
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ withdrawals: items });
}

export async function POST(req: NextRequest) {
  const session = await requireCollaborator(req);
  if (isErrorResponse(session)) return session;

  let body: any;
  try {
    body = await req.json();
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

  await connectDB();
  const user = await User.findById(session.id).select("commissionBalance").lean();
  if (!user || user.commissionBalance < amount) {
    return NextResponse.json({ error: "Số dư không đủ" }, { status: 400 });
  }

  await Withdrawal.create({
    collaboratorId: session.id,
    amount,
    bankName: bank_name,
    bankAccount: bank_account,
    bankHolder: bank_holder,
    status: "pending",
  });
  return NextResponse.json({ ok: true });
}
