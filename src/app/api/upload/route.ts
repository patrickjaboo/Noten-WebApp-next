import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPdfDir } from "@/lib/pdf";
import fs from "fs";
import path from "path";

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

function sanitizeFilename(name: string): string {
  // Keep only safe characters: alphanumeric, spaces, hyphens, underscores, dots
  return name
    .replace(/[^\w\s\-_.äöüÄÖÜß]/g, "_")
    .replace(/\.{2,}/g, "_")  // no ".."
    .trim()
    .replace(/^\./, "_");     // no leading dot
}

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

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "multipart/form-data erwartet" }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Fehler beim Lesen der Formulardaten" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Kein 'file'-Feld gefunden" }, { status: 400 });
  }

  // Validate file type
  const originalName = file.name;
  const ext = path.extname(originalName).toLowerCase();
  if (ext !== ".pdf") {
    return NextResponse.json({ error: "Nur PDF-Dateien erlaubt" }, { status: 415 });
  }

  // Validate content type header
  if (file.type && !file.type.includes("pdf")) {
    return NextResponse.json({ error: "Nur PDF-Dateien erlaubt" }, { status: 415 });
  }

  // Validate size
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: `Datei zu groß (max. ${MAX_SIZE / 1024 / 1024} MB)` },
      { status: 413 }
    );
  }

  // Sanitize filename and optional folder
  const safeFilename = sanitizeFilename(path.basename(originalName, ext)) + ".pdf";
  const rawFolder = formData.get("folder");
  const folder =
    typeof rawFolder === "string" && rawFolder.trim()
      ? sanitizeFolderName(rawFolder.trim())
      : "";

  const pdfDir = getPdfDir();
  const targetDir = folder ? path.join(pdfDir, folder) : pdfDir;

  // Ensure target directory stays within pdfDir
  const resolvedTarget = path.resolve(targetDir);
  if (!resolvedTarget.startsWith(pdfDir + path.sep) && resolvedTarget !== pdfDir) {
    return NextResponse.json({ error: "Ungültiger Ordner" }, { status: 400 });
  }

  // Create directory if needed
  fs.mkdirSync(resolvedTarget, { recursive: true });

  const targetFile = path.join(resolvedTarget, safeFilename);

  // Read file content and write to disk
  const arrayBuffer = await file.arrayBuffer();

  // Verify PDF magic bytes (%PDF-)
  const header = Buffer.from(arrayBuffer.slice(0, 5));
  if (header.toString("ascii") !== "%PDF-") {
    return NextResponse.json({ error: "Datei ist keine gültige PDF" }, { status: 415 });
  }

  fs.writeFileSync(targetFile, Buffer.from(arrayBuffer));

  const relativePath = path
    .relative(pdfDir, targetFile)
    .replace(/\\/g, "/");

  return NextResponse.json({
    ok: true,
    path: relativePath,
    filename: safeFilename,
    folder,
    size: file.size,
  });
}
