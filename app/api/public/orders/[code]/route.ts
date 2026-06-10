import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  let body: any;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { status } = body;
  if (!status) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  const service = getServiceClient();
  const { data, error } = await service
    .from("orders")
    .update({ status })
    .eq("order_code", code)
    .select("id, order_code, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ order: data });
}
