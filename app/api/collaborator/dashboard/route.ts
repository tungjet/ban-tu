import { NextRequest, NextResponse } from "next/server";
import { verifyCollaborator } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { user, error, supabase } = await verifyCollaborator(request);
  if (error || !user || !supabase) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ count: thisMonth }, { data: earnedRows }] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true })
      .eq("collaborator_id", user.id)
      .gte("created_at", startOfMonth.toISOString()),
    supabase.from("commissions").select("amount")
      .eq("collaborator_id", user.id)
      .eq("type", "order_earned"),
  ]);

  const totalEarned = (earnedRows || []).reduce((s, r) => s + Number(r.amount), 0);

  return NextResponse.json({ thisMonth: thisMonth || 0, totalEarned });
}
