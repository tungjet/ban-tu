import { NextRequest, NextResponse } from "next/server";
import { verifyCollaborator } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { user, error, supabase } = await verifyCollaborator(request);
  if (error || !user || !supabase) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { data, error: dbErr } = await supabase
    .from("commissions")
    .select("id, amount, type, note, order_id, created_at")
    .eq("collaborator_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ commissions: data || [] });
}
