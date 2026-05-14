import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeFolder } from "@/lib/pdf";
import { getBaseUrl } from "@/lib/base-url";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json().catch(() => ({}));
  const folderPath = typeof body.path === "string" ? body.path : "";
  const label = typeof body.label === "string" && body.label
    ? body.label
    : folderPath || "Stammverzeichnis";

  if (safeFolder(folderPath) === null) {
    return NextResponse.json({ error: "Ordner nicht gefunden" }, { status: 404 });
  }

  const token = randomBytes(24).toString("base64url");
  await prisma.share.create({ data: { token, path: folderPath, label } });

  return NextResponse.json({ token, url: `${getBaseUrl(request)}/f/${token}` });
}
