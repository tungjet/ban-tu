import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const { error, supabase } = await verifyAdmin(request);
  if (error || !supabase) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      primaryOrderId,
      mergedItems,
      mergedTotal,
      mergeNote,
      secondaryOrderIds,
      logPayload,
    } = await request.json();

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        items: mergedItems,
        total_amount: mergedTotal,
        note: mergeNote,
      })
      .eq("id", primaryOrderId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { error: deleteError } = await supabase
      .from("orders")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: logPayload.changed_by,
        deleted_by_email: logPayload.changed_by_email,
      })
      .in("id", secondaryOrderIds);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const { error: logError } = await supabase
      .from("order_logs")
      .insert([logPayload]);

    if (logError) {
      console.warn("Log creation warning:", logError.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
