import fs from "fs";
import path from "path";

export function getPdfDir(): string {
  return path.resolve(process.env.PDF_DIR ?? "/pdfs");
}

export type PdfFile = {
  path: string;
  folder: string;
};

export function getPdfFiles(): PdfFile[] {
  const pdfDir = getPdfDir();
  const files: PdfFile[] = [];

  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const sorted = entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of sorted) {
      if (entry.name.startsWith(".")) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (path.extname(entry.name).toLowerCase() === ".pdf") {
        const rel = path.relative(pdfDir, fullPath);
        const parts = rel.split(path.sep);
        files.push({
          path: rel.replace(/\\/g, "/"),
          folder: parts.length > 1 ? parts[0] : "",
        });
      }
    }
  }

  walk(pdfDir);
  return files;
}

export function safeFolder(rel: string): string | null {
  const pdfDir = getPdfDir();
  if (rel === "") return pdfDir;
  const target = path.resolve(path.join(pdfDir, rel));
  if (!target.startsWith(pdfDir + path.sep)) return null;
  if (!fs.existsSync(target)) return null;
  if (!fs.statSync(target).isDirectory()) return null;
  return target;
}

export function safePath(rel: string): string | null {
  const pdfDir = getPdfDir();
  const target = path.resolve(path.join(pdfDir, rel));

  // Prevent path traversal: target must start with pdfDir + separator
  if (
    !target.startsWith(pdfDir + path.sep) &&
    target !== pdfDir
  ) {
    return null;
  }

  if (!fs.existsSync(target)) return null;
  if (path.extname(target).toLowerCase() !== ".pdf") return null;

  return target;
}
