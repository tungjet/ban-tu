import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { StoreSettings } from "@/lib/models/StoreSettings";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";

export async function GET() {
  await connectDB();
  const settings = await StoreSettings.findOne({ singleton: "default" }).lean();
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin(req);
  if (isErrorResponse(session)) return session;

  const body = await req.json();
  const { id: _ignored, ...payload } = body;

  await connectDB();
  const settings = await StoreSettings.findOneAndUpdate(
    { singleton: "default" },
    { $set: payload, $setOnInsert: { singleton: "default" } },
    { new: true, upsert: true }
  );
  return NextResponse.json({ settings });
}
