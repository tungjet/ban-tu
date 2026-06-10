import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { StoreSettings } from "@/lib/models/StoreSettings";

export async function GET() {
  await connectDB();
  let settings = await StoreSettings.findOne({ singleton: "default" }).lean();
  if (!settings) {
    settings = (await StoreSettings.create({ singleton: "default" })).toObject();
  }
  const { _id, __v, singleton, ...rest } = settings as any;
  return NextResponse.json(rest);
}
