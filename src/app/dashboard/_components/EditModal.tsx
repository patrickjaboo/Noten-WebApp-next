"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Metadata, Share } from "@/types";

type Props = {
  open: boolean;
  filePath: string | null;
  metadata: Metadata | null;
  shares: Share[];
  onClose: () => void;
  onSaved: (path: string, meta: Metadata) => void;
  onShareCreated: (share: Share) => void;
  onShareDeleted: (token: string) => void;
};

export function EditModal({
  open,
  filePath,
  metadata,
  shares,
  onClose,
  onSaved,
  onShareCreated,
  onShareDeleted,
}: Props) {
  const [composer, setComposer] = useState("");
  const [kategorie, setKategorie] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [shareLabel, setShareLabel] = useState("");
  const [sharingLoading, setSharingLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => {
    if (open && metadata) {
      setComposer(metadata.composer);
      setKategorie(metadata.kategorie);
      setTagsInput(metadata.tags.join(", "));
      setNotes(metadata.notes);
    } else if (open) {
      setComposer("");
      setKategorie("");
      setTagsInput("");
      setNotes("");
    }
    setShareLabel("");
    setCopySuccess(null);
  }, [open, metadata]);

  const fileShares = filePath ? shares.filter((s) => s.path === filePath) : [];

  async function handleSave() {
    if (!filePath) return;
    setSaving(true);
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const meta: Metadata = { composer, kategorie, tags, notes };
    await fetch(`/api/metadata/${filePath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meta),
    });
    setSaving(false);
    onSaved(filePath, meta);
    onClose();
  }

  async function handleCreateShare() {
    if (!filePath) return;
    setSharingLoading(true);
    const label = shareLabel || filePath.split("/").pop() || filePath;
    const res = await fetch("/api/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: filePath, label }),
    });
    if (res.ok) {
      const data = await res.json();
      const newShare: Share = {
        token: data.token,
        path: filePath,
        label,
        created_at: new Date().toISOString(),
        url: data.url,
      };
      onShareCreated(newShare);
      setShareLabel("");
      navigator.clipboard.writeText(data.url).catch(() => {});
      setCopySuccess(data.url);
      setTimeout(() => setCopySuccess(null), 3000);
    }
    setSharingLoading(false);
  }

  async function handleDeleteShare(token: string) {
    await fetch(`/api/shares/${token}`, { method: "DELETE" });
    onShareDeleted(token);
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopySuccess(url);
    setTimeout(() => setCopySuccess(null), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader className="pr-8">
          <DialogTitle className="text-sm font-mono break-all leading-snug">
            {filePath ?? ""}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="composer">Komponist</Label>
            <Input
              id="composer"
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              placeholder="z.B. Bach, Johann Sebastian"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="kategorie">Kategorie</Label>
            <Input
              id="kategorie"
              value={kategorie}
              onChange={(e) => setKategorie(e.target.value)}
              placeholder="z.B. Klassik, Kirchenlied, Pop"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="tags">Tags (kommagetrennt)</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="z.B. Klassik, Kirchenlied, Solo"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Beliebige Notizen..."
            />
          </div>

          {/* Share Links */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Öffentliche Links
            </p>

            {fileShares.length > 0 && (
              <ul className="space-y-2">
                {fileShares.map((s) => (
                  <li
                    key={s.token}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <button
                      onClick={() => copyUrl(s.url)}
                      className="text-blue-600 hover:underline truncate text-left"
                      title="Link kopieren"
                    >
                      {copySuccess === s.url ? "✓ Kopiert!" : s.label || s.url}
                    </button>
                    <button
                      onClick={() => handleDeleteShare(s.token)}
                      className="text-red-400 hover:text-red-600 shrink-0"
                      title="Link löschen"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2">
              <Input
                value={shareLabel}
                onChange={(e) => setShareLabel(e.target.value)}
                placeholder="Label (optional)"
                className="text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateShare}
                disabled={sharingLoading}
              >
                {sharingLoading ? "…" : "Link erstellen"}
              </Button>
            </div>
            {copySuccess && !fileShares.find((s) => s.url === copySuccess) && (
              <p className="text-xs text-green-600">
                ✓ Link kopiert: {copySuccess}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Speichern…" : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
