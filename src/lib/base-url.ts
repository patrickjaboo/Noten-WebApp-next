import { NextRequest } from "next/server";

export function getBaseUrl(request: NextRequest): string {
  // In production use BASE_URL env var if set
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/$/, "");
  }
  // Otherwise derive from request headers (works for any port)
  const host = request.headers.get("host") ?? "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
