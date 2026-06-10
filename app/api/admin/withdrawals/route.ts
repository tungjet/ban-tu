import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, getServiceClient } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { error } = await verifyAdmin(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const service = getServiceClient();
  const { data, error: dbErr } = await service
    .from("withdrawals")
    .select("*, profiles!withdrawals_collaborator_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ withdrawals: data || [] });
}
