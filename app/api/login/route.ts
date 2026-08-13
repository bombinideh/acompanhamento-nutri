import { NextResponse } from "next/server";
import { createSessionToken, homeForRole, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { findUserByEmail } from "@/lib/users";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body?.email || "");
  const password = String(body?.password || "");
  const user = await findUserByEmail(email);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ erro: "E-mail ou senha incorretos." }, { status: 401 });
  }

  const token = await createSessionToken({ userId: user.id, role: user.role });
  const response = NextResponse.json({
    ok: true,
    role: user.role,
    redirect: homeForRole(user.role),
  });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
