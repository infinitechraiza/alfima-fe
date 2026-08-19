"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Image as ImageIcon,
  Award,
  Video,
  Plus,
  Trash2,
  X,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface GalleryItem {
  id: number;
  url: string;
  caption?: string;
}
interface CertItem {
  id: number;
  url: string;
  title?: string;
}
interface VideoItem {
  id: number;
  url: string;
  title?: string;
}

type MediaTab = "gallery" | "certificates" | "videos";

// Chunk size: 5 MB — safely under any nginx/php limit
const CHUNK_SIZE = 3 * 1024 * 1024;

// ─── Auth helper ─────────────────────────────────────────────────────────────
function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token =
    localStorage.getItem("auth_token") ?? localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Chunked video uploader ───────────────────────────────────────────────────
async function uploadVideoChunked(
  file: File,
  userId: number,
  title: string,
  onProgress: (pct: number) => void,
): Promise<void> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    const fd = new FormData();
    fd.append("upload_id", uploadId);
    fd.append("chunk_index", String(i));
    fd.append("total_chunks", String(totalChunks));
    fd.append("file_name", file.name);
    fd.append("user_id", String(userId));
    fd.append("title", title);
    fd.append("chunk", chunk, file.name);

    const res = await fetch("/api/admin/videos/chunk", {
      method: "POST",
      headers: getAuthHeaders(), // no Content-Type — browser sets multipart boundary
      body: fd,
    });

    if (!res.ok) {
      let msg = `Chunk ${i + 1}/${totalChunks} failed`;
      try {
        const d = await res.json();
        if (d.message) msg = d.message;
      } catch {
        /* non-JSON */
      }
      throw new Error(msg);
    }

    onProgress(Math.round(((i + 1) / totalChunks) * 100));
  }
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({
  msg,
  type,
  onClose,
}: {
  msg: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-semibold shadow-2xl animate-slideUp
      ${
        type === "success"
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          : "bg-red-500/10 border-red-500/30 text-red-300"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
      )}
      {msg}
    </div>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({
  tab,
  userId,
  onClose,
  onSuccess,
}: {
  tab: MediaTab;
  userId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );
  const [uploadStatus, setUploadStatus] = useState<
    Record<string, "pending" | "uploading" | "done" | "error">
  >({});
  const fileRef = useRef<HTMLInputElement>(null);

  const accept =
    tab === "videos" ? "video/mp4,video/mov,video/avi,video/webm" : "image/*";
  const labelPlaceholder =
    tab === "gallery" ? "Caption (optional)" : "Title (optional)";
  const labelKey = tab === "gallery" ? "caption" : "title";
  const tabLabel =
    tab === "gallery"
      ? "Gallery Image"
      : tab === "certificates"
        ? "Certificate"
        : "Video";
  const isMultiFile = tab !== "videos";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []);
    setFiles(
      isMultiFile ? (prev) => [...prev, ...newFiles] : newFiles.slice(0, 1),
    );
    setError("");
  };

  const removeFile = (idx: number) => {
    const name = files[idx].name;
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setLabels((prev) => {
      const n = { ...prev };
      delete n[name];
      return n;
    });
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError("Please choose at least one file.");
      return;
    }
    setError("");
    setUploading(true);

    const initProgress: Record<string, number> = {};
    const initStatus: Record<
      string,
      "pending" | "uploading" | "done" | "error"
    > = {};
    files.forEach((f) => {
      initProgress[f.name] = 0;
      initStatus[f.name] = "pending";
    });
    setUploadProgress(initProgress);
    setUploadStatus(initStatus);

    const errors: string[] = [];

    for (const file of files) {
      const fileName = file.name;
      setUploadStatus((prev) => ({ ...prev, [fileName]: "uploading" }));

      try {
        if (tab === "videos") {
          // ── Chunked upload — bypasses 413 ──────────────────────────────
          await uploadVideoChunked(
            file,
            userId,
            labels[fileName] ?? "",
            (pct) =>
              setUploadProgress((prev) => ({ ...prev, [fileName]: pct })),
          );
        } else {
          // ── Regular image upload ────────────────────────────────────────
          const fd = new FormData();
          fd.append("user_id", String(userId));
          fd.append("image", file);
          const label = labels[fileName];
          if (label) fd.append(labelKey, label);

          const url =
            tab === "gallery"
              ? "/api/admin/gallery"
              : "/api/admin/certificates";
          const res = await fetch(url, {
            method: "POST",
            headers: getAuthHeaders(),
            body: fd,
          });

          if (!res.ok) {
            let msg = "Upload failed";
            try {
              const d = await res.json();
              if (d.errors)
                msg = Object.values(d.errors as Record<string, string[]>)
                  .flat()
                  .join(" ");
              else if (d.message) msg = d.message;
            } catch {
              /* non-JSON */
            }
            throw new Error(msg);
          }

          setUploadProgress((prev) => ({ ...prev, [fileName]: 100 }));
        }

        setUploadStatus((prev) => ({ ...prev, [fileName]: "done" }));
      } catch (e: unknown) {
        setUploadStatus((prev) => ({ ...prev, [fileName]: "error" }));
        errors.push(
          e instanceof Error
            ? `${fileName}: ${e.message}`
            : `${fileName}: Upload failed`,
        );
      }
    }

    setUploading(false);

    if (errors.length > 0) {
      setError(errors.join("\n"));
    } else {
      onSuccess();
      onClose();
    }
  };

  const videoFile = files[0];
  const videoSizeMB = videoFile
    ? (videoFile.size / 1024 / 1024).toFixed(1)
    : null;
  const videoChunks = videoFile ? Math.ceil(videoFile.size / CHUNK_SIZE) : 0;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
      />
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div
          className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
          style={{
            background: "rgba(20,8,8,0.95)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0"
            style={{
              background:
                "linear-gradient(135deg,rgba(127,29,29,0.6),rgba(192,57,43,0.4))",
            }}
          >
            <h3 className="text-white font-bold text-base">
              Add {tabLabel}
              {isMultiFile && "s"}
            </h3>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all flex-shrink-0"
            >
              <X className="w-3.5 h-3.5 text-white/70" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* File picker */}
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                {tab === "videos"
                  ? "Video File *"
                  : `${isMultiFile ? "Image Files" : "Image File"} *`}
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all
                  ${files.length > 0 ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/15 hover:border-white/30 bg-white/3"}`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept={accept}
                  className="hidden"
                  multiple={isMultiFile}
                  onChange={handleFileChange}
                />
                {files.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2.5 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm text-emerald-300 font-semibold">
                        {files.length} {isMultiFile ? "files" : "file"} selected
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {files.map((f, i) => (
                        <div
                          key={i}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-xs text-emerald-300"
                        >
                          <span className="truncate max-w-[150px]">
                            {f.name}
                          </span>
                          {!uploading && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(i);
                              }}
                              className="flex-shrink-0 hover:text-emerald-200 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Video info banner */}
                    {tab === "videos" && videoFile && (
                      <div className="mt-3 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-left">
                        <p className="text-xs text-blue-300 font-semibold">
                          📦 {videoSizeMB} MB → {videoChunks} chunk
                          {videoChunks !== 1 ? "s" : ""} × 5 MB
                        </p>
                        <p className="text-[11px] text-blue-400/60 mt-0.5">
                          Uploaded in small pieces directly to your server — no
                          size limit.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-white/25 mx-auto mb-2" />
                    <p className="text-sm text-white/40 font-medium">
                      Click to choose {isMultiFile ? "files" : "a file"}
                    </p>
                    {tab === "videos" && (
                      <p className="text-[11px] text-amber-400/60 mt-1.5">
                        ⚡ Chunked upload — any size, bypasses server 413 limit
                      </p>
                    )}
                    {isMultiFile && (
                      <p className="text-[11px] text-blue-400/60 mt-1.5">
                        💡 Select multiple{" "}
                        {tab === "gallery" ? "images" : "certificates"} at once
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Labels */}
            {files.length > 0 && (
              <div className="space-y-3 bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                  {labelPlaceholder}
                </p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {files.map((f, i) => (
                    <input
                      key={i}
                      type="text"
                      value={labels[f.name] ?? ""}
                      onChange={(e) =>
                        setLabels((prev) => ({
                          ...prev,
                          [f.name]: e.target.value,
                        }))
                      }
                      placeholder={`${f.name.split(".")[0]}...`}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder-white/25 focus:outline-none focus:border-red-500/50 transition-all"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Progress bars */}
            {Object.keys(uploadProgress).length > 0 && (
              <div className="space-y-3">
                {files.map((f) => {
                  const pct = uploadProgress[f.name] ?? 0;
                  const status = uploadStatus[f.name] ?? "pending";
                  return (
                    <div key={f.name} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-white/60 truncate flex-1">
                          {f.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold flex-shrink-0 ${
                            status === "done"
                              ? "text-emerald-400"
                              : status === "error"
                                ? "text-red-400"
                                : status === "uploading"
                                  ? "text-blue-400"
                                  : "text-white/25"
                          }`}
                        >
                          {status === "done"
                            ? "✓ Done"
                            : status === "error"
                              ? "✗ Failed"
                              : `${pct}%`}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            status === "done"
                              ? "bg-emerald-500"
                              : status === "error"
                                ? "bg-red-500"
                                : "bg-gradient-to-r from-red-600 to-red-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {tab === "videos" &&
                        status === "uploading" &&
                        videoChunks > 1 && (
                          <p className="text-[10px] text-white/30">
                            Chunk {Math.ceil((pct / 100) * videoChunks)} of{" "}
                            {videoChunks}
                          </p>
                        )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <pre className="text-sm text-red-300 font-medium whitespace-pre-wrap break-all">
                  {error}
                </pre>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                disabled={uploading}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm font-semibold transition-all hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={uploading || files.length === 0}
                className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/40"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />{" "}
                    {tab === "videos" ? "Upload Video" : "Upload All"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Delete Confirm ──────────────────────────────────────────────────────────
function ConfirmDelete({
  onConfirm,
  onCancel,
  deleting,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <>
      <div
        onClick={onCancel}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
      />
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm rounded-3xl p-6 shadow-2xl"
          style={{
            background: "rgba(20,8,8,0.97)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div className="flex gap-4 mb-5">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
              <TriangleAlert className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-white font-bold mb-1">Delete Item</p>
              <p className="text-white/40 text-sm">
                This will permanently remove this file.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Lightbox ────────────────────────────────────────────────────────────────
function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/95 z-[300] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <img
        src={src}
        alt=""
        className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
      />
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function Empty({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center py-16 gap-4">
      <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-white/15 flex items-center justify-center">
        <Upload className="w-6 h-6 text-white/15" />
      </div>
      <p className="text-white/30 text-sm font-medium">{label}</p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition-all"
      >
        <Plus className="w-3.5 h-3.5" /> Upload Now
      </button>
    </div>
  );
}

// ─── Skeleton Grid ───────────────────────────────────────────────────────────
function SkeletonGrid({ aspect = "1" }: { aspect?: string }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="rounded-2xl overflow-hidden border border-white/8 animate-pulse"
        >
          <div className="bg-white/5" style={{ aspectRatio: aspect }} />
          <div className="p-2.5">
            <div className="h-3 bg-white/5 rounded-full w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Gallery Tab Content ─────────────────────────────────────────────────────
function GalleryContent({
  items,
  loading,
  onDelete,
  onAdd,
  onLightbox,
}: {
  items: GalleryItem[];
  loading: boolean;
  onDelete: (id: number) => void;
  onAdd: () => void;
  onLightbox: (src: string) => void;
}) {
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const doDelete = async () => {
    if (confirmId === null) return;
    setDeleting(true);
    await onDelete(confirmId);
    setDeleting(false);
    setConfirmId(null);
  };
  if (loading) return <SkeletonGrid />;
  if (items.length === 0)
    return <Empty label="No gallery images yet" onAdd={onAdd} />;
  return (
    <>
      {confirmId !== null && (
        <ConfirmDelete
          onConfirm={doDelete}
          onCancel={() => setConfirmId(null)}
          deleting={deleting}
        />
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {items.map((g) => (
          <div
            key={g.id}
            className="group rounded-2xl overflow-hidden border border-white/10 hover:border-white/25 transition-all"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <div
              className="relative cursor-pointer overflow-hidden"
              style={{ aspectRatio: "1" }}
              onClick={() => onLightbox(g.url)}
            >
              <img
                src={g.url}
                alt={g.caption ?? ""}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
            <div className="px-3 py-2.5 flex items-center justify-between gap-2">
              <p className="text-white/60 text-xs font-medium truncate flex-1">
                {g.caption ?? (
                  <span className="text-white/25 italic">No caption</span>
                )}
              </p>
              <button
                onClick={() => setConfirmId(g.id)}
                className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center flex-shrink-0 transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Certificates Tab Content ────────────────────────────────────────────────
function CertificatesContent({
  items,
  loading,
  onDelete,
  onAdd,
  onLightbox,
}: {
  items: CertItem[];
  loading: boolean;
  onDelete: (id: number) => void;
  onAdd: () => void;
  onLightbox: (src: string) => void;
}) {
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const doDelete = async () => {
    if (confirmId === null) return;
    setDeleting(true);
    await onDelete(confirmId);
    setDeleting(false);
    setConfirmId(null);
  };
  if (loading) return <SkeletonGrid aspect="3/4" />;
  if (items.length === 0)
    return <Empty label="No certificates uploaded yet" onAdd={onAdd} />;
  return (
    <>
      {confirmId !== null && (
        <ConfirmDelete
          onConfirm={doDelete}
          onCancel={() => setConfirmId(null)}
          deleting={deleting}
        />
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {items.map((c) => (
          <div
            key={c.id}
            className="group rounded-2xl overflow-hidden border border-white/10 hover:border-white/25 transition-all"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <div
              className="relative cursor-pointer overflow-hidden"
              style={{ aspectRatio: "3/4" }}
              onClick={() => onLightbox(c.url)}
            >
              <img
                src={c.url}
                alt={c.title ?? ""}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
            <div className="px-3 py-2.5 flex items-center justify-between gap-2">
              <p className="text-white/60 text-xs font-medium truncate flex-1">
                {c.title ?? (
                  <span className="text-white/25 italic">No title</span>
                )}
              </p>
              <button
                onClick={() => setConfirmId(c.id)}
                className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center flex-shrink-0 transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Videos Tab Content ──────────────────────────────────────────────────────
function VideosContent({
  items,
  loading,
  onDelete,
  onAdd,
}: {
  items: VideoItem[];
  loading: boolean;
  onDelete: (id: number) => void;
  onAdd: () => void;
}) {
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const doDelete = async () => {
    if (confirmId === null) return;
    setDeleting(true);
    await onDelete(confirmId);
    setDeleting(false);
    setConfirmId(null);
  };
  if (loading)
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl overflow-hidden border border-white/8 animate-pulse"
          >
            <div className="bg-white/5" style={{ aspectRatio: "16/9" }} />
            <div className="p-3">
              <div className="h-3 bg-white/5 rounded-full w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  if (items.length === 0)
    return <Empty label="No videos uploaded yet" onAdd={onAdd} />;
  return (
    <>
      {confirmId !== null && (
        <ConfirmDelete
          onConfirm={doDelete}
          onCancel={() => setConfirmId(null)}
          deleting={deleting}
        />
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((v) => (
          <div
            key={v.id}
            className="group rounded-2xl overflow-hidden border border-white/10 hover:border-white/25 transition-all"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <video
              src={v.url}
              controls
              className="w-full"
              style={{
                aspectRatio: "16/9",
                display: "block",
                background: "#000",
              }}
            />
            <div className="px-3 py-2.5 flex items-center justify-between gap-2">
              <p className="text-white/60 text-xs font-medium truncate flex-1">
                {v.title ?? (
                  <span className="text-white/25 italic">No title</span>
                )}
              </p>
              <button
                onClick={() => setConfirmId(v.id)}
                className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center flex-shrink-0 transition-all"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Main MediaPanel ─────────────────────────────────────────────────────────
export default function MediaPanel({ userId }: { userId: number }) {
  const [tab, setTab] = useState<MediaTab>("gallery");
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [certs, setCerts] = useState<CertItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loadingG, setLoadingG] = useState(true);
  const [loadingC, setLoadingC] = useState(true);
  const [loadingV, setLoadingV] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") =>
    setToast({ msg, type });

  const loadGallery = useCallback(() => {
    setLoadingG(true);
    fetch(`/api/agents/${userId}/gallery`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => setGallery(d.data ?? d ?? []))
      .catch(() => showToast("Failed to load gallery", "error"))
      .finally(() => setLoadingG(false));
  }, [userId]);

  const loadCerts = useCallback(() => {
    setLoadingC(true);
    fetch(`/api/agents/${userId}/certificates`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => setCerts(d.data ?? d ?? []))
      .catch(() => showToast("Failed to load certificates", "error"))
      .finally(() => setLoadingC(false));
  }, [userId]);

  const loadVideos = useCallback(() => {
    setLoadingV(true);
    fetch(`/api/agents/${userId}/videos`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => setVideos(d.data ?? d ?? []))
      .catch(() => showToast("Failed to load videos", "error"))
      .finally(() => setLoadingV(false));
  }, [userId]);

  useEffect(() => {
    loadGallery();
    loadCerts();
    loadVideos();
  }, [loadGallery, loadCerts, loadVideos]);

  const handleDelete = async (type: MediaTab, id: number) => {
    try {
      const url =
        type === "gallery"
          ? `/api/admin/gallery/${id}`
          : type === "certificates"
            ? `/api/admin/certificates/${id}`
            : `/api/admin/videos/${id}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error();
      if (type === "gallery") setGallery((p) => p.filter((i) => i.id !== id));
      if (type === "certificates")
        setCerts((p) => p.filter((i) => i.id !== id));
      if (type === "videos") setVideos((p) => p.filter((i) => i.id !== id));
      showToast("Deleted successfully");
    } catch {
      showToast("Delete failed", "error");
    }
  };

  const handleUploadSuccess = () => {
    showToast("Uploaded successfully!");
    if (tab === "gallery") loadGallery();
    if (tab === "certificates") loadCerts();
    if (tab === "videos") loadVideos();
  };

  const tabs: {
    key: MediaTab;
    label: string;
    icon: React.ReactNode;
    count: number;
  }[] = [
    {
      key: "gallery",
      label: "Gallery",
      icon: <ImageIcon className="w-4 h-4" />,
      count: gallery.length,
    },
    {
      key: "certificates",
      label: "Certificates",
      icon: <Award className="w-4 h-4" />,
      count: certs.length,
    },
    {
      key: "videos",
      label: "Videos",
      icon: <Video className="w-4 h-4" />,
      count: videos.length,
    },
  ];

  return (
    <div>
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {lightbox && (
        <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
      )}
      {showUpload && (
        <UploadModal
          tab={tab}
          userId={userId}
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">My Media</h2>
          <p className="text-white/40 text-xs mt-0.5">
            Manage your gallery images, certificates, and videos
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              loadGallery();
              loadCerts();
              loadVideos();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white text-xs font-semibold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-900/40"
          >
            <Plus className="w-3.5 h-3.5" />
            Add{" "}
            {tab === "gallery"
              ? "Image"
              : tab === "certificates"
                ? "Certificate"
                : "Video"}
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          {
            label: "Gallery",
            value: gallery.length,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
          },
          {
            label: "Certificates",
            value: certs.length,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
          },
          {
            label: "Videos",
            value: videos.length,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.bg} border ${s.border} rounded-2xl py-3.5 px-4`}
          >
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-white/30 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex border-b border-white/10">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-all border-b-2
                ${
                  tab === t.key
                    ? "text-white border-red-600 bg-white/5"
                    : "text-white/35 border-transparent hover:text-white/60 hover:bg-white/3"
                }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
              {t.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${tab === t.key ? "bg-red-800/50 text-red-300" : "bg-white/10 text-white/30"}`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "gallery" && (
            <GalleryContent
              items={gallery}
              loading={loadingG}
              onDelete={(id) => handleDelete("gallery", id)}
              onAdd={() => setShowUpload(true)}
              onLightbox={setLightbox}
            />
          )}
          {tab === "certificates" && (
            <CertificatesContent
              items={certs}
              loading={loadingC}
              onDelete={(id) => handleDelete("certificates", id)}
              onAdd={() => setShowUpload(true)}
              onLightbox={setLightbox}
            />
          )}
          {tab === "videos" && (
            <VideosContent
              items={videos}
              loading={loadingV}
              onDelete={(id) => handleDelete("videos", id)}
              onAdd={() => setShowUpload(true)}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from{transform:translateY(12px);opacity:0} to{transform:translateY(0);opacity:1} }
        .animate-slideUp { animation: slideUp 0.25s ease forwards; }
      `}</style>
    </div>
  );
}
