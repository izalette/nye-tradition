/** Public site URL for links in emails and admin hints. */
export function getPublicBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl?.trim()) {
    return envUrl.replace(/\/$/, "");
  }
  if (typeof process.env.VERCEL_URL === "string" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}
