import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Role } from "./types";

export async function ensureProfile(
  supabase: SupabaseClient,
  user: User,
  overrides?: { role?: Role; status?: "pending" | "active" }
) {
  const role = overrides?.role ?? "customer";
  const status = overrides?.status ?? "active";

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      full_name:
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        null,
      role,
      status,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create profile: ${error.message}`);
  }
  return data;
}
