import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";
import { serialize } from "@/lib/serialize";

export async function GET() {
  const session = await requireAdmin(new NextRequest(new Request("http://localhost")));
  if (isErrorResponse(session)) return session;

  await connectDB();
  const collaborators = await User.find({ role: "collaborator" })
    .select("fullName phone role status referralCode commissionBalance createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const rows = collaborators.map((u) => ({
    id: (u as any)._id.toString(),
    full_name: u.fullName,
    phone: u.phone,
    role: u.role,
    status: u.status,
    referral_code: u.referralCode,
    commission_balance: u.commissionBalance,
    created_at: (u as any).createdAt,
    email: null,
  }));
  return NextResponse.json({ collaborators: rows });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (isErrorResponse(session)) return session;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, password, fullName, phone } = body;
  if (!email || !password || !fullName || !phone) {
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });
  }
  if (!/^0\d{9,10}$/.test(phone)) {
    return NextResponse.json({ error: "Số điện thoại không hợp lệ" }, { status: 400 });
  }

  await connectDB();
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      fullName,
      phone,
      role: "collaborator",
      status: "active",
    });
    return NextResponse.json({ user: serialize(user) });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ error: "Email đã được đăng ký" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
