import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";

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
