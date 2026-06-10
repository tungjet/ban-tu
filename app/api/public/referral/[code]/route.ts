import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (normalized.length < 4) return NextResponse.json({ valid: false }, { status: 404 });

  await connectDB();
  const user = await User.findOne({
    referralCode: normalized,
    role: "collaborator",
    status: "active",
  }).select("_id referralCode").lean();

  if (!user) return NextResponse.json({ valid: false }, { status: 404 });

  const res = NextResponse.json({ valid: true, code: normalized });
  res.cookies.set("bantu_ref", normalized, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    httpOnly: false,
  });
  return res;
}
