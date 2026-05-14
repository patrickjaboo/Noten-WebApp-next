"use client";

import { PdfFile, MetadataMap, Share, Metadata } from "@/types";
import { Filter } from "../page";
import { TagBadge } from "./TagBadge";
import { EditModal } from "./EditModal";
import { useState } from "react";
import { Pencil, Link2, Trash2, Search, X, FileMusic } from "lucide-react";

type Props = {
  files: PdfFile[];
  meta: MetadataMap;
  shares: Share[];
  activeFilter: Filter;
  onMetaUpdate: (path: string, meta: Metadata) => void;
  onFileDeleted: (path: string) => void;
  onShareCreated: (share: Share) => void;
  onShareDeleted: (token: string) => void;
};

export function FileTable({
  files,
  meta,
  shares,
  activeFilter,
  onMetaUpdate,
  onFileDeleted,
  onShareCreated,
  onShareDeleted,
}: Props) {
  const [editPath, setEditPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = files.filter((f) => {
    if (activeFilter.type === "folder") return f.folder === activeFilter.value;
    if (activeFilter.type === "tag") return meta[f.path]?.tags?.includes(activeFilter.value) ?? false;
    return true;
  });

  const q = searchQuery.toLowerCase().trim();
  const visible = q
    ? filtered.filter((f) => {
        const m = meta[f.path];
        return (
          f.path.toLowerCase().includes(q) ||
          (m?.composer?.toLowerCase().includes(q) ?? false) ||
          (m?.tags?.some((t) => t.toLowerCase().includes(q)) ?? false) ||
          (m?.notes?.toLowerCase().includes(q) ?? false)
        );
      })
    : filtered;

  function getName(p: string) {
    return p.split("/").pop() ?? p;
  }

  async function handleDelete(path: string) {
    setDeleting(true);
    const res = await fetch(`/api/files/${path}`, { method: "DELETE" });
    setDeleting(false);
    setConfirmDelete(null);
    if (res.ok) onFileDeleted(path);
  }

  const fileShares = editPath ? shares.filter((s) => s.path === editPath) : [];

  return (
    <>
      {/* Search bar */}
      <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Datei, Komponist, Tag…"
            className="w-full pl-8 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <span className="text-xs text-slate-400 tabular-nums shrink-0">
          {visible.length} von {filtered.length}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-5 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Datei</th>
              <th className="px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Ordner</th>
              <th className="px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Komponist</th>
              <th className="px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Tags</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <FileMusic className="w-8 h-8 opacity-30" />
                    <span className="text-sm">
                      {searchQuery ? "Keine Treffer für diese Suche" : "Keine Dateien vorhanden"}
                    </span>
                  </div>
                </td>
              </tr>
            )}
            {visible.map((f) => {
              const m = meta[f.path];
              const hasShare = shares.some((s) => s.path === f.path);
              return (
                <tr
                  key={f.path}
                  className="hover:bg-slate-50 transition-colors group"
                >
                  <td className="px-5 py-3">
                    <a
                      href={`/api/pdf/${f.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      {getName(f.path)}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {f.folder || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-sm">
                    {m?.composer || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {m?.tags?.map((tag) => <TagBadge key={tag} tag={tag} />)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditPath(f.path)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Bearbeiten"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditPath(f.path)}
                        className={`p-1.5 rounded-md transition-colors ${
                          hasShare
                            ? "text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50"
                            : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        }`}
                        title="Links verwalten"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(f.path)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-1">Datei löschen?</h3>
            <p className="text-xs text-slate-500 mb-4 font-mono bg-slate-50 px-2 py-1 rounded truncate">
              {getName(confirmDelete)}
            </p>
            <p className="text-xs text-slate-500 mb-5">
              Die Datei wird unwiderruflich gelöscht. Alle zugehörigen Links werden ebenfalls entfernt.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? "Lösche…" : "Löschen"}
              </button>
            </div>
          </div>
        </div>
      )}

      <EditModal
        open={editPath !== null}
        filePath={editPath}
        metadata={editPath ? (meta[editPath] ?? null) : null}
        shares={fileShares}
        onClose={() => setEditPath(null)}
        onSaved={onMetaUpdate}
        onShareCreated={onShareCreated}
        onShareDeleted={onShareDeleted}
      />
    </>
  );
}
