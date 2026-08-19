"use client";

import { useState, useEffect } from "react";
import {
  Save,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Loader2,
  Newspaper,
  CalendarDays,
  Upload,
  Star,
  Search,
  X,
  CheckCircle,
  AlertCircle,
  TriangleAlert,
  MapPin,
  Clock,
} from "lucide-react";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

// ─── Adjust these two to match your actual Laravel routes ───────────────────
// Verify against routes/api.php — the Network tab shows the final path
// segment only ("articles" / "events"), so double check the full prefix.
const NEWS_API = "/api/admin/news-events/articles";
const EVENTS_API = "/api/admin/news-events/events";

const NEWS_CATEGORIES = [
  "Market Insights",
  "Company News",
  "Property Alerts",
  "Announcements",
  "Promos",
];

// ─── Types ────────────────────────────────────────────────────────────────
interface NewsItem {
  id?: number;
  title: string;
  content: string;
  category: string;
  date: string;
  featured: boolean;
  sort_order: number;
  image?: string;
  _imageFile?: File | null;
  _imagePreview?: string | null;
}

interface EventItem {
  id?: number;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  category: string;
  sort_order: number;
  image?: string;
  _imageFile?: File | null;
  _imagePreview?: string | null;
}

const NEWS_FIELDS = [
  "title",
  "content",
  "category",
  "date",
  "featured",
  "sort_order",
];

const EVENT_FIELDS = [
  "title",
  "description",
  "event_date",
  "event_time",
  "location",
  "category",
  "sort_order",
];

const TABS = [
  { key: "news", label: "News Articles", icon: Newspaper },
  { key: "events", label: "Events", icon: CalendarDays },
] as const;

type TabKey = (typeof TABS)[number]["key"];
type ModalMode = "create" | "edit" | "view" | null;
interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

// ─── Fetch helpers ────────────────────────────────────────────────────────
async function apiFetch(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errors = data?.errors
      ? Object.values(data.errors).flat().join(" ")
      : "";
    throw new Error(
      data?.message ? `${data.message} ${errors}` : "Something went wrong.",
    );
  }
  return data;
}

// Builds multipart form data. Updates are sent as POST + _method=PUT
// because PHP can't parse multipart bodies on native PUT requests.
async function saveItem<T extends { id?: number; _imageFile?: File | null }>(
  baseUrl: string,
  item: T,
  fields: string[],
  isNew: boolean,
) {
  const fd = new FormData();
  fields.forEach((k) => {
    let v: any = (item as any)[k];
    if (v === undefined || v === null) v = "";
    if (typeof v === "boolean") v = v ? "1" : "0";
    fd.append(k, String(v));
  });
  if (item._imageFile) fd.append("image", item._imageFile);

  if (isNew) {
    return apiFetch(baseUrl, { method: "POST", body: fd });
  }
  // No _method=PUT spoofing — the Laravel route for updates only
  // registers a real POST (see "Supported methods" in the error),
  // not PUT. Sending _method=PUT makes Laravel treat this as an
  // actual PUT internally, which then 405s.
  return apiFetch(`${baseUrl}/${item.id}`, { method: "POST", body: fd });
}

function imgUrl(src?: string | null) {
  if (!src) return null;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${IMAGE_BASE}/${src}`;
}

// ─── UI primitives ───────────────────────────────────────────────────────
const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all";
const lbl =
  "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2";

function Field({
  label,
  hint,
  value,
  onChange,
  textarea = false,
  rows = 3,
  placeholder = "",
  type = "text",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  rows?: number;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      {hint && <p className="text-slate-400 text-xs mb-2 -mt-1">{hint}</p>}
      {textarea ? (
        <textarea
          rows={rows}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      <select
        value={value ?? options[0]}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} appearance-none cursor-pointer`}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function ImagePicker({
  label,
  existingSrc,
  previewSrc,
  inputId,
  onFile,
}: {
  label: string;
  existingSrc?: string | null;
  previewSrc?: string | null;
  inputId: string;
  onFile: (f?: File) => void;
}) {
  const shown = previewSrc || existingSrc;
  return (
    <div>
      <label className={lbl}>{label}</label>
      <div className="flex items-center gap-3 flex-wrap">
        {shown && (
          <img
            src={shown}
            alt="Preview"
            className="w-24 h-16 object-cover rounded-xl border border-slate-200"
          />
        )}
        <label
          htmlFor={inputId}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-red-400 hover:bg-red-50 text-slate-500 hover:text-red-500 text-sm transition-all cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          {shown ? "Change Photo" : "Upload Photo"}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}

// ─── Confirm Delete Dialog ─────────────────────────────────────────────────
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
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Toasts ─────────────────────────────────────────────────────────────────
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
            ${t.type === "success" ? "bg-emerald-950 border-emerald-700/40 text-emerald-300" : "bg-red-950 border-red-700/40 text-red-300"}`}
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

// ─── News Form Modal ──────────────────────────────────────────────────────
function NewsFormModal({
  initial,
  mode,
  onClose,
  onSaved,
}: {
  initial?: NewsItem | null;
  mode: "create" | "edit";
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<NewsItem>(
    initial ?? {
      title: "",
      content: "",
      category: NEWS_CATEGORIES[0],
      date: new Date().toISOString().slice(0, 10),
      featured: false,
      sort_order: 0,
    },
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const setF = (k: keyof NewsItem, v: any) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setError("Title and content are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await saveItem<NewsItem>(
        NEWS_API,
        { ...form, _imageFile: imageFile },
        NEWS_FIELDS,
        mode === "create",
      );
      onSaved(mode === "create" ? "Article created!" : "Article updated!");
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to save article.");
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
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
          style={{ animation: "modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 flex-shrink-0">
            <h2 className="text-xl font-bold text-slate-800">
              {mode === "create" ? "Add News Article" : "Edit News Article"}
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <Field
              label="Title"
              value={form.title}
              onChange={(v) => setF("title", v)}
            />
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Category"
                value={form.category}
                onChange={(v) => setF("category", v)}
                options={NEWS_CATEGORIES}
              />
              <Field
                label="Date"
                type="date"
                value={form.date}
                onChange={(v) => setF("date", v)}
              />
            </div>
            <Field
              label="Full Content"
              hint="The full article body shown on the article page"
              value={form.content}
              onChange={(v) => setF("content", v)}
              textarea
              rows={6}
            />
            <ImagePicker
              label="Cover Image"
              inputId="news-modal-img"
              existingSrc={imgUrl(form.image)}
              previewSrc={imagePreview}
              onFile={(f) => {
                if (!f) return;
                setImageFile(f);
                setImagePreview(URL.createObjectURL(f));
              }}
            />
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setF("featured", e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-red-500 focus:ring-red-400"
              />
              Feature this article (shows as hero story)
            </label>

            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors disabled:opacity-50"
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
                  ? "Create Article"
                  : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Event Form Modal ─────────────────────────────────────────────────────
function EventFormModal({
  initial,
  mode,
  onClose,
  onSaved,
}: {
  initial?: EventItem | null;
  mode: "create" | "edit";
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<EventItem>(
    initial ?? {
      title: "",
      description: "",
      event_date: new Date().toISOString().slice(0, 10),
      event_time: "",
      location: "",
      category: "",
      sort_order: 0,
    },
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const setF = (k: keyof EventItem, v: any) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.location.trim()) {
      setError("Title and location are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await saveItem<EventItem>(
        EVENTS_API,
        { ...form, _imageFile: imageFile },
        EVENT_FIELDS,
        mode === "create",
      );
      onSaved(mode === "create" ? "Event created!" : "Event updated!");
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to save event.");
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
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
          style={{ animation: "modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 flex-shrink-0">
            <h2 className="text-xl font-bold text-slate-800">
              {mode === "create" ? "Add Event" : "Edit Event"}
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <Field
              label="Title"
              value={form.title}
              onChange={(v) => setF("title", v)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Category (optional)"
                value={form.category}
                onChange={(v) => setF("category", v)}
                placeholder="e.g. Expo, Webinar, Tour"
              />
              <Field
                label="Location"
                value={form.location}
                onChange={(v) => setF("location", v)}
                placeholder="e.g. SMX Convention Center"
              />
              <Field
                label="Event Date"
                type="date"
                value={form.event_date}
                onChange={(v) => setF("event_date", v)}
              />
              <Field
                label="Event Time (optional)"
                value={form.event_time}
                onChange={(v) => setF("event_time", v)}
                placeholder="e.g. 10:00 AM – 6:00 PM"
              />
            </div>
            <Field
              label="Description"
              value={form.description}
              onChange={(v) => setF("description", v)}
              textarea
              rows={4}
            />
            <ImagePicker
              label="Cover Image"
              inputId="event-modal-img"
              existingSrc={imgUrl(form.image)}
              previewSrc={imagePreview}
              onFile={(f) => {
                if (!f) return;
                setImageFile(f);
                setImagePreview(URL.createObjectURL(f));
              }}
            />

            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors disabled:opacity-50"
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
                  ? "Create Event"
                  : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function AdminNewsEventsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("news");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    kind: "news" | "event";
    id: number;
    title: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, type, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  // ── Fetch data (both news & events) ──────────────────────────────────────
  const fetchAll = () => {
    setLoading(true);
    Promise.all([apiFetch(NEWS_API), apiFetch(EVENTS_API)])
      .then(([newsRes, eventsRes]) => {
        setNews(
          (newsRes.data ?? []).map((a: any) => ({
            ...a,
            date: a.date ? String(a.date).slice(0, 10) : "",
            featured: !!a.featured,
          })),
        );
        setEvents(
          (eventsRes.data ?? []).map((e: any) => ({
            ...e,
            event_date: e.event_date ? String(e.event_date).slice(0, 10) : "",
          })),
        );
      })
      .catch((e) => toast("error", e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirmDeleteItem() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const base = confirmDelete.kind === "news" ? NEWS_API : EVENTS_API;
      await apiFetch(`${base}/${confirmDelete.id}`, { method: "DELETE" });
      if (confirmDelete.kind === "news") {
        setNews((prev) => prev.filter((n) => n.id !== confirmDelete.id));
      } else {
        setEvents((prev) => prev.filter((e) => e.id !== confirmDelete.id));
      }
      toast("success", "Removed.");
    } catch (e: any) {
      toast("error", e.message || "Failed to delete.");
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  }

  const filteredNews = news.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || n.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading content…</p>
      </div>
    );
  }

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
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                News &amp; Events
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Changes here appear on the public News &amp; Events page
              </p>
            </div>
            <button
              onClick={() => {
                if (activeTab === "news") {
                  setSelectedNews(null);
                } else {
                  setSelectedEvent(null);
                }
                setModal("create");
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-red-200 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              {activeTab === "news" ? "Add Article" : "Add Event"}
            </button>
          </div>

          {/* Tabs */}
          <div className="max-w-7xl mx-auto mt-5 flex items-center gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSearch("");
                    setCategoryFilter("");
                  }}
                  className={[
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all",
                    activeTab === tab.key
                      ? "bg-red-500 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
                  ].join(" ")}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.key
                        ? "bg-white/20"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {tab.key === "news" ? news.length : events.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all shadow-sm"
                placeholder={`Search ${activeTab === "news" ? "articles" : "events"} by title...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {activeTab === "news" && (
              <select
                className="bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm text-slate-600 focus:outline-none focus:border-red-400 shadow-sm appearance-none cursor-pointer"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {NEWS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* ── NEWS TABLE ── */}
          {activeTab === "news" && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="grid grid-cols-[2.5fr_1.2fr_1fr_1fr_120px] gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50">
                {["Article", "Category", "Date", "Featured", "Actions"].map(
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

              {filteredNews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
                    <Newspaper className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-base font-semibold text-slate-600">
                    No articles found
                  </p>
                  <p className="text-sm text-slate-400">
                    Try adjusting your search or add a new article.
                  </p>
                </div>
              ) : (
                filteredNews.map((n, idx) => (
                  <div
                    key={n.id}
                    className={`row-hover grid grid-cols-[2.5fr_1.2fr_1fr_1fr_120px] gap-4 px-6 py-4 items-center transition-colors ${
                      idx < filteredNews.length - 1
                        ? "border-b border-slate-50"
                        : ""
                    }`}
                    style={{
                      animation: `fadeUp 0.3s ease ${idx * 0.04}s both`,
                    }}
                  >
                    <div className="flex items-center gap-3.5 overflow-hidden">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100">
                        {imgUrl(n.image) ? (
                          <img
                            src={imgUrl(n.image)!}
                            alt={n.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Newspaper className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <p className="text-slate-800 text-sm font-bold line-clamp-1">
                        {n.title || "(Untitled)"}
                      </p>
                    </div>
                    <span className="text-slate-600 text-sm">{n.category}</span>
                    <span className="text-slate-600 text-sm">{n.date}</span>
                    <div>
                      {n.featured ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-600 font-semibold px-2.5 py-1 rounded-full">
                          <Star className="w-3 h-3" /> Featured
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedNews(n);
                          setModal("edit");
                        }}
                        className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setConfirmDelete({
                            kind: "news",
                            id: n.id!,
                            title: n.title,
                          })
                        }
                        className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── EVENTS TABLE ── */}
          {activeTab === "events" && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="grid grid-cols-[2.2fr_1.2fr_1.4fr_1.2fr_120px] gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50">
                {[
                  "Event",
                  "Date & Time",
                  "Location",
                  "Category",
                  "Actions",
                ].map((h) => (
                  <span
                    key={h}
                    className="text-xs font-bold text-slate-400 uppercase tracking-widest"
                  >
                    {h}
                  </span>
                ))}
              </div>

              {filteredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
                    <CalendarDays className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-base font-semibold text-slate-600">
                    No events found
                  </p>
                  <p className="text-sm text-slate-400">
                    Try adjusting your search or add a new event.
                  </p>
                </div>
              ) : (
                filteredEvents.map((ev, idx) => (
                  <div
                    key={ev.id}
                    className={`row-hover grid grid-cols-[2.2fr_1.2fr_1.4fr_1.2fr_120px] gap-4 px-6 py-4 items-center transition-colors ${
                      idx < filteredEvents.length - 1
                        ? "border-b border-slate-50"
                        : ""
                    }`}
                    style={{
                      animation: `fadeUp 0.3s ease ${idx * 0.04}s both`,
                    }}
                  >
                    <div className="flex items-center gap-3.5 overflow-hidden">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100">
                        {imgUrl(ev.image) ? (
                          <img
                            src={imgUrl(ev.image)!}
                            alt={ev.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <CalendarDays className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <p className="text-slate-800 text-sm font-bold line-clamp-1">
                        {ev.title || "(Untitled)"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-600 text-sm">
                        {ev.event_date}
                      </span>
                      {ev.event_time && (
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ev.event_time}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-600 text-sm flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      {ev.location}
                    </span>
                    <span className="text-slate-600 text-sm">
                      {ev.category || "—"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedEvent(ev);
                          setModal("edit");
                        }}
                        className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setConfirmDelete({
                            kind: "event",
                            id: ev.id!,
                            title: ev.title,
                          })
                        }
                        className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {activeTab === "news" && (modal === "create" || modal === "edit") && (
        <NewsFormModal
          mode={modal}
          initial={selectedNews}
          onClose={() => {
            setModal(null);
            setSelectedNews(null);
          }}
          onSaved={(msg) => {
            toast("success", msg);
            fetchAll();
          }}
        />
      )}
      {activeTab === "events" && (modal === "create" || modal === "edit") && (
        <EventFormModal
          mode={modal}
          initial={selectedEvent}
          onClose={() => {
            setModal(null);
            setSelectedEvent(null);
          }}
          onSaved={(msg) => {
            toast("success", msg);
            fetchAll();
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete "${confirmDelete.title}"?`}
          description="This action cannot be undone."
          loading={deleting}
          onConfirm={confirmDeleteItem}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}
