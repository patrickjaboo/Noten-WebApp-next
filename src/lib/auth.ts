import { cookies } from "next/headers";
import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { NextResponse } from "next/server";

export type SessionData = {
  isLoggedIn: boolean;
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "noten_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function requireAuth(): Promise<
  IronSession<SessionData> | NextResponse
> {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  return session;
}

export function checkCredentials(user: string, pass: string): boolean {
  const adminUser = process.env.ADMIN_USER ?? "admin";
  const adminPass = process.env.ADMIN_PASS ?? "changeme";
  // Constant-time comparison to prevent timing attacks
  const userBuf = Buffer.from(user.padEnd(adminUser.length));
  const passBuf = Buffer.from(pass.padEnd(adminPass.length));
  const adminUserBuf = Buffer.from(adminUser.padEnd(user.length));
  const adminPassBuf = Buffer.from(adminPass.padEnd(pass.length));
  return (
    userBuf.length === adminUserBuf.length &&
    passBuf.length === adminPassBuf.length &&
    require("crypto").timingSafeEqual(userBuf, adminUserBuf) &&
    require("crypto").timingSafeEqual(passBuf, adminPassBuf)
  );
}
