import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { error, supabase } = await verifyAdmin(request);
  if (error || !supabase) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  let { data, error: dbError } = await supabase
    .from("orders")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (dbError?.code === "42703") {
    const fallback = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    data = fallback.data;
    dbError = fallback.error;
  }

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const { error, supabase } = await verifyAdmin(request);
  if (error || !supabase) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { data, error: dbError } = await supabase
      .from("orders")
      .insert([body])
      .select();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json(data?.[0] || null);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
