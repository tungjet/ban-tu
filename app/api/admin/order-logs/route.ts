import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { error, supabase } = await verifyAdmin(request);
  if (error || !supabase) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  const { data, error: dbError } = await supabase
    .from("order_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
