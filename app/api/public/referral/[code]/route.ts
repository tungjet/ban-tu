import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

  if (normalized.length < 4) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data } = await supabase
    .from("public_profiles_referral")
    .select("id, referral_code")
    .eq("referral_code", normalized)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  const res = NextResponse.json({ valid: true, code: normalized });
  res.cookies.set("bantu_ref", normalized, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    httpOnly: false,
  });
  return res;
}
