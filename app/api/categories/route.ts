import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Category } from "@/lib/models/Category";

export async function GET() {
  await connectDB();
  const categories = await Category.find().sort({ displayOrder: 1, name: 1 }).lean();
  return NextResponse.json({ categories });
}
