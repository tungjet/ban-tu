import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { HomepageFeature } from "@/lib/models/HomepageFeature";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";

export async function GET() {
  await connectDB();
  const list = await HomepageFeature.find().sort({ displayOrder: 1 }).lean();
  return NextResponse.json({ features: list });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (isErrorResponse(session)) return session;

  const body = await req.json();
  const { id, ...payload } = body;

  let item;
  if (id) {
    item = await HomepageFeature.findByIdAndUpdate(id, payload, { new: true }).lean();
  } else {
    const created = await HomepageFeature.create(payload);
    item = created.toObject();
  }
  return NextResponse.json({
    feature: item ? { id: (item as any)._id?.toString() ?? id, ...(item as any) } : null,
  });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin(req);
  if (isErrorResponse(session)) return session;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing feature ID" }, { status: 400 });
  }

  const deleted = await HomepageFeature.findByIdAndDelete(id).lean();
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ feature: { id: deleted._id.toString(), ...deleted } });
}
