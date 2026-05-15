import { prisma } from "@/lib/db";
import { getPdfDir } from "@/lib/pdf";
import fs from "fs";
import path from "path";
import { Music, FileText, Download } from "lucide-react";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ token: string }> };

const APP_TITLE = process.env.NEXT_PUBLIC_APP_TITLE ?? "Noten-Verwaltung";

export default async function TagSharePage({ params }: Props) {
  const { token } = await params;

  const share = await prisma.share.findUnique({ where: { token } });
  if (!share || !share.path.startsWith("tag:")) notFound();

  const tag = share.path.slice(4); // strip "tag:"

  // Find all files that have this tag
  const allMeta = await prisma.metadata.findMany();
  const matchingPaths = allMeta
    .filter((m) => {
      try {
        const tags = JSON.parse(m.tags) as string[];
        return tags.includes(tag);
      } catch {
        return false;
      }
    })
    .map((m) => m.path);

  // Verify files still exist on disk
  const pdfDir = getPdfDir();
  const files = matchingPaths
    .filter((rel) => {
      const abs = path.resolve(path.join(pdfDir, rel));
      return abs.startsWith(pdfDir + path.sep) && fs.existsSync(abs);
    })
    .sort();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#0f172a] text-white px-5 py-3 flex items-center gap-3 shadow-lg">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
          <Music className="w-4 h-4 text-indigo-300" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">{APP_TITLE}</p>
          <p className="text-xs text-slate-400">Geteilte Zusammenstellung</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
            {tag}
          </span>
        </div>
        <h1 className="text-xl font-semibold text-slate-800 mb-1">{share.label || tag}</h1>
        <p className="text-sm text-slate-500 mb-6">
          {files.length} {files.length === 1 ? "Datei" : "Dateien"}
        </p>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {files.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Keine Dateien für diesen Tag vorhanden
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {files.map((rel) => {
                const name = rel.split("/").pop() ?? rel;
                return (
                  <li key={rel}>
                    <a
                      href={`/t/${token}/${rel.split("/").map(encodeURIComponent).join("/")}`}
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
                );
              })}
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
