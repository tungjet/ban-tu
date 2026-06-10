import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const email = body.email;
  const password = body.password;
  const fullName = body.fullName || body.full_name;
  const phone = body.phone;
  if (!email || !password || !fullName || !phone) return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });
  if (!/^0\d{9,10}$/.test(phone)) return NextResponse.json({ error: "Số điện thoại không hợp lệ" }, { status: 400 });

  await connectDB();
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      fullName,
      phone,
      role: "collaborator",
      status: "pending",
    });
    return NextResponse.json({ ok: true, user_id: user._id.toString() });
  } catch (err: any) {
    if (err.code === 11000) return NextResponse.json({ error: "Email đã được đăng ký" }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
