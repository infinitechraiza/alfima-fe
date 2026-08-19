"use client";

import { useEffect, useState, useRef } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  X,
  Upload,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  ImageIcon,
  Star,
  GripVertical,
  ToggleLeft,
  ToggleRight,
  Layers,
  Tag,
  AlignLeft,
  List,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ServiceImage {
  id: number;
  url: string;
  filename: string;
  sort_order: number;
  is_primary: boolean;
}

interface Service {
  id: number;
  label: string;
  tagline: string | null;
  description: string | null;
  highlights: string[];
  icon_name: string | null;
  accent: string | null;
  sort_order: number;
  is_active: boolean;
  thumbnail: string | null;
  images: ServiceImage[];
  created_at: string;
  updated_at: string;
}

type ModalMode = "create" | "edit" | "view" | null;

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

const ACCEPT_ALL_IMAGES =
  "image/*,.avif,.heic,.heif,.jxl,.tiff,.tif,.bmp,.ico,.svg,.webp";

// ── Auth helper ───────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
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
                ? "bg-emerald-950 border-emerald-700/40 text-emerald-300"
                : "bg-red-950 border-red-700/40 text-red-300"
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
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  description: string;
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
              <AlertCircle className="w-5 h-5 text-red-500" />
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
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Highlights editor ─────────────────────────────────────────────────────────

function HighlightsEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onChange([...value, trimmed]);
    setInput("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
          placeholder="Add a highlight bullet..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button
          type="button"
          onClick={add}
          className="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-700 transition-colors"
        >
          Add
        </button>
      </div>
      {value.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {value.map((h, i) => (
            <li
              key={i}
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700"
            >
              <GripVertical className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              <span className="flex-1">{h}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Service Form Modal ────────────────────────────────────────────────────────

function ServiceFormModal({
  initial,
  mode,
  onClose,
  onSaved,
}: {
  initial?: Service | null;
  mode: "create" | "edit";
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ServiceImage[]>(
    initial?.images ?? [],
  );
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);

  const [form, setForm] = useState({
    label: initial?.label ?? "",
    tagline: initial?.tagline ?? "",
    description: initial?.description ?? "",
    sort_order: String(initial?.sort_order ?? 0),
    is_active: initial?.is_active ?? true,
  });
  const [highlights, setHighlights] = useState<string[]>(
    initial?.highlights ?? [],
  );

  const totalImages = existingImages.length + galleryFiles.length;
  const setF = (k: string, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  const inp =
    "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all";
  const lbl =
    "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2";

  // ── FIXED: auth headers on every request ─────────────────────────────────

  const handleDeleteExistingImage = async (imageId: number) => {
    if (!initial?.id) return;
    setDeletingImageId(imageId);
    try {
      const res = await fetch(
        `/api/admin/services/${initial.id}/images/${imageId}`,
        {
          method: "DELETE",
          headers: { ...getAuthHeaders() },
        },
      );
      if (!res.ok) throw new Error();
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      setError("Failed to delete image.");
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleSetPrimary = async (imageId: number) => {
    if (!initial?.id) return;
    try {
      const res = await fetch(
        `/api/admin/services/${initial.id}/images/${imageId}/primary`,
        {
          method: "PATCH",
          headers: { ...getAuthHeaders() },
        },
      );
      if (!res.ok) throw new Error();
      setExistingImages((prev) =>
        prev.map((img) => ({ ...img, is_primary: img.id === imageId })),
      );
    } catch {
      setError("Failed to set primary image.");
    }
  };

  // In ServiceFormModal, replace handleSubmit's fetch:

  const handleSubmit = async () => {
    if (!form.label.trim()) {
      setError("Service label is required.");
      return;
    }
    setLoading(true);
    setError(null);

    const fd = new FormData();
    fd.append("label", form.label);
    fd.append("tagline", form.tagline);
    fd.append("description", form.description);
    fd.append("sort_order", form.sort_order);
    fd.append("is_active", form.is_active ? "1" : "0");
    highlights.forEach((h) => fd.append("highlights[]", h));
    galleryFiles.forEach((f) => fd.append("images[]", f));
    if (mode === "edit") fd.append("_method", "PUT");

    try {
      // ✅ Go direct to Laravel — bypass Next.js body limit entirely
      const base = process.env.NEXT_PUBLIC_API_URL;
      const url =
        mode === "create"
          ? `${base}/api/admin/services`
          : `${base}/api/admin/services/${initial!.id}`;

      const res = await fetch(url, {
        method: "POST",
        body: fd,
        headers: {
          ...getAuthHeaders(), // Bearer token
          Accept: "application/json",
          // ❌ No Content-Type — browser sets multipart boundary automatically
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          (data.message ?? data.errors)
            ? Object.values(data.errors).flat().join(" ")
            : "Something went wrong.",
        );
        return;
      }
      onSaved(mode === "create" ? "Service created!" : "Service updated!");
      onClose();
    } catch (e: any) {
      setError(e.message || "Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 lg:p-8">
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
          style={{ animation: "modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {mode === "create" ? "Add New Service" : "Edit Service"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {mode === "create"
                  ? "Create a new service offering."
                  : "Update the service details below."}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 min-h-full">
              {/* ── Left column ── */}
              <div className="bg-slate-50 p-6 flex flex-col gap-5 border-r border-slate-100">
                {/* Active toggle */}
                <div>
                  <label className={lbl}>Visibility</label>
                  <button
                    type="button"
                    onClick={() => setF("is_active", !form.is_active)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                      form.is_active
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                        : "bg-slate-100 border-slate-200 text-slate-500"
                    }`}
                  >
                    <span>
                      {form.is_active
                        ? "Active (visible)"
                        : "Inactive (hidden)"}
                    </span>
                    {form.is_active ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Sort order */}
                <div>
                  <label className={lbl}>Sort Order</label>
                  <input
                    type="number"
                    className={inp}
                    value={form.sort_order}
                    onChange={(e) => setF("sort_order", e.target.value)}
                    placeholder="0"
                    min={0}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Lower = appears first
                  </p>
                </div>

                {/* Gallery images */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`${lbl} mb-0`}>
                      Images ({totalImages}/10)
                    </label>
                    {galleryFiles.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setGalleryFiles([])}
                        className="text-[10px] text-red-400 hover:text-red-600 font-medium"
                      >
                        Clear new
                      </button>
                    )}
                  </div>

                  {/* Existing images */}
                  {existingImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {existingImages.map((img) => (
                        <div
                          key={img.id}
                          className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                        >
                          <img
                            src={img.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          {img.is_primary && (
                            <div className="absolute top-1 left-1 bg-amber-400 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Star className="w-2 h-2" /> PRIMARY
                            </div>
                          )}
                          {!img.is_primary && (
                            <div className="absolute top-1 left-1 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              SAVED
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                            {!img.is_primary && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimary(img.id)}
                                className="text-[9px] bg-amber-400 text-white px-2 py-1 rounded-lg font-bold"
                              >
                                Set Primary
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteExistingImage(img.id)}
                              disabled={deletingImageId === img.id}
                              className="w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center disabled:opacity-60"
                            >
                              {deletingImageId === img.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <X className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {totalImages < 10 && (
                    <div
                      onClick={() => galleryRef.current?.click()}
                      className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-red-400 cursor-pointer transition-colors bg-white text-center group"
                    >
                      <Upload className="w-5 h-5 text-slate-300 group-hover:text-red-400 mx-auto mb-1 transition-colors" />
                      <p className="text-xs text-slate-400 font-medium">
                        {totalImages === 0
                          ? "Click to select images"
                          : "Click to add more images"}
                      </p>
                      <p className="text-[10px] text-slate-300">
                        Select multiple at once · up to {10 - totalImages} more
                      </p>
                    </div>
                  )}

                  <input
                    ref={galleryRef}
                    type="file"
                    accept={ACCEPT_ALL_IMAGES}
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      const remaining = 10 - totalImages;
                      if (remaining <= 0) return;
                      setGalleryFiles((prev) =>
                        [...prev, ...files].slice(0, prev.length + remaining),
                      );
                      e.target.value = "";
                    }}
                  />

                  {galleryFiles.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {galleryFiles.map((f, i) => {
                        const url = URL.createObjectURL(f);
                        return (
                          <div
                            key={i}
                            className="relative group aspect-square rounded-xl overflow-hidden border border-blue-200 bg-slate-100"
                          >
                            <img
                              src={url}
                              alt={f.name}
                              className="w-full h-full object-cover"
                              onLoad={() => URL.revokeObjectURL(url)}
                            />
                            <div className="absolute top-1 left-1 bg-blue-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                              NEW
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setGalleryFiles((p) =>
                                  p.filter((_, idx) => idx !== i),
                                )
                              }
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Right column ── */}
              <div className="col-span-2 p-6 space-y-5">
                {/* Label */}
                <div>
                  <label className={lbl}>Service Label *</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      className={`${inp} pl-9`}
                      value={form.label}
                      onChange={(e) => setF("label", e.target.value)}
                      placeholder="e.g. Leasing"
                    />
                  </div>
                </div>

                {/* Tagline */}
                <div>
                  <label className={lbl}>Tagline</label>
                  <input
                    className={inp}
                    value={form.tagline}
                    onChange={(e) => setF("tagline", e.target.value)}
                    placeholder="Short & long-term lease solutions"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className={lbl}>Description</label>
                  <div className="relative">
                    <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <textarea
                      className={`${inp} pl-9 resize-none`}
                      rows={4}
                      value={form.description}
                      onChange={(e) => setF("description", e.target.value)}
                      placeholder="Describe this service offering..."
                    />
                  </div>
                </div>

                {/* Highlights */}
                <div>
                  <label className={lbl}>
                    <span className="flex items-center gap-2">
                      <List className="w-3.5 h-3.5" />
                      Highlights / Bullet Points
                      {highlights.length > 0 && (
                        <span className="text-red-500 normal-case font-normal tracking-normal text-xs">
                          {highlights.length} items
                        </span>
                      )}
                    </span>
                  </label>
                  <HighlightsEditor
                    value={highlights}
                    onChange={setHighlights}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-8 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
            <span className="text-xs font-semibold text-slate-500">
              {form.label || "Unnamed service"} · {highlights.length} highlights
            </span>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-red-200"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading
                  ? "Saving..."
                  : mode === "create"
                    ? "+ Create Service"
                    : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── View Modal ────────────────────────────────────────────────────────────────

function ViewModal({
  service,
  onClose,
}: {
  service: Service;
  onClose: () => void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = service.images ?? [];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
          style={{ animation: "modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          {/* Image carousel */}
          {images.length > 0 && (
            <div className="relative h-56 bg-slate-900 flex-shrink-0">
              <img
                src={images[imgIdx]?.url}
                alt={service.label}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg"
              >
                <X className="w-4 h-4 text-slate-700" />
              </button>
              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setImgIdx((i) => (i - 1 + images.length) % images.length)
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImgIdx(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIdx ? "bg-white scale-125" : "bg-white/50"}`}
                      />
                    ))}
                  </div>
                </>
              )}
              <div className="absolute bottom-4 left-5">
                <h2 className="text-white font-bold text-xl">
                  {service.label}
                </h2>
                {service.tagline && (
                  <p className="text-white/70 text-sm">{service.tagline}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6">
            {images.length === 0 && (
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-slate-800 font-bold text-xl">
                    {service.label}
                  </h2>
                  {service.tagline && (
                    <p className="text-slate-500 text-sm mt-0.5">
                      {service.tagline}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center flex-shrink-0"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span
                className={`text-xs px-3 py-1 rounded-full border font-semibold ${
                  service.is_active
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                {service.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            {service.description && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4">
                <p className="text-xs text-slate-400 mb-2">Description</p>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {service.description}
                </p>
              </div>
            )}

            {service.highlights?.length > 0 && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs text-slate-400 mb-3">Highlights</p>
                <ul className="flex flex-col gap-2">
                  {service.highlights.map((h, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Service | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, type, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services", {
        headers: { ...getAuthHeaders() },
      });
      const data = await res.json();
      setServices(Array.isArray(data) ? data : (data.data ?? []));
    } catch {
      toast("error", "Failed to load services.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/services/${confirmId}`, {
        method: "DELETE",
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) throw new Error();
      toast("success", "Service deleted.");
      fetchServices();
    } catch {
      toast("error", "Failed to delete service.");
    } finally {
      setDeleting(false);
      setConfirmId(null);
    }
  };

  const filtered = services.filter(
    (s) =>
      !search ||
      s.label.toLowerCase().includes(search.toLowerCase()) ||
      s.tagline?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <style>{`
        @keyframes toastIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .row-hover:hover { background: #f8fafc; }
      `}</style>

      <ToastList
        toasts={toasts}
        remove={(id) => setToasts((p) => p.filter((t) => t.id !== id))}
      />

      <div className="bg-slate-50 min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                Services
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {loading ? "Loading..." : `${services.length} total services`}
              </p>
            </div>
            <button
              onClick={() => {
                setSelected(null);
                setModal("create");
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-red-200 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Service
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-8 py-8">
          {/* Search */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all shadow-sm"
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-[2fr_1.5fr_0.6fr_0.8fr_100px] gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50">
              {["Service", "Description", "Images", "Status", "Actions"].map(
                (h) => (
                  <span
                    key={h}
                    className="text-xs font-bold text-slate-400 uppercase tracking-widest"
                  >
                    {h}
                  </span>
                ),
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">
                  Loading services...
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
                  <Layers className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-base font-semibold text-slate-600">
                  No services found
                </p>
                <p className="text-sm text-slate-400">
                  Add your first service offering.
                </p>
              </div>
            ) : (
              <div>
                {filtered.map((svc, idx) => (
                  <div
                    key={svc.id}
                    className={`row-hover grid grid-cols-[2fr_1.5fr_0.6fr_0.8fr_100px] gap-4 px-6 py-4 items-center transition-colors ${
                      idx < filtered.length - 1
                        ? "border-b border-slate-50"
                        : ""
                    }`}
                    style={{
                      animation: `fadeUp 0.3s ease ${idx * 0.04}s both`,
                    }}
                  >
                    {/* Service */}
                    <div className="flex items-center gap-3.5 overflow-hidden">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-200">
                        {svc.thumbnail ? (
                          <img
                            src={svc.thumbnail}
                            alt={svc.label}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100">
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 text-sm font-bold truncate">
                          {svc.label}
                        </p>
                        <p className="text-slate-400 text-xs truncate">
                          {svc.tagline ?? "—"}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          sort: {svc.sort_order}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                      {svc.description ?? "—"}
                    </p>

                    {/* Images count */}
                    <div className="flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-600 text-sm font-semibold">
                        {svc.images?.length ?? 0}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${svc.is_active ? "bg-emerald-500" : "bg-slate-400"}`}
                      />
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${
                          svc.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}
                      >
                        {svc.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelected(svc);
                          setModal("view");
                        }}
                        className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelected(svc);
                          setModal("edit");
                        }}
                        className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmId(svc.id)}
                        className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {(modal === "create" || modal === "edit") && (
        <ServiceFormModal
          mode={modal}
          initial={selected}
          onClose={() => {
            setModal(null);
            setSelected(null);
          }}
          onSaved={(msg) => {
            toast("success", msg);
            fetchServices();
          }}
        />
      )}

      {modal === "view" && selected && (
        <ViewModal
          service={selected}
          onClose={() => {
            setModal(null);
            setSelected(null);
          }}
        />
      )}

      {confirmId !== null && (
        <ConfirmDialog
          title="Delete Service"
          description={`Are you sure you want to delete "${services.find((s) => s.id === confirmId)?.label}"? This will also delete all its images.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
          loading={deleting}
        />
      )}
    </>
  );
}
