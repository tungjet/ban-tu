import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { error, supabase } = await verifyAdmin(request);
  if (error || !supabase) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  const { data, error: dbError } = await supabase
    .from("reviews")
    .select("*, products(name)")
    .order("created_at", { ascending: false });

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
    const { id, ...payload } = body;

    let result;
    if (id) {
      result = await supabase
        .from("reviews")
        .update(payload)
        .eq("id", id)
        .select();
    } else {
      result = await supabase
        .from("reviews")
        .insert([payload])
        .select();
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json(result.data?.[0] || null);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const { error, supabase } = await verifyAdmin(request);
  if (error || !supabase) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing review ID" }, { status: 400 });
  }

  const { data, error: dbError } = await supabase
    .from("reviews")
    .delete()
    .eq("id", id)
    .select();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data?.[0] || null);
}
