import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "habitos_session";
export type Role = "paciente" | "nutri";

export type Session = {
  userId: string;
  role: Role;
};

const WEAK_SECRETS = new Set([
  "dev-secret-local",
  "gere-uma-string-longa-aleatoria",
  "cole-aqui-uma-string-longa-aleatoria",
]);

export function requireAuthSecret() {
  const raw = process.env.AUTH_SECRET?.trim() ?? "";
  if (!raw) {
    throw new Error("AUTH_SECRET não está definida.");
  }
  if (process.env.NODE_ENV === "production" && (raw.length < 32 || WEAK_SECRETS.has(raw))) {
    throw new Error("AUTH_SECRET de produção precisa ser uma string longa aleatória.");
  }
  return raw;
}

function getSecret() {
  return new TextEncoder().encode(requireAuthSecret().padEnd(32, "0").slice(0, 64));
}

export async function createSessionToken(session: Session) {
  return new SignJWT({ role: session.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime("60d")
    .sign(getSecret());
}

export async function readSession(token?: string | null): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return {
      userId: payload.sub,
      role: payload.role === "nutri" ? "nutri" : "paciente",
    };
  } catch {
    return null;
  }
}

export function homeForRole(role: Role) {
  return role === "nutri" ? "/nutri" : "/";
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 24 * 60 * 60,
  };
}
