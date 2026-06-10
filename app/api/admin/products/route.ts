import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";

export async function GET() {
  const session = await requireAdmin(new NextRequest(new Request("http://localhost")));
  if (isErrorResponse(session)) return session;

  await connectDB();
  const products = await Product.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (isErrorResponse(session)) return session;

  const body = await req.json();
  await connectDB();
  const product = await Product.create(body);
  return NextResponse.json({ product });
}
