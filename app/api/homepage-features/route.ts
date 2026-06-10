import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { HomepageFeature } from "@/lib/models/HomepageFeature";

export async function GET() {
  await connectDB();
  const features = await HomepageFeature.find({ isPublished: true })
    .sort({ displayOrder: 1 })
    .lean();
  return NextResponse.json({ features });
}
