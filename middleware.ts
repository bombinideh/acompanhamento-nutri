import { NextRequest, NextResponse } from "next/server";
import { homeForRole, readSession, SESSION_COOKIE } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  const path = request.nextUrl.pathname;
  const isLogin = path.startsWith("/login");

  if (!session && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (session && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = homeForRole(session.role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (session?.role === "nutri" && path === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/nutri";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (session?.role === "paciente" && path.startsWith("/nutri")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest|api/login|api/users|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
