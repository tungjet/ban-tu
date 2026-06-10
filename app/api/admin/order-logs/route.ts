import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { OrderLog } from "@/lib/models/OrderLog";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";

export async function GET() {
  const session = await requireAdmin(new NextRequest(new Request("http://localhost")));
  if (isErrorResponse(session)) return session;

  await connectDB();
  const logs = await OrderLog.find().sort({ createdAt: -1 }).limit(100).lean();
  return NextResponse.json({ logs });
}
