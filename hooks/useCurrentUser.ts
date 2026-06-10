"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile, Role } from "@/lib/types";

export interface CurrentUserState {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  role: Role | null;
  isLoading: boolean;
  isAdmin: boolean;
  isCollaborator: boolean;
  refresh: () => Promise<void>;
}

export function useCurrentUser(): CurrentUserState {
  const [user, setUser] = useState<CurrentUserState["user"]>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      if (!u) {
        setProfile(null);
        return;
      }
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.id)
        .maybeSingle();
      setProfile((p as Profile) ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return {
    user,
    profile,
    role: profile?.role ?? null,
    isLoading,
    isAdmin: profile?.role === "admin",
    isCollaborator: profile?.role === "collaborator" && profile?.status === "active",
    refresh: load,
  };
}
