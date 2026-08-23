import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  const pipe = token.lastIndexOf("|");
  if (pipe === -1) return false;
  const userId = token.slice(0, pipe);
  const sig = token.slice(pipe + 1);
  if (!/^[0-9a-f]+$/i.test(sig)) return false;

  const encoder = new TextEncoder();
  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
  } catch {
    return false;
  }

  const sigBytes = new Uint8Array(sig.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  return crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(userId));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login" || pathname === "/admin/register") {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) {
    return NextResponse.next();
  }

  const token = request.cookies.get("nye_admin_session")?.value;
  if (!token || !(await verifySessionToken(token, secret))) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
