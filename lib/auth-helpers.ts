import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

type Role = "admin" | "collaborator" | "customer";
type Status = "pending" | "active" | "banned";

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role: Role;
  status: Status;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  return (session?.user as SessionUser) ?? null;
}

export async function requireAdmin(
  _req: NextRequest
): Promise<SessionUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return user;
}

export async function requireCollaborator(
  _req: NextRequest
): Promise<SessionUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "collaborator")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (user.status !== "active")
    return NextResponse.json({ error: "CTV not active" }, { status: 403 });
  return user;
}

export function isErrorResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
