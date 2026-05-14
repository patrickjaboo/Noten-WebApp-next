import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPdfDir } from "@/lib/pdf";
import fs from "fs";
import path from "path";

function sanitizeFolderName(name: string): string {
  return name
    .replace(/[^\w\s\-_äöüÄÖÜß]/g, "_")
    .replace(/\.{2,}/g, "_")
    .trim()
    .replace(/^\./, "_")
    .slice(0, 64);
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json().catch(() => ({}));
  const rawName = typeof body.name === "string" ? body.name.trim() : "";
  if (!rawName) {
    return NextResponse.json({ error: "Ordnername fehlt" }, { status: 400 });
  }

  const safeName = sanitizeFolderName(rawName);
  const pdfDir = getPdfDir();
  const targetDir = path.resolve(path.join(pdfDir, safeName));

  if (!targetDir.startsWith(pdfDir + path.sep) && targetDir !== pdfDir) {
    return NextResponse.json({ error: "Ungültiger Ordnername" }, { status: 400 });
  }

  if (fs.existsSync(targetDir)) {
    return NextResponse.json({ error: "Ordner existiert bereits" }, { status: 409 });
  }

  fs.mkdirSync(targetDir, { recursive: true });
  return NextResponse.json({ ok: true, name: safeName });
}
