import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Testimonial } from "@/lib/models/Testimonial";

export async function GET() {
  await connectDB();
  const testimonials = await Testimonial.find({ isPublished: true })
    .sort({ displayOrder: 1 })
    .lean();
  return NextResponse.json({ testimonials });
}
