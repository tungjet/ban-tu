import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Category } from "@/lib/models/Category";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";

export async function GET() {
  const session = await requireAdmin(new NextRequest(new Request("http://localhost")));
  if (isErrorResponse(session)) return session;

  await connectDB();
  const categories = await Category.find().sort({ displayOrder: 1, name: 1 }).lean();
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (isErrorResponse(session)) return session;

  const body = await req.json();
  await connectDB();
  const category = await Category.create({
    name: body.name,
    slug: body.slug,
    imageUrl: body.image_url ?? body.imageUrl ?? null,
    description: body.description ?? "",
    displayOrder: body.display_order ?? body.displayOrder ?? 0,
  });
  return NextResponse.json({ category });
}
