import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, password, full_name, phone } = body;

  if (!email || !password || !full_name || !phone) {
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });
  }
  if (!/^0\d{9,10}$/.test(phone)) {
    return NextResponse.json({ error: "Số điện thoại không hợp lệ" }, { status: 400 });
  }

  const anon = createClient(supabaseUrl, supabaseAnonKey);
  const { data: signUpData, error: signUpErr } = await anon.auth.signUp({
    email,
    password,
    options: { data: { full_name } },
  });

  if (signUpErr) {
    return NextResponse.json({ error: signUpErr.message }, { status: 400 });
  }
  if (!signUpData.user) {
    return NextResponse.json({ error: "Đăng ký thất bại" }, { status: 400 });
  }

  const service = getServiceClient();
  const { error: profileErr } = await service.from("profiles").insert({
    id: signUpData.user.id,
    full_name,
    phone,
    role: "collaborator",
    status: "pending",
  });

  if (profileErr) {
    if (profileErr.code === "23505") {
      return NextResponse.json({ error: "Email đã được đăng ký với vai trò khác" }, { status: 400 });
    }
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, user_id: signUpData.user.id });
}
