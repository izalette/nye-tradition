import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();

  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) {
    // No password configured → admin is open (add ADMIN_SECRET env var to lock it down)
    return NextResponse.next();
  }

  const session = request.cookies.get("nye_admin_session")?.value;
  if (session !== secret) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
