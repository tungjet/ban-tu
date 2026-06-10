import { NextRequest, NextResponse } from "next/server";
import { verifyCollaborator } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { user, error, supabase } = await verifyCollaborator(request);
  if (error || !user || !supabase) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { data: orders, error: dbErr } = await supabase
    .from("orders")
    .select("id, order_code, customer_name, total_amount, status, commission_status, commission_amount, created_at")
    .eq("collaborator_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ orders: orders || [] });
}
