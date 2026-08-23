import { cookies } from "next/headers";
import { createHmac, scryptSync, randomBytes, timingSafeEqual } from "crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, storedHash] = stored.split(":");
  const hash = scryptSync(password, salt, 64);
  const storedHashBuf = Buffer.from(storedHash, "hex");
  if (hash.length !== storedHashBuf.length) return false;
  return timingSafeEqual(hash, storedHashBuf);
}

// Session token: `${userId}|${hmac(userId, ADMIN_SECRET)}`
export function createSessionToken(userId: string, secret: string): string {
  const sig = createHmac("sha256", secret).update(userId).digest("hex");
  return `${userId}|${sig}`;
}

export function parseSessionToken(token: string, secret: string): string | null {
  const pipe = token.lastIndexOf("|");
  if (pipe === -1) return null;
  const userId = token.slice(0, pipe);
  const sig = token.slice(pipe + 1);
  const expected = createHmac("sha256", secret).update(userId).digest("hex");
  if (sig.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return null;
  } catch {
    return null;
  }
  return userId;
}

export async function getCurrentAdminUserId(): Promise<string | null> {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get("nye_admin_session")?.value;
  if (!token) return null;
  return parseSessionToken(token, secret);
}
