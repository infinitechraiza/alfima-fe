"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  Trash2,
  Pencil,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  TriangleAlert,
  Plus,
  ToggleLeft,
  ToggleRight,
  Link2,
  FileText,
  Image as ImageIcon,
  File,
  Upload,
  ExternalLink,
  Download,
  FolderOpen,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Document {
  id: number;
  title: string;
  type: "file" | "link";
  link: string | null;
  file_url: string | null;
  original_filename: string | null;
  mime_type: string | null;
  file_size: number | null;
  file_size_human: string | null;
  is_image: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

// Pending file before upload
interface PendingFile {
  id: string;
  file: File;
  title: string;
  preview: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function titleFromFilename(name: string): string {
  return name
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function fileIcon(mimeType: string | null, size = 5) {
  const cls = `w-${size} h-${size}`;
  if (!mimeType) return <File className={cls} />;
  if (mimeType.startsWith("image/")) return <ImageIcon className={cls} />;
  if (mimeType.includes("pdf")) return <FileText className={cls} />;
  return <File className={cls} />;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function ToastList({
  toasts,
  remove,
}: {
  toasts: Toast[];
  remove: (id: number) => void;
}) {
  return (
    <div className="fixed top-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium
            ${
              t.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          style={{ animation: "toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          {t.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {t.message}
          <button
            onClick={() => remove(t.id)}
            className="ml-1 opacity-50 hover:opacity-100"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
        onClick={onCancel}
      />
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4"
          style={{ animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <TriangleAlert className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-slate-800 font-bold text-base">{title}</h3>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Deleting..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Add Document Modal (multi-upload + link) ──────────────────────────────────
function AddDocumentModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (docs: Document[]) => void;
}) {
  const [tab, setTab] = useState<"file" | "link">("file");
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    const newPending: PendingFile[] = arr.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      title: titleFromFilename(f.name),
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
    }));
    setPending((prev) => [...prev, ...newPending]);
  };

  const removePending = (id: string) =>
    setPending((prev) => prev.filter((p) => p.id !== id));

  const updateTitle = (id: string, title: string) =>
    setPending((prev) => prev.map((p) => (p.id === id ? { ...p, title } : p)));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    setErrors({});

    if (tab === "link") {
      if (!linkTitle.trim())
        return setErrors({ linkTitle: "Title is required." });
      if (!linkUrl.trim()) return setErrors({ linkUrl: "URL is required." });

      setSaving(true);
      try {
        const fd = new FormData();
        fd.append("type", "link");
        fd.append("title", linkTitle.trim());
        fd.append("link", linkUrl.trim());
        fd.append("is_active", isActive ? "1" : "0");

        const res = await fetch("/api/admin/documents", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          setErrors({ general: data.message ?? "Something went wrong." });
          return;
        }
        onSaved(data.data);
      } catch {
        setErrors({ general: "Failed to connect to the server." });
      } finally {
        setSaving(false);
      }
      return;
    }

    // File upload
    if (pending.length === 0)
      return setErrors({ files: "Please select at least one file." });

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("type", "file");
      fd.append("is_active", isActive ? "1" : "0");

      pending.forEach((p, i) => {
        fd.append(`files[${i}]`, p.file);
        fd.append(`titles[${i}]`, p.title);
      });

      const res = await fetch("/api/admin/documents", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrors({ general: data.message ?? "Something went wrong." });
        return;
      }
      onSaved(data.data);
    } catch {
      setErrors({ general: "Failed to connect to the server." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
          style={{ animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Add Document</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(["file", "link"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all
                  ${tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {t === "file" ? (
                  <Upload className="w-4 h-4" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                {t === "file" ? "Upload Files" : "Add Link"}
              </button>
            ))}
          </div>

          {/* General error */}
          {errors.general && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {errors.general}
            </p>
          )}

          {/* ── File tab ── */}
          {tab === "file" && (
            <>
              {/* Drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-3 py-10
                  ${
                    dragOver
                      ? "border-red-400 bg-red-50"
                      : "border-slate-200 hover:border-red-400 bg-slate-50"
                  }`}
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <Upload className="w-5 h-5 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    {dragOver ? "Drop files here" : "Click or drag files here"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Images, PDFs, and any file type — up to 50 MB each
                  </p>
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
              />
              {errors.files && (
                <p className="text-xs text-red-500 -mt-4">{errors.files}</p>
              )}

              {/* Pending files list */}
              {pending.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {pending.length} file{pending.length !== 1 ? "s" : ""}{" "}
                    selected
                  </p>
                  {pending.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3"
                    >
                      {/* Thumb */}
                      <div className="w-10 h-10 rounded-lg border border-slate-200 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {p.preview ? (
                          <img
                            src={p.preview}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          fileIcon(p.file.type, 4)
                        )}
                      </div>

                      {/* Editable title */}
                      <input
                        type="text"
                        value={p.title}
                        onChange={(e) => updateTitle(p.id, e.target.value)}
                        className="flex-1 min-w-0 bg-transparent text-sm font-medium text-slate-800 focus:outline-none border-b border-transparent focus:border-slate-300 transition-colors pb-0.5"
                      />

                      {/* Size */}
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {(p.file.size / 1024 / 1024).toFixed(1)} MB
                      </span>

                      {/* Remove */}
                      <button
                        onClick={() => removePending(p.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Link tab ── */}
          {tab === "link" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="e.g. Annual Report 2024"
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all
                    ${errors.linkTitle ? "border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-red-400 focus:ring-red-100"}`}
                />
                {errors.linkTitle && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.linkTitle}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com/document"
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all
                    ${errors.linkUrl ? "border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-red-400 focus:ring-red-100"}`}
                />
                {errors.linkUrl && (
                  <p className="text-xs text-red-500 mt-1">{errors.linkUrl}</p>
                )}
              </div>
            </>
          )}

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Active</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Visible on the public site when active
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-100
                ${isActive ? "bg-emerald-500" : "bg-slate-300"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-1">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving
                ? "Saving..."
                : tab === "file"
                  ? `Upload ${pending.length > 0 ? pending.length + " File" + (pending.length !== 1 ? "s" : "") : ""}`
                  : "Add Link"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Edit Document Modal ───────────────────────────────────────────────────────
function EditDocumentModal({
  document: doc,
  onClose,
  onSaved,
}: {
  document: Document;
  onClose: () => void;
  onSaved: (d: Document) => void;
}) {
  const [title, setTitle] = useState(doc.title);
  const [linkUrl, setLinkUrl] = useState(doc.link ?? "");
  const [isActive, setIsActive] = useState(doc.is_active);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    doc.is_image ? doc.file_url : null,
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) setPreview(URL.createObjectURL(f));
    else setPreview(null);
    setTitle(titleFromFilename(f.name));
  };

  const handleSubmit = async () => {
    setErrors({});
    if (!title.trim()) return setErrors({ title: "Title is required." });
    if (doc.type === "link" && !linkUrl.trim())
      return setErrors({ linkUrl: "URL is required." });

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("is_active", isActive ? "1" : "0");
      if (doc.type === "link") fd.append("link", linkUrl.trim());
      if (file) fd.append("file", file);

      const res = await fetch(`/api/admin/documents/${doc.id}`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrors({ general: data.message ?? "Something went wrong." });
        return;
      }
      onSaved(data.data);
    } catch {
      setErrors({ general: "Failed to connect to the server." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
          style={{ animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Edit Document</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {errors.general && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {errors.general}
            </p>
          )}

          {/* File replacement (only for file-type docs) */}
          {doc.type === "file" && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Replace File (optional)
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                className="relative cursor-pointer group rounded-2xl border-2 border-dashed border-slate-200 hover:border-red-400 transition-colors overflow-hidden bg-slate-50 flex items-center justify-center"
                style={{ height: 120 }}
              >
                {preview ? (
                  <>
                    <img
                      src={preview}
                      alt="preview"
                      className="max-h-full max-w-full object-contain p-4"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-sm font-semibold">
                        Change file
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    {file ? (
                      <>
                        <FileText className="w-6 h-6" />
                        <p className="text-xs">{file.name}</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6" />
                        <p className="text-xs">Click to replace current file</p>
                      </>
                    )}
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={handleFile}
              />
              {!file && doc.original_filename && (
                <p className="text-xs text-slate-400 mt-1.5">
                  Current:{" "}
                  <span className="text-slate-600">
                    {doc.original_filename}
                  </span>
                  {doc.file_size_human && ` (${doc.file_size_human})`}
                </p>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all
                ${errors.title ? "border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-red-400 focus:ring-red-100"}`}
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          {/* URL (link-type only) */}
          {doc.type === "link" && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all
                  ${errors.linkUrl ? "border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-red-400 focus:ring-red-100"}`}
              />
              {errors.linkUrl && (
                <p className="text-xs text-red-500 mt-1">{errors.linkUrl}</p>
              )}
            </div>
          )}

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Active</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Visible on the public site when active
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-100
                ${isActive ? "bg-emerald-500" : "bg-slate-300"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Type badge ─────────────────────────────────────────────────────────────────
function TypeBadge({
  type,
  mimeType,
}: {
  type: "file" | "link";
  mimeType: string | null;
}) {
  if (type === "link") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold">
        <Link2 className="w-3 h-3" /> Link
      </span>
    );
  }

  if (mimeType?.startsWith("image/")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600 text-xs font-semibold">
        <ImageIcon className="w-3 h-3" /> Image
      </span>
    );
  }

  if (mimeType?.includes("pdf")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 text-xs font-semibold">
        <FileText className="w-3 h-3" /> PDF
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
      <File className="w-3 h-3" /> File
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DocumentsAdminPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filtered, setFiltered] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "file" | "link">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Document | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    let list = documents;
    if (filterType !== "all") list = list.filter((d) => d.type === filterType);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) => d.title.toLowerCase().includes(q));
    }
    setFiltered(list);
  }, [search, filterType, documents]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/documents");
      const data = await res.json();
      if (data.success) setDocuments(data.data ?? []);
    } catch {
      addToast("Failed to load documents", "error");
    } finally {
      setLoading(false);
    }
  };

  const addToast = (message: string, type: "success" | "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  };

  const handleSaved = (saved: Document | Document[]) => {
    const arr = Array.isArray(saved) ? saved : [saved];
    setDocuments((prev) => {
      let next = [...prev];
      arr.forEach((s) => {
        const idx = next.findIndex((d) => d.id === s.id);
        if (idx >= 0) next[idx] = s;
        else next = [s, ...next];
      });
      return next;
    });
    addToast(
      arr.length > 1 ? `${arr.length} documents added!` : "Document saved!",
      "success",
    );
    setShowAdd(false);
    setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/documents/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
        addToast("Document deleted", "success");
        setDeleteTarget(null);
      } else {
        addToast(data.message ?? "Failed to delete", "error");
      }
    } catch {
      addToast("Error deleting document", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (doc: Document) => {
    setTogglingId(doc.id);
    try {
      const res = await fetch(`/api/admin/documents/${doc.id}/toggle`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? data.data : d)),
        );
        addToast(
          data.data.is_active
            ? `"${doc.title}" is now active`
            : `"${doc.title}" set to inactive`,
          "success",
        );
      } else {
        addToast(data.message ?? "Failed to update status", "error");
      }
    } catch {
      addToast("Error updating status", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const counts = {
    all: documents.length,
    file: documents.filter((d) => d.type === "file").length,
    link: documents.filter((d) => d.type === "link").length,
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-slate-800">Documents</h1>
            </div>
            <p className="text-slate-500 ml-[52px]">
              {documents.length} document{documents.length !== 1 ? "s" : ""}
              {" · "}
              {counts.file} file{counts.file !== 1 ? "s" : ""}
              {" · "}
              {counts.link} link{counts.link !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Document
          </button>
        </div>

        {/* Filters + Search */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 flex flex-col sm:flex-row gap-4">
          {/* Type filter tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 flex-shrink-0">
            {(["all", "file", "link"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize
                  ${filterType === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {t === "all" ? "All" : t === "file" ? "Files" : "Links"}
                <span
                  className={`ml-1.5 text-xs ${filterType === t ? "text-slate-500" : "text-slate-400"}`}
                >
                  {counts[t]}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <FolderOpen className="w-10 h-10 mb-3 opacity-40" />
              <p className="font-medium">No documents found</p>
              {search && (
                <p className="text-sm mt-1">Try a different search term</p>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                    Size / URL
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Title + icon */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {doc.is_image && doc.file_url ? (
                            <img
                              src={doc.file_url}
                              alt={doc.title}
                              className="w-full h-full object-cover"
                            />
                          ) : doc.type === "link" ? (
                            <Link2 className="w-4 h-4 text-blue-400" />
                          ) : (
                            fileIcon(doc.mime_type, 4)
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm leading-tight">
                            {doc.title}
                          </p>
                          {doc.original_filename && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">
                              {doc.original_filename}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Type badge */}
                    <td className="px-6 py-4">
                      <TypeBadge type={doc.type} mimeType={doc.mime_type} />
                    </td>

                    {/* Size / URL */}
                    <td className="px-6 py-4 hidden md:table-cell">
                      {doc.type === "file" && doc.file_size_human && (
                        <span className="text-sm text-slate-500">
                          {doc.file_size_human}
                        </span>
                      )}
                      {doc.type === "link" && doc.link && (
                        <a
                          href={doc.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline truncate max-w-[200px] block"
                        >
                          {doc.link}
                        </a>
                      )}
                    </td>

                    {/* Status toggle */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(doc)}
                        disabled={togglingId === doc.id}
                        title={
                          doc.is_active
                            ? "Click to deactivate"
                            : "Click to activate"
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all
                          disabled:opacity-60 disabled:cursor-not-allowed
                          ${
                            doc.is_active
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                      >
                        {togglingId === doc.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : doc.is_active ? (
                          <ToggleRight className="w-3.5 h-3.5" />
                        ) : (
                          <ToggleLeft className="w-3.5 h-3.5" />
                        )}
                        {doc.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Open/Download */}
                        {doc.type === "link" && doc.link && (
                          <a
                            href={doc.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-500"
                            title="Open link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {doc.type === "file" && doc.file_url && (
                          <a
                            href={doc.file_url}
                            download={doc.original_filename ?? doc.title}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-500"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          onClick={() => setEditTarget(doc)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-800"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(doc)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAdd && (
        <AddDocumentModal
          onClose={() => setShowAdd(false)}
          onSaved={handleSaved}
        />
      )}

      {editTarget && (
        <EditDocumentModal
          document={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(d) => handleSaved(d)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Document?"
          description={`"${deleteTarget.title}" will be permanently removed. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      <ToastList
        toasts={toasts}
        remove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}
