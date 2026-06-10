import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Review } from "@/lib/models/Review";
import { Product } from "@/lib/models/Product";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";

export async function GET() {
  await connectDB();
  const list = await Review.find().sort({ createdAt: -1 }).lean();
  const productIds = Array.from(new Set(list.map((r) => r.productId).filter(Boolean)));
  const products = await Product.find({ _id: { $in: productIds } })
    .select("name")
    .lean();
  const productNameById = new Map(
    products.map((p) => [p._id.toString(), (p as any).name as string])
  );
  const items = list.map((r) => ({
    id: r._id.toString(),
    ...r,
    products: { name: productNameById.get(r.productId) ?? null },
  }));
  return NextResponse.json({ reviews: items });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (isErrorResponse(session)) return session;

  const body = await req.json();
  const { id, ...payload } = body;

  let item;
  if (id) {
    item = await Review.findByIdAndUpdate(id, payload, { new: true }).lean();
  } else {
    item = await Review.create(payload);
    item = item.toObject();
  }
  return NextResponse.json({
    review: item ? { id: (item as any)._id?.toString() ?? id, ...(item as any) } : null,
  });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin(req);
  if (isErrorResponse(session)) return session;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing review ID" }, { status: 400 });
  }

  const deleted = await Review.findByIdAndDelete(id).lean();
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ review: { id: deleted._id.toString(), ...deleted } });
}
