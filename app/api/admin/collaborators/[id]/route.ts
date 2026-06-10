import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, getServiceClient } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await verifyAdmin(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const allowed: Record<string, unknown> = {};
  if (body.status) allowed.status = body.status;
  if (body.full_name !== undefined) allowed.full_name = body.full_name;
  if (body.phone !== undefined) allowed.phone = body.phone;

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const service = getServiceClient();
  const { data, error: dbErr } = await service
    .from("profiles")
    .update(allowed)
    .eq("id", id)
    .select()
    .single();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
