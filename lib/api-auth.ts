import { NextRequest } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Role } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export interface VerifyResult {
  user: { id: string; email?: string } | null;
  error: string | null;
  supabase: SupabaseClient | null;
  role?: Role;
  status?: string;
}

export async function verifyRole(
  request: NextRequest,
  allowedRoles: Role[]
): Promise<VerifyResult> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, error: "Missing authorization token", supabase: null };
  }

  const token = authHeader.substring(7);
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) {
    return { user: null, error: error?.message || "Invalid token", supabase: null };
  }

  const { data: profile } = await client
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  const role = (profile?.role as Role | undefined) || "customer";
  const status = profile?.status || "active";

  if (!allowedRoles.includes(role)) {
    return { user, error: `Forbidden: requires role ${allowedRoles.join(" or ")}`, supabase: client, role, status };
  }

  if (role === "collaborator" && status !== "active") {
    return { user, error: `Forbidden: collaborator status is ${status}`, supabase: client, role, status };
  }

  return { user, error: null, supabase: client, role, status };
}

export async function verifyAdmin(request: NextRequest) {
  return verifyRole(request, ["admin"]);
}

export async function verifyCollaborator(request: NextRequest) {
  return verifyRole(request, ["collaborator"]);
}

export function getServiceClient() {
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
