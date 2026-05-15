"use client";

import { useState } from "react";
import { PdfFile, MetadataMap, Share } from "@/types";
import { Filter } from "../page";
import { getTagColor } from "./TagBadge";
import { Tag, Link2, X, FileText, Check } from "lucide-react";

type Props = {
  files: PdfFile[];
  meta: MetadataMap;
  shares: Share[];
  activeFilter: Filter;
  onFilterChange: (f: Filter) => void;
  onShareCreated: (share: Share) => void;
  onShareDeleted: (token: string) => void;
};

export function Sidebar({
  files,
  meta,
  shares,
  activeFilter,
  onFilterChange,
  onShareCreated,
  onShareDeleted,
}: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const kategorieCounts: Record<string, number> = {};
  for (const file of files) {
    const k = meta[file.path]?.kategorie;
    if (k) kategorieCounts[k] = (kategorieCounts[k] ?? 0) + 1;
  }
  const sortedKategorien = Object.entries(kategorieCounts).sort((a, b) => a[0].localeCompare(b[0]));

  const tagCounts: Record<string, number> = {};
  for (const file of files) {
    for (const tag of meta[file.path]?.tags ?? []) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }
  const sortedTags = Object.entries(tagCounts).sort((a, b) => a[0].localeCompare(b[0]));

  function isActive(f: Filter) {
    if (f.type !== activeFilter.type) return false;
    if (f.type === "all") return true;
    return (f as { type: string; value: string }).value ===
      (activeFilter as { type: string; value: string }).value;
  }

  function folderShareFor(folderPath: string): Share | undefined {
    return shares.find((s) => s.isFolder && s.path === folderPath);
  }

  function tagShareFor(tag: string): Share | undefined {
    return shares.find((s) => s.isTag && s.path === `tag:${tag}`);
  }

  async function handleTagShare(e: React.MouseEvent, tag: string) {
    e.stopPropagation();
    const existing = tagShareFor(tag);
    if (existing) {
      await navigator.clipboard.writeText(existing.url).catch(() => {});
      setCopied(`tag:${tag}`);
      setTimeout(() => setCopied(null), 2000);
      return;
    }
    const res = await fetch("/api/shares/tag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag }),
    });
    if (res.ok) {
      const data = await res.json() as { token: string; url: string };
      onShareCreated({ token: data.token, path: `tag:${tag}`, label: tag, created_at: new Date().toISOString(), url: data.url, isTag: true });
      await navigator.clipboard.writeText(data.url).catch(() => {});
      setCopied(`tag:${tag}`);
      setTimeout(() => setCopied(null), 2000);
    }
  }

  async function handleFolderShare(e: React.MouseEvent, folderPath: string, label: string) {
    e.stopPropagation();
    const existing = folderShareFor(folderPath);
    if (existing) {
      await navigator.clipboard.writeText(existing.url).catch(() => {});
      setCopied(folderPath);
      setTimeout(() => setCopied(null), 2000);
      return;
    }

    const res = await fetch("/api/shares/folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: folderPath, label }),
    });
    if (res.ok) {
      const data = await res.json() as { token: string; url: string };
      const newShare: Share = {
        token: data.token,
        path: folderPath,
        label,
        created_at: new Date().toISOString(),
        url: data.url,
        isFolder: true,
      };
      onShareCreated(newShare);
      await navigator.clipboard.writeText(data.url).catch(() => {});
      setCopied(folderPath);
      setTimeout(() => setCopied(null), 2000);
    }
  }

  async function deleteShare(token: string) {
    await fetch(`/api/shares/${token}`, { method: "DELETE" });
    onShareDeleted(token);
  }

  const fileShares = shares.filter((s) => !s.isFolder);

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-slate-200 bg-white overflow-y-auto">
      <div className="p-3 space-y-1">
        {/* All files */}
        <button
          onClick={() => onFilterChange({ type: "all" })}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
            isActive({ type: "all" })
              ? "bg-indigo-50 text-indigo-700 font-medium"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <FileText className="w-4 h-4 shrink-0 opacity-60" />
          <span className="flex-1 truncate">Alle Dateien</span>
          <span className={`text-xs tabular-nums ${isActive({ type: "all" }) ? "text-indigo-500" : "text-slate-400"}`}>
            {files.length}
          </span>
        </button>
      </div>

      {sortedKategorien.length > 0 && (
        <div className="px-3 pb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
            Kategorien
          </p>
          <div className="space-y-0.5">
            {sortedKategorien.map(([kat, count]) => {
              const active = isActive({ type: "kategorie", value: kat });
              return (
                <button
                  key={kat}
                  onClick={() => onFilterChange({ type: "kategorie", value: kat })}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                    active
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Tag className={`w-4 h-4 shrink-0 ${active ? "text-indigo-500" : "text-slate-400"}`} />
                  <span className="flex-1 truncate">{kat}</span>
                  <span className={`text-xs tabular-nums ${active ? "text-indigo-500" : "text-slate-400"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sortedTags.length > 0 && (
        <div className="px-3 pb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
            Tags
          </p>
          <div className="space-y-0.5">
            {sortedTags.map(([tag, count]) => {
              const active = isActive({ type: "tag", value: tag });
              const dotColor = getTagColor(tag).split(" ")[0];
              const hasShare = !!tagShareFor(tag);
              const isCopied = copied === `tag:${tag}`;
              return (
                <div key={tag} className="group flex items-center gap-1">
                  <button
                    onClick={() => onFilterChange({ type: "tag", value: tag })}
                    className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left min-w-0 ${
                      active
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                    <span className="flex-1 truncate">{tag}</span>
                    <span className={`text-xs tabular-nums ${active ? "text-indigo-500" : "text-slate-400"}`}>
                      {count}
                    </span>
                  </button>
                  <button
                    onClick={(e) => handleTagShare(e, tag)}
                    title={hasShare ? "Link kopieren" : "Link erstellen"}
                    className={`shrink-0 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 ${
                      hasShare
                        ? "text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50"
                        : "text-slate-300 hover:text-indigo-500 hover:bg-indigo-50"
                    }`}
                  >
                    {isCopied
                      ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                      : <Link2 className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {fileShares.length > 0 && (
        <div className="px-3 pb-4 mt-auto">
          <div className="border-t border-slate-100 pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
              Geteilte Links
            </p>
            <div className="space-y-1">
              {fileShares.map((share) => (
                <div key={share.token} className="flex items-center gap-1.5 group px-1">
                  <Link2 className="w-3 h-3 text-slate-300 shrink-0" />
                  <a
                    href={share.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:underline truncate flex-1"
                    title={share.url}
                  >
                    {share.label || share.url}
                  </a>
                  <button
                    onClick={() => deleteShare(share.token)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-300 hover:text-red-500 transition-all shrink-0"
                    title="Link löschen"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
