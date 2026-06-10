import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ensureProfile } from "@/lib/profile";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }
  const token = authHeader.substring(7);
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Invalid" }, { status: 401 });

  try {
    const profile = await ensureProfile(client, user);
    return NextResponse.json({ profile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to ensure profile" }, { status: 500 });
  }
}
