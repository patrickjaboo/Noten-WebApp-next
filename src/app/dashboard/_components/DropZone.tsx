"use client";

import { useState, useRef, DragEvent } from "react";
import { UploadCloud, X, CheckCircle2, AlertCircle } from "lucide-react";

type Props = {
  onUploaded: () => void;
  onClose: () => void;
};

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number; filename: string }
  | { status: "success"; filename: string }
  | { status: "error"; message: string };

export function DropZone({ onUploaded, onClose }: Props) {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [folder, setFolder] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setState({ status: "error", message: "Nur PDF-Dateien erlaubt." });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setState({ status: "error", message: "Datei zu groß (max. 50 MB)." });
      return;
    }

    setState({ status: "uploading", progress: 0, filename: file.name });

    const formData = new FormData();
    formData.append("file", file);
    if (folder.trim()) formData.append("folder", folder.trim());

    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setState({
            status: "uploading",
            progress: Math.round((e.loaded / e.total) * 100),
            filename: file.name,
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          setState({ status: "success", filename: file.name });
          onUploaded();
          setTimeout(() => setState({ status: "idle" }), 2500);
        } else {
          let msg = "Upload fehlgeschlagen.";
          try { msg = (JSON.parse(xhr.responseText) as { error: string }).error; } catch {}
          setState({ status: "error", message: msg });
        }
        resolve();
      };

      xhr.onerror = () => {
        setState({ status: "error", message: "Netzwerkfehler beim Upload." });
        resolve();
      };

      xhr.send(formData);
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  const uploading = state.status === "uploading";

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm font-medium text-slate-700">PDFs hochladen</span>
          <div className="flex-1" />
          <input
            type="text"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="Ordner (optional)"
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-indigo-400 w-40"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl transition-colors ${
            dragging
              ? "border-indigo-400 bg-indigo-50"
              : uploading
              ? "border-slate-200 bg-slate-50 cursor-default"
              : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50 cursor-pointer"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex items-center gap-4 px-5 py-4">
            {state.status === "idle" && (
              <>
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  <UploadCloud className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    PDF hierher ziehen oder{" "}
                    <span className="text-indigo-600">Datei auswählen</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Nur PDF · max. 50 MB</p>
                </div>
              </>
            )}

            {state.status === "uploading" && (
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-700 truncate">{state.filename}</p>
                  <span className="text-xs text-slate-400 shrink-0 ml-3">{state.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-1.5 rounded-full transition-all duration-200"
                    style={{ width: `${state.progress}%` }}
                  />
                </div>
              </div>
            )}

            {state.status === "success" && (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium truncate">{state.filename} erfolgreich hochgeladen</span>
              </div>
            )}

            {state.status === "error" && (
              <div className="flex items-center gap-3 flex-1">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-600 flex-1">{state.message}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setState({ status: "idle" }); }}
                  className="text-xs text-slate-500 hover:text-slate-700 underline shrink-0"
                >
                  Erneut versuchen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
