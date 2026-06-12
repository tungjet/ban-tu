"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

export interface CurrentUserState {
  user: {
    id: string;
    email: string;
    name?: string;
    role: "admin" | "collaborator" | "customer";
    status: "pending" | "active" | "banned";
  } | null;
  profile: any;
  isLoading: boolean;
  isAdmin: boolean;
  isCollaborator: boolean;
  refresh: () => Promise<unknown>;
}

export function useCurrentUser(): CurrentUserState {
  const { data, status, update } = useSession();
  const user = (data?.user as any) ?? null;
  return useMemo(
    () => ({
      user,
      profile: user,
      isLoading: status === "loading",
      isAdmin: user?.role === "admin",
      isCollaborator: user?.role === "collaborator" && user?.status !== "banned",
      refresh: async () => {
        await update();
      },
    }),
    [data, status, update, user]
  );
}
