import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Commission } from "@/lib/models/Commission";
import { requireCollaborator, isErrorResponse } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const session = await requireCollaborator(req);
  if (isErrorResponse(session)) return session;

  await connectDB();
  const items = await Commission.find({ collaboratorId: session.id })
    .select("amount type note orderId createdAt")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  return NextResponse.json({ commissions: items });
}
