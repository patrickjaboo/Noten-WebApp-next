import { prisma } from "@/lib/db";
import { getPdfDir } from "@/lib/pdf";
import fs from "fs";
import path from "path";
import { Music, FileText, Download } from "lucide-react";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ token: string }> };

const APP_TITLE = process.env.NEXT_PUBLIC_APP_TITLE ?? "Noten-Verwaltung";

export default async function FolderSharePage({ params }: Props) {
  const { token } = await params;

  const share = await prisma.share.findUnique({ where: { token } });
  if (!share) notFound();

  const pdfDir = getPdfDir();
  const folderAbs = share.path === ""
    ? pdfDir
    : path.resolve(path.join(pdfDir, share.path));

  if (folderAbs !== pdfDir && !folderAbs.startsWith(pdfDir + path.sep)) notFound();
  if (!fs.existsSync(folderAbs) || !fs.statSync(folderAbs).isDirectory()) notFound();

  const entries = fs.readdirSync(folderAbs, { withFileTypes: true });
  const pdfs = entries
    .filter((e) => e.isFile() && path.extname(e.name).toLowerCase() === ".pdf")
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e) => e.name);

  const folderLabel = share.label || share.path || "Stammverzeichnis";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#0f172a] text-white px-5 py-3 flex items-center gap-3 shadow-lg">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
          <Music className="w-4 h-4 text-indigo-300" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">{APP_TITLE}</p>
          <p className="text-xs text-slate-400">Geteilter Ordner</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="text-xl font-semibold text-slate-800 mb-1">{folderLabel}</h1>
        <p className="text-sm text-slate-500 mb-6">
          {pdfs.length} {pdfs.length === 1 ? "Datei" : "Dateien"}
        </p>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {pdfs.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Keine PDFs in diesem Ordner
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pdfs.map((name) => (
                <li key={name}>
                  <a
                    href={`/f/${token}/${encodeURIComponent(name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors group"
                  >
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="flex-1 text-sm font-medium text-indigo-600 group-hover:text-indigo-800">
                      {name}
                    </span>
                    <Download className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          Bereitgestellt über {APP_TITLE}
        </p>
      </main>
    </div>
  );
}
