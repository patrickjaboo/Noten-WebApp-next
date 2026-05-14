"use client";

import { useState, useRef, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UploadResult = {
  path: string;
  filename: string;
  folder: string;
};

type Props = {
  onUploaded: (result: UploadResult) => void;
};

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number; filename: string }
  | { status: "success"; filename: string }
  | { status: "error"; message: string };

export function UploadButton({ onUploaded }: Props) {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [folder, setFolder] = useState("");
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);
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

    return new Promise<void>((resolve) => {
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
          const result = JSON.parse(xhr.responseText) as UploadResult;
          setState({ status: "success", filename: file.name });
          onUploaded(result);
          setTimeout(() => {
            setState({ status: "idle" });
            setExpanded(false);
          }, 2000);
        } else {
          let msg = "Upload fehlgeschlagen.";
          try {
            msg = (JSON.parse(xhr.responseText) as { error: string }).error;
          } catch {}
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

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  if (!expanded && state.status === "idle") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setExpanded(true)}
        className="gap-1"
      >
        <span>↑</span> PDF hochladen
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 border rounded-xl bg-white shadow-sm w-80">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">PDF hochladen</span>
        {state.status === "idle" && (
          <button
            onClick={() => setExpanded(false)}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Folder input */}
      {state.status === "idle" && (
        <div className="space-y-1">
          <Label htmlFor="upload-folder" className="text-xs text-gray-500">
            Ordner (optional)
          </Label>
          <Input
            id="upload-folder"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="z.B. Klassik"
            className="text-sm h-8"
          />
        </div>
      )}

      {/* Drop zone */}
      {state.status === "idle" && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          <div className="text-2xl mb-1">📄</div>
          <p className="text-sm text-gray-600">
            PDF hierher ziehen
          </p>
          <p className="text-xs text-gray-400 mt-0.5">oder klicken zum Auswählen</p>
          <p className="text-xs text-gray-400">max. 50 MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Upload progress */}
      {state.status === "uploading" && (
        <div className="space-y-2">
          <p className="text-sm text-gray-700 truncate">{state.filename}</p>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-200"
              style={{ width: `${state.progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-right">{state.progress}%</p>
        </div>
      )}

      {/* Success */}
      {state.status === "success" && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <span>✓</span>
          <span className="truncate">{state.filename} hochgeladen</span>
        </div>
      )}

      {/* Error */}
      {state.status === "error" && (
        <div className="space-y-2">
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
            {state.message}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setState({ status: "idle" })}
          >
            Erneut versuchen
          </Button>
        </div>
      )}
    </div>
  );
}
