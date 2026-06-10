import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Testimonial } from "@/lib/models/Testimonial";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";
import { serializeAll } from "@/lib/serialize";

export async function GET() {
  await connectDB();
  const list = await Testimonial.find().sort({ displayOrder: 1 }).lean();
  return NextResponse.json({ testimonials: list });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (isErrorResponse(session)) return session;

  const body = await req.json();
  const t = await Testimonial.create(body);
  return NextResponse.json({ testimonial: t });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin(req);
  if (isErrorResponse(session)) return session;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing testimonial ID" }, { status: 400 });
  }

  const deleted = await Testimonial.findByIdAndDelete(id).lean();
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ testimonial: { id: deleted._id.toString(), ...deleted } });
}
