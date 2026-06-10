import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Withdrawal } from "@/lib/models/Withdrawal";
import { User } from "@/lib/models/User";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";

export async function GET() {
  const session = await requireAdmin(new NextRequest(new Request("http://localhost")));
  if (isErrorResponse(session)) return session;

  await connectDB();
  const list = await Withdrawal.find().sort({ createdAt: -1 }).lean();

  const collaboratorIds = Array.from(
    new Set(list.map((w) => w.collaboratorId).filter(Boolean))
  );
  const users = await User.find({ _id: { $in: collaboratorIds } })
    .select("fullName")
    .lean();
  const nameById = new Map(
    users.map((u) => [u._id.toString(), (u as any).fullName as string])
  );

  const withdrawals = list.map((w) => ({
    id: w._id.toString(),
    ...w,
    profiles: { full_name: nameById.get(w.collaboratorId) ?? null },
  }));

  return NextResponse.json({ withdrawals });
}
