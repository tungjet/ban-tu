import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, error: "Missing authorization token", supabase: null };
  }

  const token = authHeader.substring(7);
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) {
    return { user: null, error: error?.message || "Invalid token", supabase: null };
  }

  return { user, error: null, supabase: client };
}
