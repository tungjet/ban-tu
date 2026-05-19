import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const { error, supabase } = await verifyAdmin(request);
  if (error || !supabase) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { error: dbError } = await supabase
      .from("store_settings")
      .upsert({
        id: "default",
        ...body,
        updated_at: new Date().toISOString(),
      });

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
