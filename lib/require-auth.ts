import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSession, SESSION_COOKIE, type Role } from "@/lib/auth";

export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return readSession(token);
}

export async function requireAuth() {
  if (await getSession()) return null;
  return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
}

export async function requireRole(role: Role) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;
  const session = await getSession();
  if (session?.role !== role) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }
  return null;
}
