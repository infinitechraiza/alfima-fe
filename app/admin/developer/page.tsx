"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Map as MapIcon,
  X,
  Upload,
  Building2,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Square,
  CheckCircle,
  AlertCircle,
  Loader2,
  ImageIcon,
  Video,
  Flag,
  Home,
  ChevronLeft,
  ChevronRight,
  Monitor,
  ShoppingBag,
  TriangleAlert,
} from "lucide-react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// Direct Laravel backend URL — bypasses Next.js body size limit entirely
const LARAVEL_API =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_IMG?.replace(/\/$/, "") ||
  "http://localhost:8000";

// Helper: build a full URL for stored media
const getFullImageUrl = (url: unknown): string | null => {
  if (typeof url !== "string") return null;
  const clean = url.trim();
  if (!clean) return null;
  if (clean.startsWith("http")) return clean;
  return `${LARAVEL_API}/${clean.replace(/^\//, "")}`;
};

// Helper: get auth token from cookie
function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1] ?? null
  );
}

// Helper: build headers with optional auth
function authHeaders(extra: Record<string, string> = {}): HeadersInit {
  const token = getAuthToken();
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// ─── Normalize Array Helper ───────────────────────────────────────────────────
function normalizeArray(val: unknown): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {}
    }
    return trimmed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

// ─── Normalize Label Helper (for matching tags case/whitespace-insensitively) ─
function normalizeLabel(s?: string | null): string {
  if (typeof s !== "string") return "";
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface PropertyTag {
  id?: number;
  label: string;
  color: string;
  active?: boolean;
}

// ─── Normalize Tags Helper ──────────────────────────────────────────────────
// `tags` can come back from the API in several shapes depending on when the
// row was created: a real array (rows created after the model cast fix), a
// JSON-encoded string (older rows, or double-encoded edge cases), null, or
// undefined. This normalizes all of those into a clean PropertyTag[] so
// .some()/.filter()/.map() never blow up on a raw string or null.
function normalizeTags(val: unknown): PropertyTag[] {
  const arr = normalizeArray(val);
  return arr
    .map((t: any) => {
      if (typeof t === "string") {
        // Defensive: handles a doubly-encoded string tag entry
        try {
          const parsed = JSON.parse(t);
          return typeof parsed === "object" && parsed !== null ? parsed : null;
        } catch {
          return null;
        }
      }
      return t;
    })
    .filter(
      (t): t is PropertyTag =>
        !!t && typeof t === "object" && typeof t.label === "string",
    );
}

interface DeveloperProperty {
  id?: number;
  developer_name?: string;
  title: string;
  description?: string;
  property_type: string;
  listing_type: string;
  tags?: PropertyTag[];
  visibility_map: string;
  status: string;
  price?: number | string;
  price_per_month?: number | string;
  address: string;
  residential_type?: string;
  bedroom_type?: string;
  floor_level?: string;
  furnished?: string;
  bathrooms?: number;
  area?: string | number;
  parking_slots?: number;
  office_space_type?: string;
  office_space_name?: string;
  office_area?: string | number;
  office_floor?: string;
  office_internet?: string;
  commercial_type?: string;
  commercial_name?: string;
  commercial_area?: string | number;
  commercial_frontage?: string | number;
  commercial_floor_level?: string;
  images?: any;
  videos?: any;
  thumbnail?: string;
  amenities?: any;
  amenities_other?: string;
  priority?: number;
  created_at?: string;
  updated_at?: string;
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
// ─── Tag colors ────────────────────────────────────────────────────────────
const TAG_COLOR_OPTIONS: {
  value: string;
  label: string;
  classes: string;
  dot: string;
}[] = [
  {
    value: "red",
    label: "Red",
    classes: "bg-red-100 text-red-700 border-red-300",
    dot: "bg-red-500",
  },
  {
    value: "blue",
    label: "Blue",
    classes: "bg-blue-100 text-blue-700 border-blue-300",
    dot: "bg-blue-500",
  },
  {
    value: "emerald",
    label: "Green",
    classes: "bg-emerald-100 text-emerald-700 border-emerald-300",
    dot: "bg-emerald-500",
  },
  {
    value: "amber",
    label: "Amber",
    classes: "bg-amber-100 text-amber-700 border-amber-300",
    dot: "bg-amber-500",
  },
  {
    value: "violet",
    label: "Violet",
    classes: "bg-violet-100 text-violet-700 border-violet-300",
    dot: "bg-violet-500",
  },
  {
    value: "pink",
    label: "Pink",
    classes: "bg-pink-100 text-pink-700 border-pink-300",
    dot: "bg-pink-500",
  },
  {
    value: "orange",
    label: "Orange",
    classes: "bg-orange-100 text-orange-700 border-orange-300",
    dot: "bg-orange-500",
  },
  {
    value: "slate",
    label: "Slate",
    classes: "bg-slate-200 text-slate-700 border-slate-300",
    dot: "bg-slate-500",
  },
];

const RESIDENTIAL_TYPES = [
  { value: "condominium", label: "Condominium" },
  { value: "house_and_lot", label: "House & Lot" },
  { value: "lot_only", label: "Lot Only" },
  { value: "townhouse", label: "Townhouse" },
  { value: "apartment", label: "Apartment" },
  // { value: "studio_unit", label: "Studio Unit" },
  { value: "penthouse", label: "Penthouse" },
  { value: "duplex", label: "Duplex" },
  { value: "villa", label: "Villa" },
];

const FURNISHED_OPTIONS = [
  { value: "bare", label: "Bare / Unfurnished" },
  { value: "semi", label: "Semi-Furnished" },
  { value: "fully", label: "Fully Furnished" },
];

const OFFICE_TYPES = [
  { value: "regular_office", label: "Regular Office" },
  { value: "compound_office", label: "Compound of Offices" },
  { value: "coworking", label: "Co-Working Space" },
  { value: "executive_suite", label: "Executive Suite" },
  { value: "open_plan", label: "Open Plan Office" },
  { value: "virtual_office", label: "Virtual Office" },
];

const OFFICE_INTERNET_OPTIONS = [
  { value: "fiber", label: "Fiber / High-Speed" },
  { value: "dedicated", label: "Dedicated Line" },
  { value: "shared", label: "Shared Broadband" },
  { value: "none", label: "Not Included" },
];

const COMMERCIAL_TYPES = [
  { value: "retail_unit", label: "Retail Unit" },
  { value: "restaurant_fnb", label: "Restaurant / F&B" },
  { value: "boutique", label: "Boutique / Showroom" },
  { value: "clinic", label: "Clinic / Medical" },
  { value: "salon_spa", label: "Salon / Spa" },
  { value: "gym_fitness", label: "Gym / Fitness Center" },
  { value: "grocery", label: "Grocery / Convenience" },
  { value: "bank_finance", label: "Bank / Financial Services" },
];

const AMENITY_OPTIONS = [
  "Swimming Pool",
  "Gym / Fitness Center",
  "Parking Slot",
  "Security / CCTV",
  "Elevator",
  "Clubhouse",
  "Basketball Court",
  "Tennis Court",
  "Jogging Path",
  "Children's Playground",
  "Function Hall",
  "Laundry Area",
  "Generator / Backup Power",
  "Solar Panels",
  "Rooftop Deck",
  "Landscaped Garden",
  "Concierge Service",
  "Pet Friendly",
  "EV Charging Station",
  "Co-Working Area",
  "Sky Lounge",
  "Meeting Rooms",
];

const BEDROOM_TYPES = [
  { value: "studio", label: "Studio" },
  { value: "1br", label: "1 BR" },
  { value: "2br", label: "2 BR" },
  { value: "3br", label: "3 BR" },
  { value: "4br", label: "4 BR" },
  { value: "5br+", label: "5+ BR" },
];

const ACCEPT_ALL_IMAGES =
  "image/*,.avif,.heic,.heif,.jxl,.tiff,.tif,.bmp,.ico,.svg,.webp";

// File size limits
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB per image
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 MB per video (direct to Laravel)
const MAX_IMAGES_PER_BATCH = 5; // images per multipart batch

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function getTagColorClasses(color?: string): string {
  return (
    TAG_COLOR_OPTIONS.find((c) => c.value === color)?.classes ??
    "bg-slate-100 text-slate-600 border-slate-300"
  );
}

function getTagColorDot(color?: string): string {
  return (
    TAG_COLOR_OPTIONS.find((c) => c.value === color)?.dot ?? "bg-slate-400"
  );
}

function validateImageFiles(files: File[]): {
  valid: File[];
  errors: string[];
} {
  const errors: string[] = [];
  const valid: File[] = [];
  files.forEach((file) => {
    if (file.size > MAX_IMAGE_SIZE) {
      errors.push(
        `"${file.name}" is ${formatFileSize(file.size)} (max ${formatFileSize(MAX_IMAGE_SIZE)})`,
      );
    } else {
      valid.push(file);
    }
  });
  return { valid, errors };
}

function validateVideoFiles(files: File[]): {
  valid: File[];
  errors: string[];
} {
  const errors: string[] = [];
  const valid: File[] = [];
  files.forEach((file) => {
    if (file.size > MAX_VIDEO_SIZE) {
      errors.push(
        `"${file.name}" is ${formatFileSize(file.size)} (max ${formatFileSize(MAX_VIDEO_SIZE)})`,
      );
    } else {
      valid.push(file);
    }
  });
  return { valid, errors };
}

function formatNumberInput(raw: string): string {
  const cleaned = raw.replace(/[^0-9\-]/g, "");
  const dashIndex = cleaned.indexOf("-");
  if (dashIndex !== -1) {
    const left = cleaned.slice(0, dashIndex).replace(/\-/g, "");
    const right = cleaned.slice(dashIndex + 1).replace(/\-/g, "");
    const fL = left ? Number(left).toLocaleString("en-PH") : "";
    const fR = right ? Number(right).toLocaleString("en-PH") : "";
    return fL + "-" + fR;
  }
  const digits = cleaned.replace(/\-/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-PH");
}

function stripCommas(val: string): string {
  return val.replace(/,/g, "");
}

function isPriceValid(val: string): boolean {
  if (!val) return false;
  return /^\d+(-\d+)?$/.test(stripCommas(val).trim());
}

function initPriceDisplay(val?: number | string): string {
  if (!val && val !== 0) return "";
  return formatNumberInput(String(val));
}

function formatPriceDisplay(val?: number | string, suffix = ""): string {
  if (!val && val !== 0) return "—";
  const str = String(val);
  if (str.includes("-")) {
    const [a, b] = str.split("-");
    const fA = a ? `₱${Number(a).toLocaleString("en-PH")}` : "";
    const fB = b ? `₱${Number(b).toLocaleString("en-PH")}` : "";
    return fA && fB ? `${fA} – ${fB}${suffix}` : `${fA || fB}${suffix}`;
  }
  return `₱${Number(str).toLocaleString("en-PH")}${suffix}`;
}

// ─── Direct Laravel upload helper ─────────────────────────────────────────────
// Sends FormData straight to Laravel, bypassing the Next.js 4.5 MB body limit.
async function laravelFetch(
  path: string,
  method: "POST" | "PUT" | "DELETE",
  body?: FormData | null,
): Promise<{ ok: boolean; status: number; data: any }> {
  const url = `${LARAVEL_API}/${path.replace(/^\//, "")}`;
  const res = await fetch(url, {
    method,
    headers: authHeaders(), // no Content-Type — let browser set multipart boundary
    body: body ?? undefined,
    credentials: "include",
  });

  const ct = res.headers.get("content-type") ?? "";
  const data = ct.includes("application/json")
    ? await res.json()
    : await res.text();
  return { ok: res.ok, status: res.status, data };
}

// Uploads images in batches of MAX_IMAGES_PER_BATCH directly to Laravel
async function uploadImageBatches(
  propertyId: number,
  files: File[],
  onProgress: (pct: number) => void,
): Promise<void> {
  const total = Math.ceil(files.length / MAX_IMAGES_PER_BATCH);
  for (let i = 0; i < files.length; i += MAX_IMAGES_PER_BATCH) {
    const batch = files.slice(i, i + MAX_IMAGES_PER_BATCH);
    const fd = new FormData();
    batch.forEach((f) => fd.append("images[]", f));
    fd.append("_method", "PUT");
    const { ok, data } = await laravelFetch(
      `api/developers-properties/${propertyId}`,
      "POST",
      fd,
    );
    if (!ok) console.warn("Image batch warning:", data?.message ?? data);
    onProgress(
      Math.round(((Math.floor(i / MAX_IMAGES_PER_BATCH) + 1) / total) * 100),
    );
  }
}

// Uploads videos one-by-one directly to Laravel
async function uploadVideoBatches(
  propertyId: number,
  files: File[],
  onProgress: (pct: number) => void,
): Promise<void> {
  for (let i = 0; i < files.length; i++) {
    const fd = new FormData();
    fd.append("videos[]", files[i]);
    fd.append("_method", "PUT");
    const { ok, data } = await laravelFetch(
      `api/developers-properties/${propertyId}`,
      "POST",
      fd,
    );
    if (!ok) console.warn("Video upload warning:", data?.message ?? data);
    onProgress(Math.round(((i + 1) / files.length) * 100));
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────
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

// ─── Confirm Delete Dialog ─────────────────────────────────────────────────────
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

// ─── Tag Checkbox Group ────────────────────────────────────────────────────────
function TagCheckboxGroup({
  options,
  selected,
  onChange,
  accentColor = "red",
}: {
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
  accentColor?: "red" | "blue" | "violet";
}) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter((s) => s !== opt));
    else onChange([...selected, opt]);
  };
  const on =
    accentColor === "blue"
      ? "bg-blue-600 border-blue-600 text-white"
      : accentColor === "violet"
        ? "bg-violet-600 border-violet-600 text-white"
        : "bg-red-600 border-red-600 text-white";
  const off =
    "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-400";
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selected.includes(opt) ? on : off}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Existing Tags Picker (tags used elsewhere in the developer properties DB) ─
// Mirrors the agent-properties page: a checkbox (not a checkmark) shows
// selection state, the dot shows color, and hovering reveals an "×" that
// deletes the tag from every developer property (not just this form).
function ExistingTagsPicker({
  availableTags,
  selectedLabels,
  onToggle,
  onDelete,
  loading,
}: {
  availableTags: PropertyTag[];
  selectedLabels: Set<string>;
  onToggle: (tag: PropertyTag) => void;
  onDelete: (tag: PropertyTag) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading existing tags...
      </div>
    );
  }
  if (availableTags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {availableTags.map((t, i) => {
        const isSelected = selectedLabels.has(normalizeLabel(t.label));
        return (
          <span
            key={`${t.label}-${i}`}
            className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-all ${
              isSelected
                ? getTagColorClasses(t.color)
                : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
            }`}
          >
            <button
              type="button"
              onClick={() => onToggle(t)}
              className="flex items-center gap-1.5"
            >
              <input
                type="checkbox"
                checked={isSelected}
                readOnly
                className="w-3 h-3 rounded accent-current pointer-events-none flex-shrink-0"
              />
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${getTagColorDot(t.color)}`}
              />
              {t.label}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(t);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
              title="Delete this tag everywhere"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        );
      })}
    </div>
  );
}

// ─── Property Form Modal ───────────────────────────────────────────────────────
function PropertyFormModal({
  initial,
  mode,
  onClose,
  onSaved,
}: {
  initial?: DeveloperProperty | null;
  mode: "create" | "edit";
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [thumbPreview, setThumbPreview] = useState<string | null>(
    initial?.thumbnail ? getFullImageUrl(initial.thumbnail) : null,
  );
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const galleryRef = useRef<HTMLInputElement>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<
    { id?: number; url: string }[]
  >(() => {
    const imgsArray = normalizeArray(initial?.images);
    return imgsArray.map((img: any) => {
      const url = typeof img === "string" ? img.trim() : img.url;
      return {
        id: typeof img === "string" ? undefined : img.id,
        url: getFullImageUrl(url) || "",
      };
    });
  });
  const totalGalleryCount = existingImages.length + galleryFiles.length;

  const videoRef = useRef<HTMLInputElement>(null);
  const [videoFiles, setVideoFiles] = useState<
    { file: File; preview: string }[]
  >([]);
  const [existingVideos, setExistingVideos] = useState<string[]>(
    normalizeArray(initial?.videos),
  );

  const [priceDisplay, setPriceDisplay] = useState(
    initPriceDisplay(initial?.price),
  );
  const [rentDisplay, setRentDisplay] = useState(
    initPriceDisplay(initial?.price_per_month),
  );
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    normalizeArray(initial?.amenities),
  );

  // ── FIX: use normalizeTags instead of trusting initial?.tags is already
  // a clean array — older rows may hand back a JSON string here. ──
  const [tags, setTags] = useState<PropertyTag[]>(() =>
    normalizeTags(initial?.tags).map((t) => ({
      label: t.label ?? "",
      color: t.color ?? "red",
      active: t.active ?? true,
    })),
  );

  const addTag = () =>
    setTags((prev) => [...prev, { label: "", color: "red", active: true }]);

  const updateTag = (i: number, patch: Partial<PropertyTag>) =>
    setTags((prev) =>
      prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)),
    );
  const removeTag = (i: number) =>
    setTags((prev) => prev.filter((_, idx) => idx !== i));

  // ── Existing tags pulled from the DB (shared across all developer properties) ──
  const [availableTags, setAvailableTags] = useState<PropertyTag[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingTags(true);

    // Reuses the same list endpoint the table already calls (direct to
    // Laravel), just asking for a big page so we can scan every tag.
    fetch(`${LARAVEL_API}/api/developers-properties?per_page=1000`, {
      headers: authHeaders(),
    })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => {
        if (cancelled) return;
        const list: DeveloperProperty[] = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
            ? json
            : [];

        const seen = new Map<string, PropertyTag>();
        for (const p of list) {
          // FIX: use normalizeTags instead of `p.tags ?? []` directly
          for (const t of normalizeTags(p.tags)) {
            if (!t?.label?.trim()) continue;
            const key = normalizeLabel(t.label);
            if (!seen.has(key)) {
              seen.set(key, {
                label: t.label.trim(),
                color: t.color ?? "red",
              });
            }
          }
        }

        setAvailableTags(Array.from(seen.values()));
      })
      .catch((err) => {
        console.error("Failed to load existing tags:", err);
      })
      .finally(() => !cancelled && setLoadingTags(false));

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedTagLabels = new Set(tags.map((t) => normalizeLabel(t.label)));

  const toggleExistingTag = (tag: PropertyTag) => {
    const key = normalizeLabel(tag.label);
    if (selectedTagLabels.has(key)) {
      setTags((prev) => prev.filter((t) => normalizeLabel(t.label) !== key));
    } else {
      setTags((prev) => [
        ...prev,
        { label: tag.label, color: tag.color, active: true },
      ]);
    }
  };

  // Deletes a tag label from every developer property that has it (backend),
  // not just from this form. Mirrors the pattern used on AdminPropertiesPage.
  const deleteTagEverywhere = async (tag: PropertyTag) => {
    if (!confirm(`Delete "${tag.label}" from all developer properties?`))
      return;
    try {
      const tokenRes = await fetch("/api/auth/token");
      const tokenData = await tokenRes.json();
      const token = tokenData.token;

      if (!token) {
        setError("Authentication required. Please log in again.");
        return;
      }

      const laravelBase = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(
        `${laravelBase}/api/developers-properties/tags?label=${encodeURIComponent(tag.label)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? "Failed to delete tag.");
      }

      setAvailableTags((prev) =>
        prev.filter(
          (t) => normalizeLabel(t.label) !== normalizeLabel(tag.label),
        ),
      );
      setTags((prev) =>
        prev.filter(
          (t) => normalizeLabel(t.label) !== normalizeLabel(tag.label),
        ),
      );
    } catch (err: any) {
      setError(err.message || "Failed to delete tag.");
    }
  };

  const [form, setForm] = useState({
    title: initial?.title ?? "",
    developer_name: initial?.developer_name ?? "",
    listing_type: initial?.listing_type ?? "sale",
    visibility_map: initial?.visibility_map ?? "",
    property_type: initial?.property_type ?? "",
    status: initial?.status ?? "active",
    address: initial?.address ?? "",
    description: initial?.description ?? "",
    priority: initial?.priority ?? (null as number | null),
    residential_type: initial?.residential_type ?? "",
    bedroom_type: initial?.bedroom_type ?? "",
    floor_level: initial?.floor_level ?? "",
    furnished: initial?.furnished ?? "",
    bathrooms: String(initial?.bathrooms ?? ""),
    area: String(initial?.area ?? ""),
    parking_slots: String(initial?.parking_slots ?? ""),
    office_space_type: initial?.office_space_type ?? "",
    office_space_name: initial?.office_space_name ?? "",
    office_area: String(initial?.office_area ?? ""),
    office_floor: initial?.office_floor ?? "",
    office_internet: initial?.office_internet ?? "",
    commercial_type: initial?.commercial_type ?? "",
    commercial_name: initial?.commercial_name ?? "",
    commercial_area: String(initial?.commercial_area ?? ""),
    commercial_frontage: String(initial?.commercial_frontage ?? ""),
    commercial_floor_level: initial?.commercial_floor_level ?? "",
    amenities_other: initial?.amenities_other ?? "",
  });

  const setF = (k: string, v: string | number | null) =>
    setForm((p) => ({ ...p, [k]: v }));

  const inp =
    "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";
  const sel = `${inp} appearance-none cursor-pointer`;
  const lbl =
    "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2";

  const isSale = form.listing_type === "sale";

  const handlePriceChange = (raw: string, setter: (v: string) => void) => {
    setter(formatNumberInput(raw.replace(/[^0-9\-]/g, "")));
  };
  const isValidGoogleMapsUrl = (url: string) => {
    const regex =
      /^(https:\/\/(www\.google\.com\/maps(\/embed)?|maps\.app\.goo\.gl)\/.+)$/;

    return regex.test(url);
  };

  // ── Core submit: sends text fields + thumbnail first, then media in batches ──
  const handleSubmit = async () => {
    // ── Validation ──
    if (!form.title.trim() || !form.address.trim()) {
      setError("Title and address are required.");
      return;
    }
    if (!form.property_type) {
      setError("Please select a property type.");
      return;
    }
    if (isSale && !isPriceValid(priceDisplay)) {
      setError(
        "Enter a valid sale price (e.g. 4,500,000 or 2,000,000-4,500,000).",
      );
      return;
    }
    if (!isSale && !isPriceValid(rentDisplay)) {
      setError("Enter a valid monthly rent (e.g. 25,000 or 25,000-40,000).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isUpdate = mode === "edit";
      const propertyId = isUpdate ? initial!.id! : null;

      // ── Step 1: Save text fields (no files) ──
      setUploadStage("Saving property details…");
      setUploadProgress(10);

      const fd = new FormData();
      fd.append("developer_name", form.developer_name);
      fd.append("title", form.title);
      fd.append("listing_type", form.listing_type);
      fd.append("property_type", form.property_type);
      fd.append("status", form.status);
      fd.append("address", form.address);
      if (form.description) fd.append("description", form.description);
      if (form.priority !== null) fd.append("priority", String(form.priority));
      if (form.visibility_map) {
        if (!isValidGoogleMapsUrl(form.visibility_map)) {
          setError("Invalid Google Maps URL");
          setLoading(false);
          return;
        }
        fd.append("visibility_map", form.visibility_map);
      }
      if (isSale) fd.append("price", stripCommas(priceDisplay));
      else fd.append("price_per_month", stripCommas(rentDisplay));
      selectedAmenities.forEach((a) => fd.append("amenities[]", a));

      // ── Tags ──
      // Sent as a single JSON-encoded field (same shape AdminPropertiesPage
      // sends via JSON.stringify(metadataPayload)) rather than exploded
      // tags[i][label] bracket keys — the backend expects to json_decode()
      // this, and the bracket-notation form was silently dropping tags.
      const cleanTags = tags
        .filter((t) => t.label.trim().length > 0)
        .map((t) => ({
          label: t.label.trim(),
          color: t.color,
          active: t.active ?? true,
        }));
      fd.append("tags", JSON.stringify(cleanTags));

      if (form.amenities_other)
        fd.append("amenities_other", form.amenities_other);

      if (form.property_type === "residential") {
        if (form.residential_type)
          fd.append("residential_type", form.residential_type);
        if (form.bedroom_type) fd.append("bedroom_type", form.bedroom_type);
        if (form.floor_level) fd.append("floor_level", form.floor_level);
        if (form.furnished) fd.append("furnished", form.furnished);
        if (form.bathrooms) fd.append("bathrooms", form.bathrooms);
        if (form.area) fd.append("area", form.area);
        if (form.parking_slots) fd.append("parking_slots", form.parking_slots);
      }
      if (form.property_type === "office_space") {
        if (form.office_space_type)
          fd.append("office_space_type", form.office_space_type);
        if (form.office_space_name)
          fd.append("office_space_name", form.office_space_name);
        if (form.office_area) fd.append("office_area", form.office_area);
        if (form.office_floor) fd.append("office_floor", form.office_floor);
        if (form.office_internet)
          fd.append("office_internet", form.office_internet);
      }
      if (form.property_type === "commercial") {
        if (form.commercial_type)
          fd.append("commercial_type", form.commercial_type);
        if (form.commercial_name)
          fd.append("commercial_name", form.commercial_name);
        if (form.commercial_area)
          fd.append("commercial_area", form.commercial_area);
        if (form.commercial_frontage)
          fd.append("commercial_frontage", form.commercial_frontage);
        if (form.commercial_floor_level)
          fd.append("commercial_floor_level", form.commercial_floor_level);
      }

      if (isUpdate) fd.append("_method", "PUT");

      // Thumbnail goes in first request (small enough)
      if (thumbFile) fd.append("thumbnail", thumbFile);

      const endpoint = isUpdate
        ? `api/developers-properties/${propertyId}`
        : `api/developers-properties`;

      const { ok, status, data } = await laravelFetch(endpoint, "POST", fd);

      if (!ok) {
        if (status === 413) {
          setError(
            "❌ Payload too large (413). The thumbnail may be too big — please compress it below 2 MB.",
          );
        } else {
          setError(
            typeof data === "string"
              ? `❌ Server error (${status}): ${data}`
              : (data?.message ?? data?.error ?? `❌ Server error (${status})`),
          );
        }
        return;
      }

      setUploadProgress(30);
      const savedId: number = data?.id ?? propertyId;

      // Diagnostic: confirms whether the backend actually persisted/echoed
      // the tags we just sent. If cleanTags.length > 0 but data?.tags comes
      // back empty/undefined, the backend isn't reading the "tags" field
      // the way we're sending it — check the Laravel controller's expected
      // format for developers-properties (json_decode vs validated array).
      if (cleanTags.length > 0) {
        console.log(
          "[DeveloperProperty] tags sent:",
          cleanTags,
          "| tags in server response:",
          data?.tags,
        );
      }

      // ── Step 2 (edit only): sync removed images/videos back to Laravel ──
      // The X button only removes items from local state — we must tell Laravel
      // which URLs to keep so it can delete the rest from disk + DB.
      if (isUpdate && savedId) {
        const keepImages = existingImages.map((img) => {
          // strip the full base URL prefix — Laravel stores relative paths
          const rel = img.url.replace(`${LARAVEL_API}/`, "").replace(/^\//, "");
          return rel;
        });
        const keepVideos = existingVideos.map((url) => {
          const fullUrl = getFullImageUrl(url) || url;
          return fullUrl.replace(`${LARAVEL_API}/`, "").replace(/^\//, "");
        });

        const syncFd = new FormData();
        syncFd.append("_method", "PUT");
        keepImages.forEach((p) => syncFd.append("keep_images[]", p));
        keepVideos.forEach((p) => syncFd.append("keep_videos[]", p));

        const { ok: syncOk, data: syncData } = await laravelFetch(
          `api/developers-properties/${savedId}/sync-media`,
          "POST",
          syncFd,
        );
        if (!syncOk)
          console.warn("Media sync warning:", syncData?.message ?? syncData);
      }

      setUploadProgress(40);

      // ── Step 4: Upload gallery images in batches directly to Laravel ──
      if (galleryFiles.length > 0) {
        setUploadStage(`Uploading ${galleryFiles.length} image(s) in batches…`);
        await uploadImageBatches(savedId, galleryFiles, (pct) => {
          setUploadProgress(40 + Math.round(pct * 0.35)); // 40–75%
        });
      }

      // ── Step 5: Upload videos one-by-one directly to Laravel ──
      if (videoFiles.length > 0) {
        setUploadStage(`Uploading ${videoFiles.length} video(s)…`);
        await uploadVideoBatches(
          savedId,
          videoFiles.map((v) => v.file),
          (pct) => {
            setUploadProgress(75 + Math.round(pct * 0.22)); // 75–97%
          },
        );
      }

      setUploadProgress(100);
      onSaved(mode === "create" ? "Property created!" : "Property updated!");
      onClose();
    } catch (err: any) {
      setError(
        err.message ||
          "Network error. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setUploadStage("");
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
                {mode === "create" ? "Add Developer Property" : "Edit Property"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {mode === "create"
                  ? "Fill in the details to list a new developer property."
                  : "Update the property information below."}
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
              {/* ── Left Column ── */}
              <div className="bg-slate-50 p-6 flex flex-col gap-5 border-r border-slate-100">
                {/* Listing type */}
                <div>
                  <label className={lbl}>Listing Type *</label>
                  <div className="flex gap-2">
                    {(["sale", "rent"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setF("listing_type", t)}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${
                          form.listing_type === t
                            ? t === "sale"
                              ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-200"
                              : "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
                        }`}
                      >
                        {t === "sale" ? "🏷 For Sale" : "🔑 For Rent"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`${lbl} mb-0`}>Tags (Optional)</label>
                    <button
                      type="button"
                      onClick={addTag}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold transition-colors"
                    >
                      + Add Tag
                    </button>
                  </div>

                  {/* Toggle on any tag already used on another developer property */}
                  {(loadingTags || availableTags.length > 0) && (
                    <div className="mb-3">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Previously used tags — tap to add/remove
                      </p>
                      <ExistingTagsPicker
                        availableTags={availableTags}
                        selectedLabels={selectedTagLabels}
                        onToggle={toggleExistingTag}
                        onDelete={deleteTagEverywhere}
                        loading={loadingTags}
                      />
                    </div>
                  )}

                  {tags.length === 0 && (
                    <p className="text-xs text-slate-400 mb-2">
                      No tags yet. e.g. &quot;3 Months Free&quot;, &quot;Free
                      Last Month Rent&quot;, &quot;Limited Slots&quot;.
                    </p>
                  )}

                  <div className="flex flex-col gap-2">
                    {tags.map((tag, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2"
                      >
                        <input
                          type="checkbox"
                          checked={tag.active ?? true}
                          onChange={(e) =>
                            updateTag(i, { active: e.target.checked })
                          }
                          title="Show this tag"
                          className="w-4 h-4 rounded accent-blue-600 flex-shrink-0"
                        />
                        <input
                          type="text"
                          value={tag.label}
                          onChange={(e) =>
                            updateTag(i, { label: e.target.value })
                          }
                          placeholder="e.g. 3 Months Free"
                          className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400"
                        />
                        <select
                          value={tag.color}
                          onChange={(e) =>
                            updateTag(i, { color: e.target.value })
                          }
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-400 appearance-none cursor-pointer flex-shrink-0"
                        >
                          {TAG_COLOR_OPTIONS.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                        <span
                          className={`w-4 h-4 rounded-full flex-shrink-0 ${getTagColorDot(tag.color)}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeTag(i)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {tags.some((t) => t.active && t.label.trim()) && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tags
                        .filter((t) => t.active && t.label.trim())
                        .map((t, i) => (
                          <span
                            key={i}
                            className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold ${getTagColorClasses(t.color)}`}
                          >
                            {t.label}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className={lbl}>
                    {isSale ? "Selling Price ₱ *" : "Monthly Rent ₱ *"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold select-none">
                      ₱
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={`${inp} pl-7`}
                      value={isSale ? priceDisplay : rentDisplay}
                      onChange={(e) =>
                        isSale
                          ? handlePriceChange(e.target.value, setPriceDisplay)
                          : handlePriceChange(e.target.value, setRentDisplay)
                      }
                      placeholder={
                        isSale
                          ? "4,500,000 or 2,000,000-4,500,000"
                          : "25,000 or 25,000-40,000"
                      }
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {isSale
                      ? "One-time selling price or range (e.g. 2,000,000-4,500,000)"
                      : "Price per month or range (e.g. 25,000-40,000)"}
                  </p>
                </div>

                {/* Priority */}
                <div>
                  <label className={lbl}>Priority (Optional)</label>
                  <div className="relative">
                    <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      min="1"
                      max="999"
                      className={`${inp} pl-9`}
                      value={form.priority ?? ""}
                      onChange={(e) =>
                        setF(
                          "priority",
                          e.target.value ? parseInt(e.target.value) : null,
                        )
                      }
                      placeholder="1 (highest priority)"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    1 = highest. Leave empty for no priority.
                  </p>
                </div>

                {/* Status (edit mode) */}
                {mode === "edit" && (
                  <div>
                    <label className={lbl}>Status</label>
                    <select
                      className={sel}
                      value={form.status}
                      onChange={(e) => setF("status", e.target.value)}
                    >
                      {["active", "inactive", "sold", "rented"].map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Thumbnail */}
                <div>
                  <label className={lbl}>
                    Thumbnail{" "}
                    <span className="text-slate-400 font-normal normal-case">
                      (&lt; 10 MB)
                    </span>
                  </label>
                  <div
                    onClick={() => thumbRef.current?.click()}
                    className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 hover:border-blue-400 cursor-pointer transition-colors group bg-white"
                  >
                    {thumbPreview ? (
                      <>
                        <img
                          src={thumbPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                          <Upload className="w-5 h-5 text-white" />
                          <span className="text-white text-xs font-medium">
                            Change
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <ImageIcon className="w-7 h-7 text-slate-300 group-hover:text-blue-400 transition-colors" />
                        <p className="text-xs text-slate-400 font-medium">
                          Click to upload
                        </p>
                        <p className="text-[10px] text-slate-300">
                          Any image format
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={thumbRef}
                    type="file"
                    accept={ACCEPT_ALL_IMAGES}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > MAX_IMAGE_SIZE) {
                        setError(
                          `Thumbnail too large (${formatFileSize(file.size)}). Max ${formatFileSize(MAX_IMAGE_SIZE)}.`,
                        );
                        return;
                      }
                      setThumbFile(file);
                      setThumbPreview(URL.createObjectURL(file));
                    }}
                  />
                </div>

                {/* Gallery */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`${lbl} mb-0`}>
                      Gallery ({totalGalleryCount}/10)
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

                  {/* Upload info */}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-800">
                        <p className="font-semibold mb-0.5">
                          Fast and secure image upload
                        </p>
                        <p className="text-blue-600">
                          Upload high-quality images with support for files up
                          to {formatFileSize(MAX_IMAGE_SIZE)} per image.
                        </p>
                      </div>
                    </div>
                  </div>

                  {existingImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {existingImages.map((img, i) => (
                        <div
                          key={i}
                          className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                        >
                          <img
                            src={img.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1 left-1 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                            SAVED
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setExistingImages((p) =>
                                p.filter((_, j) => j !== i),
                              )
                            }
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {totalGalleryCount < 10 && (
                    <div
                      onClick={() => galleryRef.current?.click()}
                      className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 cursor-pointer transition-colors bg-white text-center group"
                    >
                      <Upload className="w-5 h-5 text-slate-300 group-hover:text-blue-400 mx-auto mb-1 transition-colors" />
                      <p className="text-xs text-slate-400 font-medium">
                        {totalGalleryCount === 0
                          ? "Add gallery images"
                          : "Add more images"}
                      </p>
                      <p className="text-[10px] text-slate-300">
                        All formats · max {formatFileSize(MAX_IMAGE_SIZE)} each
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
                      const { valid, errors } = validateImageFiles(files);
                      if (errors.length > 0)
                        setError(`⚠️ File size issues:\n${errors.join("\n")}`);
                      const remaining = 10 - existingImages.length;
                      setGalleryFiles((prev) =>
                        [...prev, ...valid].slice(0, remaining),
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

                {/* Video upload */}
                <div>
                  <label className={lbl}>
                    Property Videos{" "}
                    <span className="text-slate-400 text-xs font-normal">
                      (Optional · up to {formatFileSize(MAX_VIDEO_SIZE)} each)
                    </span>
                  </label>
                  <div
                    onClick={() => videoRef.current?.click()}
                    className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-violet-400 cursor-pointer transition-colors bg-white text-center group"
                  >
                    <Video className="w-5 h-5 text-slate-300 group-hover:text-violet-400 mx-auto mb-1 transition-colors" />
                    <p className="text-xs text-slate-400 font-medium">
                      Click to upload video
                    </p>
                    <p className="text-[10px] text-slate-300">
                      MP4, MOV, or WebM · direct upload
                    </p>
                  </div>
                  <input
                    ref={videoRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      const { valid, errors } = validateVideoFiles(files);
                      if (errors.length > 0)
                        setError(`⚠️ Video size issues:\n${errors.join("\n")}`);
                      const newVids = valid.map((f) => ({
                        file: f,
                        preview: URL.createObjectURL(f),
                      }));
                      setVideoFiles((prev) => [...prev, ...newVids]);
                      e.target.value = "";
                    }}
                  />
                  {videoFiles.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {videoFiles.map((v, i) => (
                        <div
                          key={i}
                          className="relative bg-black rounded-xl overflow-hidden group"
                        >
                          <video
                            src={v.preview}
                            controls
                            className="w-full aspect-video"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setVideoFiles((p) =>
                                p.filter((_, idx) => idx !== i),
                              )
                            }
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {existingVideos.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Saved Videos
                      </p>
                      {existingVideos.map((url, i) => (
                        <div
                          key={i}
                          className="relative bg-black rounded-xl overflow-hidden group"
                        >
                          <video
                            src={getFullImageUrl(url) || ""}
                            controls
                            className="w-full aspect-video"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setExistingVideos((p) =>
                                p.filter((_, j) => j !== i),
                              )
                            }
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Right Column ── */}
              <div className="col-span-2 p-6 space-y-5">
                {/* Title */}
                <div>
                  <label className={lbl}>Property Title *</label>
                  <input
                    className={inp}
                    value={form.title}
                    onChange={(e) => setF("title", e.target.value)}
                    placeholder="e.g. Modern 2BR Condo in BGC"
                  />
                </div>

                {/* Developer Name */}
                <div>
                  <label className={lbl}>Developer Name</label>
                  <input
                    className={inp}
                    value={form.developer_name}
                    onChange={(e) => setF("developer_name", e.target.value)}
                    placeholder="e.g. DMCI AVIDA, FILINVEST, Ayala Land"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Developer company name (e.g., DMCI AVIDA, FILINVEST)
                  </p>
                </div>

                {/* Property Type */}
                <div>
                  <label className={lbl}>Property Type *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        value: "residential",
                        label: "Residential",
                        emoji: "🏠",
                        desc: "Condo, House & Lot, Apartment…",
                        activeClass: "bg-blue-600 border-blue-600 text-white",
                        iconClass: "bg-blue-100",
                      },
                      {
                        value: "office_space",
                        label: "Office Space",
                        emoji: "🖥️",
                        desc: "Regular, Co-Working, Executive…",
                        activeClass:
                          "bg-violet-600 border-violet-600 text-white",
                        iconClass: "bg-violet-100",
                      },
                      {
                        value: "commercial",
                        label: "Commercial",
                        emoji: "🏪",
                        desc: "Retail, Restaurant, Clinic…",
                        activeClass: "bg-amber-500 border-amber-500 text-white",
                        iconClass: "bg-amber-100",
                      },
                    ].map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setF("property_type", t.value)}
                        className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all ${
                          form.property_type === t.value
                            ? `${t.activeClass} shadow-md scale-[1.02]`
                            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                        }`}
                      >
                        <span
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${form.property_type === t.value ? "bg-white/20" : t.iconClass}`}
                        >
                          {t.emoji}
                        </span>
                        <span
                          className={`text-xs font-bold ${form.property_type === t.value ? "text-white" : "text-slate-700"}`}
                        >
                          {t.label}
                        </span>
                        <span
                          className={`text-[10px] leading-tight ${form.property_type === t.value ? "text-white/70" : "text-slate-600"}`}
                        >
                          {t.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Residential Details ── */}
                {form.property_type === "residential" && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-sm">
                        🏠
                      </span>
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                        Residential Details
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lbl}>Residential Type</label>
                        <select
                          className={sel}
                          value={form.residential_type}
                          onChange={(e) =>
                            setF("residential_type", e.target.value)
                          }
                        >
                          <option value="">Select type</option>
                          {RESIDENTIAL_TYPES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={lbl}>Bedroom Type</label>
                        <select
                          className={sel}
                          value={form.bedroom_type}
                          onChange={(e) => setF("bedroom_type", e.target.value)}
                        >
                          <option value="">Select</option>
                          {BEDROOM_TYPES.map((b) => (
                            <option key={b.value} value={b.value}>
                              {b.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lbl}>Floor Level</label>
                        <input
                          className={inp}
                          value={form.floor_level}
                          onChange={(e) => setF("floor_level", e.target.value)}
                          placeholder="e.g. Ground Floor, 5th, High Floor"
                        />
                      </div>
                      <div>
                        <label className={lbl}>Furnished Status</label>
                        <select
                          className={sel}
                          value={form.furnished}
                          onChange={(e) => setF("furnished", e.target.value)}
                        >
                          <option value="">Select</option>
                          {FURNISHED_OPTIONS.map((f) => (
                            <option key={f.value} value={f.value}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={lbl}>Bathrooms</label>
                        <div className="relative">
                          <Bath className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="number"
                            className={`${inp} pl-9`}
                            value={form.bathrooms}
                            onChange={(e) => setF("bathrooms", e.target.value)}
                            placeholder="0"
                            min={0}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={lbl}>Area (sqm)</label>
                        <div className="relative">
                          <Square className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            className={`${inp} pl-9`}
                            value={form.area}
                            onChange={(e) => setF("area", e.target.value)}
                            placeholder="50 or 22-25"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={lbl}>Parking</label>
                        <input
                          type="number"
                          className={inp}
                          value={form.parking_slots}
                          onChange={(e) =>
                            setF("parking_slots", e.target.value)
                          }
                          placeholder="1"
                          min={0}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Office Details ── */}
                {form.property_type === "office_space" && (
                  <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center text-sm">
                        🖥️
                      </span>
                      <p className="text-xs font-bold text-violet-700 uppercase tracking-wider">
                        Office Space Details
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lbl}>Office Type</label>
                        <select
                          className={sel}
                          value={form.office_space_type}
                          onChange={(e) =>
                            setF("office_space_type", e.target.value)
                          }
                        >
                          <option value="">Select type</option>
                          {OFFICE_TYPES.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={lbl}>Internet</label>
                        <select
                          className={sel}
                          value={form.office_internet}
                          onChange={(e) =>
                            setF("office_internet", e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          {OFFICE_INTERNET_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={lbl}>Area (sqm)</label>
                        <input
                          type="text"
                          className={inp}
                          value={form.office_area}
                          onChange={(e) => setF("office_area", e.target.value)}
                          placeholder="60 or 40-80"
                        />
                      </div>
                      <div>
                        <label className={lbl}>Floor Level</label>
                        <input
                          className={inp}
                          value={form.office_floor}
                          onChange={(e) => setF("office_floor", e.target.value)}
                          placeholder="e.g. 3rd Floor"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>
                        Office Name / Label (Optional)
                      </label>
                      <input
                        className={inp}
                        value={form.office_space_name}
                        onChange={(e) =>
                          setF("office_space_name", e.target.value)
                        }
                        placeholder="e.g. Unit 502 — BGC Hub"
                      />
                    </div>
                  </div>
                )}

                {/* ── Commercial Details ── */}
                {form.property_type === "commercial" && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-sm">
                        🏪
                      </span>
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                        Commercial Details
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lbl}>Commercial Type</label>
                        <select
                          className={sel}
                          value={form.commercial_type}
                          onChange={(e) =>
                            setF("commercial_type", e.target.value)
                          }
                        >
                          <option value="">Select type</option>
                          {COMMERCIAL_TYPES.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={lbl}>Floor Level</label>
                        <input
                          className={inp}
                          value={form.commercial_floor_level}
                          onChange={(e) =>
                            setF("commercial_floor_level", e.target.value)
                          }
                          placeholder="e.g. Ground Floor"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lbl}>Total Area (sqm)</label>
                        <input
                          type="text"
                          className={inp}
                          value={form.commercial_area}
                          onChange={(e) =>
                            setF("commercial_area", e.target.value)
                          }
                          placeholder="80 or 60-100"
                        />
                      </div>
                      <div>
                        <label className={lbl}>Frontage Width (m)</label>
                        <input
                          type="number"
                          className={inp}
                          value={form.commercial_frontage}
                          onChange={(e) =>
                            setF("commercial_frontage", e.target.value)
                          }
                          placeholder="5"
                          min={0}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>
                        Commercial Name / Label (Optional)
                      </label>
                      <input
                        className={inp}
                        value={form.commercial_name}
                        onChange={(e) =>
                          setF("commercial_name", e.target.value)
                        }
                        placeholder="e.g. Retail Unit A — Ground Floor"
                      />
                    </div>
                  </div>
                )}

                {/* Address */}
                <div>
                  <label className={lbl}>Full Address *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      className={`${inp} pl-9`}
                      value={form.address}
                      onChange={(e) => setF("address", e.target.value)}
                      placeholder="Unit/Block, Street, Building, City, Province"
                    />
                  </div>
                </div>

                {/* Visibility Map */}
                <div>
                  <label className={lbl}>Visibility Map</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      className={`${inp} pl-9`}
                      value={form.visibility_map}
                      onChange={(e) => setF("visibility_map", e.target.value)}
                      placeholder="Google Maps URL, e.g. https://www.google.com/maps/embed?pb=..."
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Paste a Google Maps embed or share link so buyers can see
                    the location.
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className={lbl}>Description</label>
                  <textarea
                    className={`${inp} resize-none`}
                    rows={3}
                    value={form.description}
                    onChange={(e) => setF("description", e.target.value)}
                    placeholder="Describe the property's key features, surroundings, selling points…"
                  />
                </div>

                {/* Amenities */}
                <div>
                  <label className={lbl}>
                    Amenities
                    {selectedAmenities.length > 0 && (
                      <span className="ml-2 text-blue-500 normal-case font-normal tracking-normal text-xs">
                        {selectedAmenities.length} selected
                      </span>
                    )}
                  </label>
                  <TagCheckboxGroup
                    options={AMENITY_OPTIONS}
                    selected={selectedAmenities}
                    onChange={setSelectedAmenities}
                    accentColor="blue"
                  />
                  {selectedAmenities.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedAmenities([])}
                      className="mt-2 text-[11px] text-slate-400 hover:text-blue-500 transition-colors"
                    >
                      Clear selection
                    </button>
                  )}
                </div>

                {/* Other amenities */}
                <div>
                  <label className={lbl}>Other Amenities</label>
                  <input
                    className={inp}
                    value={form.amenities_other}
                    onChange={(e) => setF("amenities_other", e.target.value)}
                    placeholder="e.g. Wine Cellar, Putting Green (comma-separated)"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <pre className="whitespace-pre-wrap font-sans">{error}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-8 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0 gap-4">
            {/* Progress bar */}
            {loading && uploadProgress > 0 ? (
              <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">
                      {uploadStage || "Uploading…"}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${isSale ? "bg-red-500" : "bg-blue-500"}`}
                />
                <span className="text-xs font-semibold text-slate-500">
                  {isSale ? "For Sale" : "For Rent"}
                  {isSale && priceDisplay ? ` — ₱${priceDisplay}` : ""}
                  {!isSale && rentDisplay ? ` — ₱${rentDisplay}/mo` : ""}
                  {form.property_type
                    ? ` · ${form.property_type.replace("_", " ")}`
                    : ""}
                </span>
              </div>
            )}

            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-200"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading
                  ? "Saving…"
                  : mode === "create"
                    ? "+ Create Property"
                    : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── View Modal ────────────────────────────────────────────────────────────────
function ViewModal({
  property,
  onClose,
}: {
  property: DeveloperProperty;
  onClose: () => void;
}) {
  type ViewTab = "details" | "photos" | "videos" | "units";
  const [activeTab, setActiveTab] = useState<ViewTab>("details");

  const price =
    property.listing_type === "rent"
      ? formatPriceDisplay(property.price_per_month, "/mo")
      : formatPriceDisplay(property.price);

  const typeColorMap: Record<string, string> = {
    residential: "bg-blue-50 text-blue-700 border-blue-200",
    office_space: "bg-violet-50 text-violet-700 border-violet-200",
    commercial: "bg-amber-50 text-amber-700 border-amber-200",
  };
  const typeLabel: Record<string, string> = {
    residential: "Residential",
    office_space: "Office Space",
    commercial: "Commercial",
  };

  const amenities = normalizeArray(property.amenities);
  const images = normalizeArray(property.images);
  const videos = normalizeArray(property.videos);
  const tags = normalizeTags(property.tags);

  const statusStyles: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    sold: "bg-blue-100 text-blue-700 border-blue-200",
    rented: "bg-purple-100 text-purple-700 border-purple-200",
    inactive: "bg-slate-100 text-slate-500 border-slate-200",
  };

  const tabs: { id: ViewTab; label: string; count?: number }[] = [
    { id: "details", label: "Details" },
    { id: "photos", label: "Photos", count: images.length },
    { id: "videos", label: "Videos", count: videos.length },
    { id: "units", label: "Units"},
  ];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
          style={{ animation: "modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          {property.thumbnail ? (
            <div className="h-52 w-full relative flex-shrink-0">
              <img
                src={getFullImageUrl(property.thumbnail) || ""}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-700" />
              </button>
              <div className="absolute bottom-4 left-5 right-5">
                <h2 className="text-white font-bold text-xl leading-tight">
                  {property.title}
                </h2>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-6 pt-6 flex-shrink-0">
              <h2 className="text-slate-800 font-bold text-xl">
                {property.title}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center flex-shrink-0"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          )}

          {/* Badges row */}
          <div className="px-6 pt-4 flex items-center gap-2 flex-wrap flex-shrink-0">
            <span
              className={`text-xs px-3 py-1 rounded-full border font-semibold capitalize ${statusStyles[property.status] ?? statusStyles.inactive}`}
            >
              {property.status}
            </span>
            <span
              className={`text-xs px-3 py-1 rounded-full border font-semibold ${property.listing_type === "rent" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-red-50 text-red-600 border-red-200"}`}
            >
              {property.listing_type === "rent" ? "🔑 For Rent" : "🏷 For Sale"}
            </span>
            {tags
              .filter((t) => (t.active ?? true) && t.label?.trim())
              .map((t, i) => (
                <span
                  key={i}
                  className={`text-xs px-3 py-1 rounded-full border font-semibold ${getTagColorClasses(t.color)}`}
                >
                  {t.label}
                </span>
              ))}
            <span
              className={`text-xs px-3 py-1 rounded-full border font-semibold capitalize ${typeColorMap[property.property_type] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}
            >
              {typeLabel[property.property_type] ??
                property.property_type?.replace("_", " ")}
            </span>
            {property.priority && (
              <span
                className={`text-xs px-3 py-1 rounded-full border font-semibold flex items-center gap-1 ${getPriorityBadgeColor(property.priority)}`}
              >
                🚩 Priority #{property.priority}
              </span>
            )}
          </div>

          {/* Tab bar */}
          <div className="px-6 mt-4 border-b border-slate-100 flex-shrink-0">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isActive
                            ? "bg-blue-100 text-blue-600"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {activeTab === "details" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                      About the Property
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
                          <DollarSign className="w-3 h-3" />
                          {property.listing_type === "rent"
                            ? "Monthly Rent"
                            : "Price"}
                        </div>
                        <p className="text-slate-700 font-bold text-sm">
                          {price}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
                          <Building2 className="w-3 h-3" />
                          Developer
                        </div>
                        <p className="text-slate-700 font-bold text-sm">
                          {property.developer_name || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 mb-3">
                      <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        Full Address
                      </p>
                      <p className="text-slate-700 font-semibold text-sm">
                        {property.address}
                      </p>
                    </div>

                    {property.description && (
                      <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                        <p className="text-xs text-slate-400 mb-2">
                          Description
                        </p>
                        <p className="text-slate-700 text-sm leading-relaxed">
                          {property.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {property.property_type === "residential" && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                        Residential Details
                      </h3>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                          <div className="flex items-center gap-1 text-slate-400 text-[9px] mb-0.5">
                            <Bed className="w-3 h-3" /> Bedroom
                          </div>
                          <p className="text-slate-700 font-bold text-xs">
                            {property.bedroom_type ?? "—"}
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                          <div className="flex items-center gap-1 text-slate-400 text-[9px] mb-0.5">
                            <Bath className="w-3 h-3" /> Baths
                          </div>
                          <p className="text-slate-700 font-bold text-xs">
                            {property.bathrooms ?? "—"}
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                          <div className="flex items-center gap-1 text-slate-400 text-[9px] mb-0.5">
                            <Square className="w-3 h-3" /> Area
                          </div>
                          <p className="text-slate-700 font-bold text-xs">
                            {property.area ?? "—"}
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                          <div className="text-slate-400 text-[9px] mb-0.5">
                            Parking
                          </div>
                          <p className="text-slate-700 font-bold text-xs">
                            {property.parking_slots ?? "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {property.property_type === "office_space" && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                        Office Space Details
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                          <div className="text-slate-400 text-[9px] mb-0.5">
                            Type
                          </div>
                          <p className="text-slate-700 font-bold text-xs capitalize">
                            {property.office_space_type?.replace("_", " ") ??
                              "—"}
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                          <div className="text-slate-400 text-[9px] mb-0.5">
                            Area
                          </div>
                          <p className="text-slate-700 font-bold text-xs">
                            {property.office_area ?? "—"}
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                          <div className="text-slate-400 text-[9px] mb-0.5">
                            Floor
                          </div>
                          <p className="text-slate-700 font-bold text-xs">
                            {property.office_floor ?? "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {property.property_type === "commercial" && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                        Commercial Details
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                          <div className="text-slate-400 text-[9px] mb-0.5">
                            Type
                          </div>
                          <p className="text-slate-700 font-bold text-xs capitalize">
                            {property.commercial_type?.replace("_", " ") ?? "—"}
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                          <div className="text-slate-400 text-[9px] mb-0.5">
                            Area
                          </div>
                          <p className="text-slate-700 font-bold text-xs">
                            {property.commercial_area ?? "—"}
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                          <div className="text-slate-400 text-[9px] mb-0.5">
                            Frontage
                          </div>
                          <p className="text-slate-700 font-bold text-xs">
                            {property.commercial_frontage ?? "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                      Visibility Map
                    </h3>
                    {property.visibility_map ? (
                      <div className="rounded-2xl overflow-hidden border border-slate-100 aspect-video">
                        <iframe
                          src={property.visibility_map}
                          className="w-full h-full"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                    ) : (
                      <div className="bg-slate-50 rounded-2xl p-6 border border-dashed border-slate-200 text-center">
                        <MapIcon className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">
                          No map link set for this property.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                      Amenities
                    </h3>
                    {amenities.length > 0 || property.amenities_other ? (
                      <div className="flex flex-wrap gap-1.5">
                        {amenities.map((a: any, i: number) => {
                          const label =
                            typeof a === "string" ? a : (a?.name ?? "");
                          return label ? (
                            <span
                              key={`am-${i}`}
                              className="text-xs px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 font-medium"
                            >
                              {label}
                            </span>
                          ) : null;
                        })}
                        {property.amenities_other &&
                          property.amenities_other
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .map((label, i) => (
                              <span
                                key={`other-${i}`}
                                className="text-xs px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 font-medium"
                              >
                                {label}
                              </span>
                            ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        No amenities listed.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "photos" && (
                <div>
                  {images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {images.map((img: any, i: number) => {
                        const imgUrl =
                          typeof img === "string" ? img : (img?.url ?? "");
                        return (
                          <div
                            key={i}
                            className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                          >
                            <img
                              src={getFullImageUrl(imgUrl) || ""}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-2xl p-8 border border-dashed border-slate-200 text-center">
                      <ImageIcon className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">
                        No photos uploaded yet.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "videos" && (
                <div>
                  {videos.length > 0 ? (
                    <div className="space-y-3">
                      {videos.map((vid: any, i: number) => {
                        const vidUrl =
                          typeof vid === "string" ? vid : (vid?.url ?? "");
                        return (
                          <div
                            key={i}
                            className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden"
                          >
                            <div className="bg-black aspect-video flex items-center justify-center overflow-hidden">
                              <video
                                src={getFullImageUrl(vidUrl) || ""}
                                controls
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-2xl p-8 border border-dashed border-slate-200 text-center">
                      <Video className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">
                        No videos uploaded yet.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "units" && (
                <div>
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                            typeColorMap[property.property_type] ??
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {property.property_type === "residential"
                            ? "🏠"
                            : property.property_type === "office_space"
                              ? "🖥️"
                              : "🏪"}
                        </span>
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                          {typeLabel[property.property_type] ??
                            property.property_type}
                          {property.residential_type
                            ? ` · ${RESIDENTIAL_TYPES.find((r) => r.value === property.residential_type)?.label ?? property.residential_type}`
                            : ""}
                        </p>
                      </div>
                      <p className="text-slate-800 text-sm font-bold">
                        {price}
                      </p>
                    </div>

                    <div className="p-3.5">
                      {property.property_type === "residential" && (
                        <div className="grid grid-cols-3 gap-1.5">
                          <div className="bg-white rounded-lg p-2 border border-slate-100">
                            <div className="flex items-center gap-1 text-slate-400 text-[9px] mb-0.5">
                              <Bed className="w-3 h-3" /> Bedroom
                            </div>
                            <p className="text-slate-700 font-bold text-xs">
                              {BEDROOM_TYPES.find(
                                (b) => b.value === property.bedroom_type,
                              )?.label ??
                                property.bedroom_type ??
                                "—"}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-slate-100">
                            <div className="flex items-center gap-1 text-slate-400 text-[9px] mb-0.5">
                              <Bath className="w-3 h-3" /> Baths
                            </div>
                            <p className="text-slate-700 font-bold text-xs">
                              {property.bathrooms ?? "—"}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-slate-100">
                            <div className="flex items-center gap-1 text-slate-400 text-[9px] mb-0.5">
                              <Square className="w-3 h-3" /> Area (sqm)
                            </div>
                            <p className="text-slate-700 font-bold text-xs">
                              {property.area ?? "—"}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-slate-100">
                            <div className="text-slate-400 text-[9px] mb-0.5">
                              Floor Level
                            </div>
                            <p className="text-slate-700 font-bold text-xs">
                              {property.floor_level ?? "—"}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-slate-100">
                            <div className="text-slate-400 text-[9px] mb-0.5">
                              Furnished
                            </div>
                            <p className="text-slate-700 font-bold text-xs">
                              {FURNISHED_OPTIONS.find(
                                (f) => f.value === property.furnished,
                              )?.label ??
                                property.furnished ??
                                "—"}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-slate-100">
                            <div className="text-slate-400 text-[9px] mb-0.5">
                              Parking
                            </div>
                            <p className="text-slate-700 font-bold text-xs">
                              {property.parking_slots ?? "—"}
                            </p>
                          </div>
                        </div>
                      )}

                      {property.property_type === "office_space" && (
                        <div className="grid grid-cols-3 gap-1.5">
                          <div className="bg-white rounded-lg p-2 border border-slate-100">
                            <div className="text-slate-400 text-[9px] mb-0.5">
                              Type
                            </div>
                            <p className="text-slate-700 font-bold text-xs capitalize">
                              {OFFICE_TYPES.find(
                                (o) => o.value === property.office_space_type,
                              )?.label ??
                                property.office_space_type?.replace("_", " ") ??
                                "—"}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-slate-100">
                            <div className="flex items-center gap-1 text-slate-400 text-[9px] mb-0.5">
                              <Square className="w-3 h-3" /> Area (sqm)
                            </div>
                            <p className="text-slate-700 font-bold text-xs">
                              {property.office_area ?? "—"}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-slate-100">
                            <div className="text-slate-400 text-[9px] mb-0.5">
                              Floor Level
                            </div>
                            <p className="text-slate-700 font-bold text-xs">
                              {property.office_floor ?? "—"}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-slate-100">
                            <div className="text-slate-400 text-[9px] mb-0.5">
                              Internet
                            </div>
                            <p className="text-slate-700 font-bold text-xs">
                              {OFFICE_INTERNET_OPTIONS.find(
                                (o) => o.value === property.office_internet,
                              )?.label ??
                                property.office_internet ??
                                "—"}
                            </p>
                          </div>
                          {property.office_space_name && (
                            <div className="bg-white rounded-lg p-2 border border-slate-100 col-span-2">
                              <div className="text-slate-400 text-[9px] mb-0.5">
                                Label
                              </div>
                              <p className="text-slate-700 font-bold text-xs">
                                {property.office_space_name}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {property.property_type === "commercial" && (
                        <div className="grid grid-cols-3 gap-1.5">
                          <div className="bg-white rounded-lg p-2 border border-slate-100">
                            <div className="text-slate-400 text-[9px] mb-0.5">
                              Type
                            </div>
                            <p className="text-slate-700 font-bold text-xs capitalize">
                              {COMMERCIAL_TYPES.find(
                                (c) => c.value === property.commercial_type,
                              )?.label ??
                                property.commercial_type?.replace("_", " ") ??
                                "—"}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-slate-100">
                            <div className="flex items-center gap-1 text-slate-400 text-[9px] mb-0.5">
                              <Square className="w-3 h-3" /> Area (sqm)
                            </div>
                            <p className="text-slate-700 font-bold text-xs">
                              {property.commercial_area ?? "—"}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-slate-100">
                            <div className="text-slate-400 text-[9px] mb-0.5">
                              Frontage (m)
                            </div>
                            <p className="text-slate-700 font-bold text-xs">
                              {property.commercial_frontage ?? "—"}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-slate-100">
                            <div className="text-slate-400 text-[9px] mb-0.5">
                              Floor Level
                            </div>
                            <p className="text-slate-700 font-bold text-xs">
                              {property.commercial_floor_level ?? "—"}
                            </p>
                          </div>
                          {property.commercial_name && (
                            <div className="bg-white rounded-lg p-2 border border-slate-100 col-span-2">
                              <div className="text-slate-400 text-[9px] mb-0.5">
                                Label
                              </div>
                              <p className="text-slate-700 font-bold text-xs">
                                {property.commercial_name}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {!["residential", "office_space", "commercial"].includes(
                        property.property_type,
                      ) && (
                        <p className="text-xs text-slate-400 text-center py-4">
                          No unit details available for this property type.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function getPriorityBadgeColor(priority: number | null | undefined): string {
  if (!priority) return "bg-slate-100 text-slate-600";
  if (priority === 1) return "bg-red-100 text-red-700 border-red-200";
  if (priority === 2) return "bg-orange-100 text-orange-700 border-orange-200";
  if (priority === 3) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-blue-100 text-blue-700 border-blue-200";
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminDevelopersPage() {
  const [properties, setProperties] = useState<DeveloperProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<DeveloperProperty | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeveloperProperty | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    listing_type: "",
    property_type: "",
    status: "",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const PER_PAGE = 12;

  const toast = (type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, type, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(PER_PAGE),
      });
      if (search) params.set("search", search);
      if (filters.listing_type)
        params.set("listing_type", filters.listing_type);
      if (filters.property_type)
        params.set("property_type", filters.property_type);
      if (filters.status) params.set("status", filters.status);

      // READ requests stay on Next.js API route (no size issue there)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/developers-properties?${params}`,
        {
          headers: authHeaders(),
        },
      );
      const data = await res.json();
      setProperties(data.data ?? data);
      setTotal(data.total ?? (data.data ?? data).length);
      setLastPage(data.last_page ?? 1);
    } catch {
      toast("error", "Failed to load properties.");
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      // DELETE also goes directly to Laravel
      const { ok } = await laravelFetch(
        `api/developers-properties/${deleteTarget.id}`,
        "DELETE",
      );
      if (!ok) throw new Error();
      toast("success", "Property deleted.");
      setDeleteTarget(null);
      fetchProperties();
    } catch {
      toast("error", "Failed to delete property.");
    } finally {
      setDeleting(false);
    }
  };

  const typeColorMap: Record<string, string> = {
    residential: "bg-blue-50 text-blue-700 border-blue-200",
    office_space: "bg-violet-50 text-violet-700 border-violet-200",
    commercial: "bg-amber-50 text-amber-700 border-amber-200",
  };
  const typeLabel: Record<string, string> = {
    residential: "Residential",
    office_space: "Office Space",
    commercial: "Commercial",
  };

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
                Developer Properties
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {total} total listings
              </p>
            </div>
            <button
              onClick={() => {
                setSelected(null);
                setModal("create");
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Property
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                placeholder="Search by title, address, developer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            {[
              {
                key: "listing_type",
                opts: [
                  { v: "", l: "All Listing Types" },
                  { v: "sale", l: "For Sale" },
                  { v: "rent", l: "For Rent" },
                ],
              },
              {
                key: "property_type",
                opts: [
                  { v: "", l: "All Property Types" },
                  { v: "residential", l: "Residential" },
                  { v: "office_space", l: "Office Space" },
                  { v: "commercial", l: "Commercial" },
                ],
              },
              {
                key: "status",
                opts: [
                  { v: "", l: "All Status" },
                  { v: "active", l: "Active" },
                  { v: "inactive", l: "Inactive" },
                  { v: "sold", l: "Sold" },
                  { v: "rented", l: "Rented" },
                ],
              },
            ].map(({ key, opts }) => (
              <select
                key={key}
                className="bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm text-slate-600 focus:outline-none focus:border-blue-400 shadow-sm appearance-none cursor-pointer"
                value={(filters as any)[key]}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, [key]: e.target.value }));
                  setPage(1);
                }}
              >
                {opts.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.l}
                  </option>
                ))}
              </select>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_120px] gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50">
              {[
                "Property",
                "Developer",
                "Type",
                "Price",
                "Status",
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

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">
                  Loading properties...
                </p>
              </div>
            ) : !properties.length ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-base font-semibold text-slate-600">
                  No developer properties found
                </p>
                <p className="text-sm text-slate-400">
                  Try adjusting your filters or add a new property.
                </p>
                <button
                  onClick={() => {
                    setSelected(null);
                    setModal("create");
                  }}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
                >
                  + Add First Property
                </button>
              </div>
            ) : (
              <div>
                {properties
                  .sort((a, b) => {
                    const aP = Number(a.priority);
                    const bP = Number(b.priority);
                    const aHas = !isNaN(aP) && aP >= 1;
                    const bHas = !isNaN(bP) && bP >= 1;

                    if (aHas && bHas) return aP - bP;
                    if (aHas) return -1;
                    if (bHas) return 1;
                    return 0;
                  })
                  .map((p, idx) => {
                    const price =
                      p.listing_type === "rent"
                        ? formatPriceDisplay(p.price_per_month, "/mo")
                        : formatPriceDisplay(p.price);
                    const devName = p.developer_name ?? "—";
                    // FIX: normalize tags once per row instead of calling
                    // `p.tags ?? []` repeatedly, which crashes when p.tags
                    // is a raw JSON string instead of an array.
                    const rowTags = normalizeTags(p.tags);
                    return (
                      <div
                        key={p.id}
                        className={`row-hover grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_120px] gap-4 px-6 py-4 items-center transition-colors ${idx < properties.length - 1 ? "border-b border-slate-50" : ""}`}
                        style={{
                          animation: `fadeUp 0.3s ease ${idx * 0.04}s both`,
                        }}
                      >
                        <div className="flex items-start gap-3.5 overflow-hidden">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100">
                            {p.thumbnail ? (
                              <img
                                src={getFullImageUrl(p.thumbnail) || ""}
                                alt={p.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Home className="w-5 h-5 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            {p.priority && (
                              <span
                                className={`text-[10px] px-2 py-1 rounded-full font-bold inline-block whitespace-nowrap flex items-center gap-1 border ${getPriorityBadgeColor(p.priority)}`}
                              >
                                🚩 Priority #{p.priority}
                              </span>
                            )}

                            <p className="text-slate-800 text-sm font-bold line-clamp-1 mb-0.5">
                              {p.title}
                            </p>

                            <div className="flex flex-col-2 items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${p.listing_type === "rent" ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"}`}
                              >
                                {p.listing_type === "rent"
                                  ? "For Rent"
                                  : "For Sale"}
                              </span>

                              {rowTags
                                .filter(
                                  (t) => (t.active ?? true) && t.label?.trim(),
                                )
                                .map((t, i) => (
                                  <span
                                    key={i}
                                    className={`text-[10px] px-1 py-0.5 rounded-full font-bold border flex-shrink-0 ${getTagColorClasses(t.color)}`}
                                  >
                                    {t.label}
                                  </span>
                                ))}
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-slate-400 text-xs line-clamp-1">
                                {p.address}
                              </p>
                            </div>
                          </div>
                        </div>
                        <p className="text-slate-600 text-sm truncate">
                          {devName}
                        </p>
                        <div>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full border font-semibold capitalize ${typeColorMap[p.property_type] ?? "bg-slate-50 text-slate-500 border-slate-200"}`}
                          >
                            {typeLabel[p.property_type] ?? p.property_type}
                          </span>
                        </div>
                        <p className="text-slate-800 text-sm font-bold">
                          {price}
                        </p>

                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === "active" ? "bg-emerald-500" : p.status === "sold" ? "bg-blue-500" : p.status === "rented" ? "bg-purple-500" : "bg-slate-400"}`}
                          />
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full border font-semibold capitalize ${
                              p.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : p.status === "sold"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : p.status === "rented"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-slate-50 text-slate-500 border-slate-200"
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelected(p);
                              setModal("view");
                            }}
                            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelected(p);
                              setModal("edit");
                            }}
                            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Pagination */}
            {lastPage > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {(page - 1) * PER_PAGE + 1}–
                    {Math.min(page * PER_PAGE, total)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">{total}</span>
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: lastPage }, (_, i) => i + 1)
                    .filter((n) => Math.abs(n - page) <= 2)
                    .map((n) => (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`w-9 h-9 rounded-xl border text-sm font-bold transition-all shadow-sm ${n === page ? "bg-blue-600 border-blue-600 text-white shadow-blue-200" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                      >
                        {n}
                      </button>
                    ))}
                  <button
                    onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                    disabled={page === lastPage}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {(modal === "create" || modal === "edit") && (
        <PropertyFormModal
          mode={modal}
          initial={selected}
          onClose={() => {
            setModal(null);
            setSelected(null);
          }}
          onSaved={(msg) => {
            toast("success", msg);
            fetchProperties();
          }}
        />
      )}
      {modal === "view" && selected && (
        <ViewModal
          property={selected}
          onClose={() => {
            setModal(null);
            setSelected(null);
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Property?"
          description={`"${deleteTarget.title}" will be permanently deleted. This cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </>
  );
}
