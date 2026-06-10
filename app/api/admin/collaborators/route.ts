import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, getServiceClient } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { error } = await verifyAdmin(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const service = getServiceClient();
  const { data, error: dbErr } = await service
    .from("profiles")
    .select("id, full_name, phone, role, status, referral_code, commission_balance, created_at")
    .eq("role", "collaborator")
    .order("created_at", { ascending: false });

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  const rows = (data || []).map((r) => ({ ...r, email: null }));
  return NextResponse.json({ collaborators: rows });
}
