import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safePath, getPdfDir } from "@/lib/pdf";
import { getBaseUrl } from "@/lib/base-url";
import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";

function isFolderShare(sharePath: string): boolean {
  const pdfDir = getPdfDir();
  if (sharePath === "") return true;
  const abs = path.resolve(path.join(pdfDir, sharePath));
  if (!abs.startsWith(pdfDir + path.sep)) return false;
  return fs.existsSync(abs) && fs.statSync(abs).isDirectory();
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const baseUrl = getBaseUrl(request);
  const shares = await prisma.share.findMany({ orderBy: { createdAt: "desc" } });

  return NextResponse.json(
    shares.map((s: { token: string; path: string; label: string; createdAt: string }) => {
      const folder = isFolderShare(s.path);
      return {
        token: s.token,
        path: s.path,
        label: s.label,
        created_at: s.createdAt,
        url: `${baseUrl}/${folder ? "f" : "s"}/${s.token}`,
        isFolder: folder,
      };
    })
  );
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json().catch(() => ({}));
  const filePath = typeof body.path === "string" ? body.path : "";
  const label = typeof body.label === "string" ? body.label : filePath.split("/").pop() ?? "";

  if (!safePath(filePath)) {
    return NextResponse.json({ error: "PDF nicht gefunden" }, { status: 404 });
  }

  const token = randomBytes(24).toString("base64url");
  await prisma.share.create({ data: { token, path: filePath, label } });

  return NextResponse.json({ token, url: `${getBaseUrl(request)}/s/${token}` });
}
