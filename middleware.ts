import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-constants";

const PUBLIC_PATHS = ["/login", "/register"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path);
  const hasSession = req.cookies.has(SESSION_COOKIE);

  if (!hasSession && !isPublicPath) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
