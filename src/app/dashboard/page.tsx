"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./_components/Sidebar";
import { FileTable } from "./_components/FileTable";
import { DropZone } from "./_components/DropZone";
import { PdfFile, MetadataMap, Share, Metadata } from "@/types";
import {
  Music,
  Upload,
  FolderPlus,
  RefreshCw,
  LogOut,
  Wifi,
} from "lucide-react";

export type Filter =
  | { type: "all" }
  | { type: "kategorie"; value: string }
  | { type: "tag"; value: string };

const APP_TITLE = process.env.NEXT_PUBLIC_APP_TITLE ?? "Noten-Verwaltung";

export default function DashboardPage() {
  const router = useRouter();
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [meta, setMeta] = useState<MetadataMap>({});
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Filter>({ type: "all" });
  const [showDropZone, setShowDropZone] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [reloading, setReloading] = useState(false);

  const loadAll = useCallback(async () => {
    const [filesRes, metaRes, sharesRes] = await Promise.all([
      fetch("/api/files"),
      fetch("/api/metadata"),
      fetch("/api/shares"),
    ]);
    if (filesRes.status === 401) { router.push("/login"); return; }
    const [filesData, metaData, sharesData] = await Promise.all([
      filesRes.json(),
      metaRes.json(),
      sharesRes.json(),
    ]);
    setFiles(filesData);
    setMeta(metaData);
    setShares(sharesData);
    setLoading(false);
  }, [router]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleReload() {
    setReloading(true);
    await loadAll();
    setReloading(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolderName.trim() }),
    });
    if (res.ok) {
      setNewFolderName("");
      setShowFolderInput(false);
      await loadAll();
    }
  }

  function handleMetaUpdate(path: string, updatedMeta: Metadata) {
    setMeta((prev) => ({ ...prev, [path]: updatedMeta }));
  }

  function handleUploaded() {
    loadAll();
    setShowDropZone(false);
  }

  function handleFileDeleted(filePath: string) {
    setFiles((prev) => prev.filter((f) => f.path !== filePath));
    setMeta((prev) => { const next = { ...prev }; delete next[filePath]; return next; });
    setShares((prev) => prev.filter((s) => s.path !== filePath));
  }

  function handleShareCreated(share: Share) {
    setShares((prev) => [share, ...prev]);
  }

  function handleShareDeleted(token: string) {
    setShares((prev) => prev.filter((s) => s.token !== token));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-400">
          <Music className="w-5 h-5 animate-pulse" />
          <span className="text-sm">Lade Noten…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#0f172a] text-white px-5 py-3 flex items-center justify-between shadow-lg border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Music className="w-4 h-4 text-indigo-300" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight text-white">{APP_TITLE}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-slate-400">{files.length} Noten</span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <Wifi className="w-3 h-3" /> Online
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowDropZone((v) => !v); setShowFolderInput(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showDropZone
                ? "bg-indigo-500 text-white"
                : "bg-white/10 text-white/80 hover:bg-white/15"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            PDFs hochladen
          </button>

          {showFolderInput ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") { setShowFolderInput(false); setNewFolderName(""); }
                }}
                placeholder="Ordnername…"
                className="px-2 py-1.5 rounded-lg bg-white/10 text-white placeholder-white/40 text-xs border border-white/20 focus:outline-none focus:border-indigo-400 w-36"
              />
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-2 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-medium disabled:opacity-40"
              >
                ✓
              </button>
              <button
                onClick={() => { setShowFolderInput(false); setNewFolderName(""); }}
                className="px-2 py-1.5 rounded-lg bg-white/10 text-white/70 text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setShowFolderInput(true); setShowDropZone(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white/80 hover:bg-white/15 transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              Neuer Ordner
            </button>
          )}

          <button
            onClick={handleReload}
            disabled={reloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white/80 hover:bg-white/15 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reloading ? "animate-spin" : ""}`} />
            Neu laden
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white/70 hover:bg-white/15 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Abmelden
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 gap-0 overflow-hidden">
        <Sidebar
          files={files}
          meta={meta}
          shares={shares}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onShareCreated={handleShareCreated}
          onShareDeleted={handleShareDeleted}
        />

        <main className="flex-1 flex flex-col min-w-0 overflow-auto">
          {showDropZone && (
            <DropZone onUploaded={handleUploaded} onClose={() => setShowDropZone(false)} />
          )}
          <FileTable
            files={files}
            meta={meta}
            shares={shares}
            activeFilter={activeFilter}
            onMetaUpdate={handleMetaUpdate}
            onFileDeleted={handleFileDeleted}
            onShareCreated={handleShareCreated}
            onShareDeleted={handleShareDeleted}
          />
        </main>
      </div>
    </div>
  );
}
