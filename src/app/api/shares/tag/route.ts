import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBaseUrl } from "@/lib/base-url";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json().catch(() => ({}));
  const tag = typeof body.tag === "string" ? body.tag.trim() : "";
  if (!tag) return NextResponse.json({ error: "Tag fehlt" }, { status: 400 });

  const token = randomBytes(24).toString("base64url");
  await prisma.share.create({ data: { token, path: `tag:${tag}`, label: tag } });

  return NextResponse.json({ token, url: `${getBaseUrl(request)}/t/${token}` });
}
