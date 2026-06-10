import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Comment } from "@/lib/models/Comment";
import { Product } from "@/lib/models/Product";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";

export async function GET() {
  await connectDB();
  const list = await Comment.find().sort({ createdAt: -1 }).lean();
  const productIds = Array.from(new Set(list.map((c) => c.productId).filter(Boolean)));
  const products = await Product.find({ _id: { $in: productIds } })
    .select("name")
    .lean();
  const productNameById = new Map(
    products.map((p) => [p._id.toString(), (p as any).name as string])
  );
  const items = list.map((c) => ({
    id: c._id.toString(),
    ...c,
    products: { name: productNameById.get(c.productId) ?? null },
  }));
  return NextResponse.json({ comments: items });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (isErrorResponse(session)) return session;

  const body = await req.json();
  const { id, ...payload } = body;
  if (!id) {
    return NextResponse.json({ error: "Missing comment ID" }, { status: 400 });
  }

  const item = await Comment.findByIdAndUpdate(id, payload, { new: true }).lean();
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ comment: { id: (item as any)._id.toString(), ...(item as any) } });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin(req);
  if (isErrorResponse(session)) return session;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing comment ID" }, { status: 400 });
  }

  const deleted = await Comment.findByIdAndDelete(id).lean();
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ comment: { id: deleted._id.toString(), ...deleted } });
}
