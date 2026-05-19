import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await verifyAdmin(request);
  if (error || !supabase) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const { data, error: dbError } = await supabase
      .from("orders")
      .update(body)
      .eq("id", id)
      .select();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json(data?.[0] || null);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await verifyAdmin(request);
  if (error || !supabase) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { data, error: dbError } = await supabase
    .from("orders")
    .delete()
    .eq("id", id)
    .select();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data?.[0] || null);
}
