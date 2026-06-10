import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";
import { generateUniqueReferralCode } from "@/lib/services/referralCode";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(req);
  if (isErrorResponse(session)) return session;
  const { id } = await params;
  const body = await req.json();

  await connectDB();
  const profile = await User.findById(id);
  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.status) profile.status = body.status;
  if (body.full_name !== undefined) profile.fullName = body.full_name;
  if (body.fullName !== undefined) profile.fullName = body.fullName;
  if (body.phone !== undefined) profile.phone = body.phone;

  if (profile.status === "active" && !profile.referralCode) {
    profile.referralCode = await generateUniqueReferralCode();
  }

  await profile.save();

  return NextResponse.json({
    profile: {
      id: profile._id.toString(),
      full_name: profile.fullName,
      phone: profile.phone,
      status: profile.status,
      referral_code: profile.referralCode,
    },
  });
}
