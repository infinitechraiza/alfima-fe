"use client";

import { useEffect, useState, useRef } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Map as MapIcon,
  X,
  Upload,
  Home,
  Building2,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Square,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  ImageIcon,
  Tag as TagIcon,
  TriangleAlert,
  Video,
  Check,
  XCircle,
  Flag,
} from "lucide-react";
import { OTPDeleteModal } from "@/components/admin/OTPDeleteModal";

// ── Types ─────────────────────────────────────────────────────────────────────
interface PropertyAmenity {
  id: number;
  name: string;
}

interface PropertyFeatures {
  id: number;
  name: string;
}

interface PropertyImage {
  id: number;
  url: string;
  sort_order: number;
}

interface PropertyVideo {
  id: number;
  url: string;
  title?: string;
  created_at?: string;
}

interface PropertyTag {
  id?: number;
  label: string;
  color: string;
  active?: boolean;
}

interface PropertyUnitOffering {
  id: number | string;
  name: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: string | number | null;
  yearBuilt: string | number | null;
}

interface UnitOfferingPhoto {
  id: string | number;
  url: string;
  path?: string;
  category?: string | null;
}

interface NewUnitOfferingPhotoFile {
  tempId: string; // stable client-side id, used for removal
  file: File;
  category: string;
}

interface UnitOfferingFormItem {
  key: string; // stable client key
  serverId?: number; // filled in after save, from backend response
  bedrooms: string;
  bathrooms: string;
  areaMin: string;
  areaMax: string;
  yearBuilt: string;
  existingPhotos: UnitOfferingPhoto[];
  newPhotoFiles: NewUnitOfferingPhotoFile[];
}

interface Property {
  id: number;
  title: string;
  description: string;
  listing_type: "sale" | "rent";
  property_type: string;
  status: "active" | "sold" | "rented" | "inactive" | "pending" | "rejected";
  price: number | null;
  price_per_month: number | null;
  tags?: PropertyTag[];
  address: string;
  city: string;
  visibility_map: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: string | null;
  yearBuilt: string | number | null;
  thumbnail: string | null;
  priority: number | null;
  developer: string | null;
  images?: PropertyImage[];
  videos?: PropertyVideo[];
  unit_offerings?: PropertyUnitOffering[];

  unit_offer_images?: Record<
    UnitPhotoCategory,
    Array<{
      path: string;
      url: string;
    }>
  >;

  created_at: string;
  amenities?: Array<PropertyAmenity | string>;
  features?: Array<PropertyFeatures | string>;
  agent_id?: number | null;
}

interface PaginatedResponse {
  data: Property[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

type ModalMode = "create" | "edit" | "view" | null;
interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

const ACCEPT_ALL_IMAGES =
  "image/*,.avif,.heic,.heif,.jxl,.tiff,.tif,.bmp,.ico,.svg,.webp";

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB per image
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB for video
const MAX_TOTAL_UPLOAD_SIZE = 120 * 1024 * 1024; // 120MB total

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
];

const FEATURE_OPTIONS = [
  "Fully Furnished",
  "Semi-Furnished",
  "Unfurnished",
  "With Balcony",
  "With Terrace",
  "Corner Unit",
  "High Floor Unit",
  "With Storage Room",
  "With Maid's Room",
  "Pet Friendly",
  "Air Conditioned",
  "Smart Home System",
  "Open Kitchen",
  "Island Kitchen",
  "Walk-in Closet",
  "Separate Dining Area",
];

const DEVELOPER_OPTIONS = [
  "DMCI Homes",
  "Ayala Land",
  "Alveo Land",
  "Filinvest Land",
  "Robinsons Land",
  "Megaworld",
  "Federal Land",
  "Cebu Land",
  "SM Development",
  "Concepcion Industrial",
];

function emptyUnitOffering(): UnitOfferingFormItem {
  return {
    key: `new-${Date.now()}`,
    bedrooms: "",
    bathrooms: "",
    areaMin: "",
    areaMax: "",
    yearBuilt: "",
    existingPhotos: [],
    newPhotoFiles: [],
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
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
        `Image "${file.name}" is ${formatFileSize(file.size)} (max ${formatFileSize(MAX_IMAGE_SIZE)})`,
      );
    } else {
      valid.push(file);
    }
  });

  return { valid, errors };
}

function validateVideoFile(file: File): { valid: boolean; error: string } {
  if (file.size > MAX_VIDEO_SIZE) {
    return {
      valid: false,
      error: `Video file is ${formatFileSize(file.size)} but the maximum allowed size is ${formatFileSize(MAX_VIDEO_SIZE)}. Please compress your video first.`,
    };
  }
  return { valid: true, error: "" };
}

function validateTotalUploadSize(
  existingImages: Array<{ id: number; url: string }>,
  newFiles: File[],
  videoFile: File | null,
): { canUpload: boolean; message: string } {
  return { canUpload: true, message: "" };
}

function formatNumberInput(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-PH");
}

function stripCommas(val: string): string {
  return val.replace(/,/g, "");
}

function normalizeLabel(s?: string | null): string {
  if (typeof s !== "string") return "";
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function matchToOptions(
  apiNames: Array<string | undefined | null>,
  options: string[],
): string[] {
  const normalizedApiNames = apiNames
    .map(normalizeLabel)
    .filter((v) => v.length > 0);
  return options.filter((opt) =>
    normalizedApiNames.includes(normalizeLabel(opt)),
  );
}

function normalizeUnitOfferings(
  rawUnitOfferings: any[],
): PropertyUnitOffering[] {
  if (!Array.isArray(rawUnitOfferings)) return [];
  return rawUnitOfferings.map((u: any, idx: number) => ({
    id: u?.id ?? idx,
    name: u?.name ?? u?.type ?? u?.unit_type ?? `Unit ${idx + 1}`,
    bedrooms: u?.bedrooms ?? u?.beds ?? null,
    bathrooms: u?.bathrooms ?? u?.baths ?? null,
    area: u?.area ?? u?.floor_area ?? u?.size ?? null,
    yearBuilt: u?.year_built ?? u?.yearBuilt ?? null,
    price: u?.price ?? u?.price_from ?? u?.starting_price ?? null,
    status: u?.status ?? u?.availability ?? null,
    thumbnail: u?.thumbnail ?? u?.image ?? u?.floor_plan ?? "",
  }));
}

// Maps the API's unit_offerings payload into the create/edit form's shape.
// Only a single unit offering is supported by the form now, so we take the
// first entry (if any) and flatten its photos into one bucket.
//
// NOTE: this expects the backend to return `photos: [...]` (or a flat
// `images` array as a legacy fallback) on the unit offering.
function mapApiUnitOfferingToForm(
  rawUnitOfferings: any[] | undefined,
  unitOfferImages?: Property["unit_offer_images"],
): UnitOfferingFormItem {
  const u = Array.isArray(rawUnitOfferings) ? rawUnitOfferings[0] : undefined;

  const areaStr = u?.area != null ? String(u.area) : "";

  const match = areaStr.match(/^(\d+)\s*sqm?\s*[-–]\s*(\d+)\s*sqm?$/i);

  const existingPhotos: UnitOfferingPhoto[] = [];

  if (unitOfferImages) {
    Object.entries(unitOfferImages).forEach(([category, photos]) => {
      if (!Array.isArray(photos)) return;

      photos.forEach((img, index) => {
        if (!img?.url) return;

        existingPhotos.push({
          id: `${category}-${index}-${img.path}`,
          url: img.url,
          path: img.path,
          category,
        });
      });
    });
  }

  return {
    key: `existing-${u?.id ?? "property"}`,
    serverId: u?.id,

    bedrooms: u?.bedrooms != null ? String(u.bedrooms) : "",

    bathrooms: u?.bathrooms != null ? String(u.bathrooms) : "",

    areaMin: match ? match[1] : areaStr.replace(/[^0-9]/g, ""),

    areaMax: match ? match[2] : "",

    yearBuilt: u?.yearBuilt != null ? String(u.yearBuilt) : "",

    existingPhotos,

    newPhotoFiles: [],
  };
}

function getPriorityBadgeColor(priority: number | null | undefined): string {
  if (!priority) return "bg-slate-100 text-slate-600";
  if (priority === 1) return "bg-red-100 text-red-700 border-red-200";
  if (priority === 2) return "bg-orange-100 text-orange-700 border-orange-200";
  if (priority === 3) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-blue-100 text-blue-700 border-blue-200";
}

function getListingTypeBadgeClasses(
  listingType: Property["listing_type"],
): string {
  if (listingType === "rent") return "bg-blue-50 text-blue-600 border-blue-200";
  return "bg-red-50 text-red-600 border-red-200";
}

function getListingTypeLabel(listingType: Property["listing_type"]): string {
  if (listingType === "rent") return "For Rent";
  return "For Sale";
}

// Shared photo cap for the unit offering.
const MAX_UNIT_OFFERING_PHOTOS = 30;

// Unit photo categories — one upload slot per Unit Offering column
// (Bedrooms / Bathrooms / Area Min / Area Max). Each uploaded photo is
// tagged with the category it was added under so the backend can group
// them accordingly.
const UNIT_PHOTO_CATEGORIES = [
  { key: "bedrooms", label: "Bedrooms" },
  { key: "bathrooms", label: "Bathrooms" },
  { key: "areaMin", label: "Area Min" },
  { key: "areaMax", label: "Area Max" },
] as const;

type UnitPhotoCategory = "bedrooms" | "bathrooms" | "areaMin" | "areaMax";

function countUnitOfferingPhotos(offering: UnitOfferingFormItem): number {
  return offering.existingPhotos.length + offering.newPhotoFiles.length;
}

function buildUnitOfferingArea(min: string, max: string): string {
  if (min && max) return `${min}sqm - ${max}sqm`;
  if (min) return `${min}sqm`;
  return "";
}

// ── Tags ──────────────────────────────────────────────────────────────────

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

// ── Approval Dialog ───────────────────────────────────────────────────────

function ApprovalDialog({
  propertyTitle,
  onApprove,
  onReject,
  onCancel,
  loading,
}: {
  propertyTitle: string;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

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
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-slate-800 font-bold text-base">
                Review Agent Property
              </h3>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                &quot;{propertyTitle}&quot; was submitted by an agent. Approve
                or reject this listing.
              </p>
            </div>
          </div>

          {!showRejectInput ? (
            <div className="flex gap-3 justify-end pt-1">
              <button
                onClick={() => setShowRejectInput(true)}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={onApprove}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Approving..." : "Approve"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <textarea
                placeholder="Enter rejection reason (optional)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all resize-none h-24"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowRejectInput(false);
                    setRejectionReason("");
                  }}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onReject(rejectionReason)}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
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

// ── Tag Checkbox Group ────────────────────────────────────────────────────────

function TagCheckboxGroup({
  options,
  selected,
  onChange,
  accentColor = "red",
}: {
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
  accentColor?: "red" | "blue";
}) {
  const selectedNormalized = new Set(selected.map(normalizeLabel));

  const toggle = (opt: string) => {
    const key = normalizeLabel(opt);
    if (selectedNormalized.has(key)) {
      onChange(selected.filter((s) => normalizeLabel(s) !== key));
    } else {
      onChange([...selected, opt]);
    }
  };

  const on =
    accentColor === "blue"
      ? "bg-blue-600 border-blue-600 text-white"
      : "bg-red-600 border-red-600 text-white";
  const off =
    "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-400";

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = selectedNormalized.has(normalizeLabel(opt));
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isActive ? on : off}`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── Existing Tags Picker (chips of tags used elsewhere in the DB) ─────────────

function ExistingTagsPicker({
  availableTags,
  selectedLabels,
  onToggle,
  onDelete, // NEW
  loading,
}: {
  availableTags: PropertyTag[];
  selectedLabels: Set<string>;
  onToggle: (tag: PropertyTag) => void;
  onDelete: (tag: PropertyTag) => void; // NEW
  loading: boolean;
}) {
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

// ── Property Form Modal ───────────────────────────────────────────────────────

function PropertyFormModal({
  initial,
  mode,
  onClose,
  onSaved,
}: {
  initial?: Property | null;
  mode: "create" | "edit";
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Thumbnail
  const [thumbPreview, setThumbPreview] = useState<string | null>(
    initial?.thumbnail ?? null,
  );
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const thumbRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // New files to upload
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  // Existing saved gallery images (edit mode)
  const [existingImages, setExistingImages] = useState<
    { id: number; url: string }[]
  >(initial?.images?.map((img) => ({ id: img.id, url: img.url })) ?? []);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);

  // Video upload state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  // Existing videos (edit mode)
  const [existingVideos, setExistingVideos] = useState<PropertyVideo[]>(
    initial?.videos ?? [],
  );
  const [deletingVideoId, setDeletingVideoId] = useState<number | null>(null);

  const totalGalleryCount = existingImages.length + galleryFiles.length;

  // Price display (comma formatted)
  const [priceDisplay, setPriceDisplay] = useState(
    initial?.price ? Number(initial.price).toLocaleString("en-PH") : "",
  );
  const [rentDisplay, setRentDisplay] = useState(
    initial?.price_per_month
      ? Number(initial.price_per_month).toLocaleString("en-PH")
      : "",
  );
  // Tags (e.g. "3 Months Free" in violet, "Limited Slots" in red)
  const [tags, setTags] = useState<PropertyTag[]>(() =>
    initial?.tags
      ? initial.tags.map((t) => ({
          label: t.label ?? "",
          color: t.color ?? "red",
          active: t.active ?? true,
        }))
      : [],
  );

  const addTag = () =>
    setTags((prev) => [...prev, { label: "", color: "red", active: true }]);
  const updateTag = (i: number, patch: Partial<PropertyTag>) =>
    setTags((prev) =>
      prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)),
    );
  const removeTag = (i: number) =>
    setTags((prev) => prev.filter((_, idx) => idx !== i));

  // Existing tags pulled from the DB (shared across all properties)
  const [availableTags, setAvailableTags] = useState<PropertyTag[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  // ── Unit Offering (single) ─────────────────────────────────────────────
  const [unitOffering, setUnitOffering] = useState<UnitOfferingFormItem>(() =>
    mapApiUnitOfferingToForm(initial?.unit_offerings),
  );

  const [deletingUnitOfferingPhoto, setDeletingUnitOfferingPhoto] = useState<
    number | null
  >(null);

  const unitOfferingPhotoRef = useRef<HTMLInputElement>(null);
  // One file-input ref per unit-photo category (Bedrooms / Bathrooms /
  // Area Min / Area Max), keyed by category key.
  const unitOfferingPhotoRefs = useRef<Record<string, HTMLInputElement | null>>(
    {},
  );

  const updateUnitOffering = (patch: Partial<UnitOfferingFormItem>) => {
    setUnitOffering((prev) => ({ ...prev, ...patch }));
  };

  const addUnitOfferingPhotos = (
    files: File[],
    category: UnitPhotoCategory,
  ) => {
    setUnitOffering((prev) => {
      const currentTotal = countUnitOfferingPhotos(prev);
      const remaining = MAX_UNIT_OFFERING_PHOTOS - currentTotal;
      if (remaining <= 0) {
        setError(
          `You've reached the maximum of ${MAX_UNIT_OFFERING_PHOTOS} photos for this unit offering.`,
        );
        return prev;
      }

      const { valid, errors } = validateImageFiles(files);
      if (errors.length > 0) {
        setError(`⚠️ File size issues:\n${errors.join("\n")}`);
      }

      const toAdd: NewUnitOfferingPhotoFile[] = valid
        .slice(0, remaining)
        .map((file) => ({
          tempId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          category,
        }));

      return {
        ...prev,
        newPhotoFiles: [...prev.newPhotoFiles, ...toAdd],
      };
    });
  };

  const removeNewUnitOfferingPhoto = (tempId: string) => {
    setUnitOffering((prev) => ({
      ...prev,
      newPhotoFiles: prev.newPhotoFiles.filter((f) => f.tempId !== tempId),
    }));
  };

  const removeExistingUnitOfferingPhoto = async (
    photoId: string | number,
    category: string,
    path: string,
  ) => {
    if (!initial?.id) return;

    setDeletingUnitOfferingPhoto(photoId as number);

    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const laravelBase = process.env.NEXT_PUBLIC_API_URL;

      const res = await fetch(
        `${laravelBase}/api/properties/${initial.id}/unit-offer-images`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category,
            path,
          }),
        },
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));

        throw new Error(
          errorData.error ?? "Failed to delete unit offering photo",
        );
      }

      setUnitOffering((prev) => ({
        ...prev,
        existingPhotos: prev.existingPhotos.filter((p) => p.id !== photoId),
      }));
    } catch (err: any) {
      console.error("Delete unit offering photo error:", err);
      setError(
        err.message ||
          "Failed to delete unit offering photo. Please try again.",
      );
    } finally {
      setDeletingUnitOfferingPhoto(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoadingTags(true);

    // Pull distinct tags straight from the properties list endpoint
    // (the same one the table already uses) instead of a separate
    // /api/properties/tags route, so this works without any new API file.
    fetch("/api/admin/properties?per_page=1000")
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => {
        if (cancelled) return;
        const properties: Property[] = Array.isArray(json?.data)
          ? json.data
          : [];

        const seen = new Map<string, PropertyTag>();
        for (const p of properties) {
          for (const t of p.tags ?? []) {
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

  // Area range
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");

  useEffect(() => {
    if (initial?.area) {
      const match = String(initial.area).match(
        /^(\d+)\s*sqm?\s*[-–]\s*(\d+)\s*sqm?$/i,
      );
      if (match) {
        setAreaMin(match[1]);
        setAreaMax(match[2]);
      } else {
        setAreaMin(String(initial.area).replace(/[^0-9]/g, ""));
      }
    }
  }, []);

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [fetchingFull, setFetchingFull] = useState(mode === "edit");

  const [developerEnabled, setDeveloperEnabled] = useState(
    !!initial?.developer,
  );
  const [developerMode, setDeveloperMode] = useState<"predefined" | "custom">(
    initial?.developer &&
      DEVELOPER_OPTIONS.some(
        (opt) => normalizeLabel(opt) === normalizeLabel(initial.developer),
      )
      ? "predefined"
      : "custom",
  );

  const [form, setForm] = useState({
    title: initial?.title ?? "",
    listing_type: initial?.listing_type ?? "sale",
    property_type: initial?.property_type ?? "house",
    status: initial?.status ?? "active",
    address: initial?.address ?? "",
    city: initial?.city ?? "",
    visibility_map: initial?.visibility_map ?? "",
    bedrooms: String(initial?.bedrooms ?? ""),
    bathrooms: String(initial?.bathrooms ?? ""),
    description: initial?.description ?? "",
    priority: initial?.priority ?? (null as number | null),
    developer: initial?.developer ?? "",
  });

  useEffect(() => {
    if (mode !== "edit" || !initial?.id) return;

    const normalizeAmenities = (
      items?: Array<PropertyAmenity | string>,
    ): string[] => {
      const raw = (items ?? [])
        .map((item) => (typeof item === "string" ? item : (item?.name ?? "")))
        .filter(Boolean as any);
      return matchToOptions(raw, AMENITY_OPTIONS);
    };
    const normalizeFeatures = (
      items?: Array<PropertyFeatures | string>,
    ): string[] => {
      const raw = (items ?? [])
        .map((item) => (typeof item === "string" ? item : (item?.name ?? "")))
        .filter(Boolean as any);
      return matchToOptions(raw, FEATURE_OPTIONS);
    };

    setSelectedAmenities(normalizeAmenities(initial?.amenities));
    setSelectedFeatures(normalizeFeatures(initial?.features));

    setFetchingFull(true);
    (async () => {
      try {
        const res = await fetch(`/api/properties/${initial.id}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.error ?? `Failed to load property details (${res.status})`,
          );
        }

        const full: Property = await res.json();

        const rawAmenityNames = (full.amenities ?? [])
          .map((a) => {
            if (typeof a === "string") return a;
            return a?.name ?? "";
          })
          .filter(Boolean as any);

        const rawFeatureNames = (full.features ?? [])
          .map((f) => {
            if (typeof f === "string") return f;
            return f?.name ?? "";
          })
          .filter(Boolean as any);

        setSelectedAmenities(matchToOptions(rawAmenityNames, AMENITY_OPTIONS));
        setSelectedFeatures(matchToOptions(rawFeatureNames, FEATURE_OPTIONS));

        setForm((prev) => ({
          ...prev,
          description: full.description ?? "",
          priority: full.priority ?? null,
          visibility_map: full.visibility_map ?? "",
        }));
        setExistingImages(
          (full.images ?? []).map((img) => ({ id: img.id, url: img.url })),
        );
        setTags(
          full.tags && full.tags.length > 0
            ? full.tags.map((t) => ({
                label: t.label ?? "",
                color: t.color ?? "red",
                active: t.active ?? true,
              }))
            : [],
        );
        setUnitOffering(
          mapApiUnitOfferingToForm(full.unit_offerings, full.unit_offer_images),
        );

        try {
          const videosRes = await fetch(`/api/properties/${initial.id}/videos`);
          if (videosRes.ok) {
            const videosData = await videosRes.json();
            setExistingVideos(
              Array.isArray(videosData) ? videosData : (videosData.data ?? []),
            );
          }
        } catch (videoErr) {
          console.error("Videos fetch error:", videoErr);
        }
      } catch (err) {
        console.error("Property fetch error:", err);
        setError("Failed to load property details.");
      } finally {
        setFetchingFull(false);
      }
    })();
  }, [mode, initial?.id, initial?.amenities, initial?.features]);

  const setF = (k: string, v: string | number | null) =>
    setForm((p) => ({ ...p, [k]: v }));
  const buildArea = () => {
    if (areaMin && areaMax) return `${areaMin}sqm - ${areaMax}sqm`;
    if (areaMin) return `${areaMin}sqm`;
    return "";
  };

  const handleDeleteExistingImage = async (imageId: number) => {
    if (!initial?.id) return;
    setDeletingImageId(imageId);
    try {
      const res = await fetch(
        `/api/properties/${initial.id}/images/${imageId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      setError("Failed to delete image. Please try again.");
    } finally {
      setDeletingImageId(null);
    }
  };

  const deleteTagEverywhere = async (tag: PropertyTag) => {
    if (!confirm(`Delete "${tag.label}" from all properties?`)) return;
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
        `${laravelBase}/api/admin/tags?label=${encodeURIComponent(tag.label)}`,
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

  const handleDeleteExistingVideo = async (videoId: number) => {
    if (!initial?.id) return;
    setDeletingVideoId(videoId);
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
        `${laravelBase}/api/properties/${initial.id}/videos/${videoId}`,
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
        throw new Error(errData.error ?? errData.message ?? "Delete failed");
      }

      setExistingVideos((prev) => prev.filter((vid) => vid.id !== videoId));
    } catch (err: any) {
      setError(err.message || "Failed to delete video. Please try again.");
    } finally {
      setDeletingVideoId(null);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.address.trim() || !form.city.trim()) {
      setError("Title, address and city are required.");
      return;
    }

    if (form.listing_type === "sale" && !priceDisplay) {
      setError("Sale price is required.");
      return;
    }
    // if (form.listing_type === "rent" && !rentDisplay) {
    //   setError("Monthly rent is required.");
    //   return;
    // }

    // Validate total upload size before submitting
    const sizeCheck = validateTotalUploadSize(
      existingImages,
      galleryFiles,
      videoFile,
    );
    if (!sizeCheck.canUpload) {
      setError(sizeCheck.message);
      return;
    }

    // ── CHANGED: raised from 3 to 10, matching developers page ──
    if (galleryFiles.length > 15) {
      setError(
        `You can upload a maximum of 15 images per upload. You've selected ${galleryFiles.length} images.`,
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const metadataPayload: any = {};

      (
        [
          "title",
          "listing_type",
          "property_type",
          "status",
          "address",
          "city",
          "visibility_map",
          "bedrooms",
          "bathrooms",
          "description",
        ] as const
      ).forEach((k) => {
        if (form[k] !== "") metadataPayload[k] = form[k];
      });

      // Only send priority if it has a valid value (>= 1)
      const priority = Number(form.priority);

      if (!isNaN(priority) && priority >= 1) {
        metadataPayload.priority = priority;
      } else {
        metadataPayload.priority = null;
      }
      // If priority is null/empty, don't send it at all - backend won't validate it

      if (form.listing_type === "sale") {
        metadataPayload.price = stripCommas(priceDisplay);
        metadataPayload.price_per_month = null;
      } else {
        metadataPayload.price_per_month = stripCommas(rentDisplay);
        metadataPayload.price = null;
      }

      const isValidGoogleMapsUrl = (url: string) => {
        const regex =
          /^(https:\/\/(www\.google\.com\/maps(\/embed)?|maps\.app\.goo\.gl)\/.+)$/;

        return regex.test(url);
      };

      if (form.visibility_map === "") {
        metadataPayload.visibility_map = null;
      } else if (isValidGoogleMapsUrl(form.visibility_map)) {
        metadataPayload.visibility_map = form.visibility_map;
      } else {
        throw new Error("Invalid Google Maps URL");
      }

      const cleanTags = tags
        .filter((t) => t.label.trim().length > 0)
        .map((t) => ({
          label: t.label.trim(),
          color: t.color,
          active: t.active ?? true,
        }));
      if (cleanTags.length > 0) {
        metadataPayload.tags = cleanTags;
      }

      const area = buildArea();
      if (area) metadataPayload.area = area;

      if (developerEnabled && form.developer.trim()) {
        metadataPayload.developer = form.developer;
      }

      if (selectedAmenities.length > 0) {
        metadataPayload.amenities = selectedAmenities;
      }
      if (selectedFeatures.length > 0) {
        metadataPayload.features = selectedFeatures;
      }
      // ── Unit offering: send as a single-item array in the metadata payload ──
      // NOTE: the bedrooms/bathrooms/area/year-built fields were removed from
      // the UI, so this now only tracks whether there are photos to attach
      // (existing or new). We still send serverId (if editing) so the
      // backend can locate/reuse the same unit-offering record to hang the
      // photo uploads off of.
      const hasUnitOffering =
        unitOffering.newPhotoFiles.length > 0 ||
        unitOffering.existingPhotos.length > 0;

      const unitOfferingsPayload = hasUnitOffering
        ? [
            {
              ...(unitOffering.serverId ? { id: unitOffering.serverId } : {}),
            },
          ]
        : [];

      if (unitOfferingsPayload.length > 0) {
        metadataPayload.unit_offerings = unitOfferingsPayload;
      }

      const metadataUrl =
        mode === "create"
          ? "/api/properties/metadata"
          : `/api/properties/metadata?id=${initial!.id}`;

      const metadataRes = await fetch(metadataUrl, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadataPayload),
      });

      if (!metadataRes.ok) {
        const errorData = await metadataRes
          .json()
          .catch(() => ({ error: "Failed to save metadata" }));
        throw new Error(errorData.error || "Failed to save property metadata");
      }

      const metadataData = await metadataRes.json();
      const propertyId = metadataData.id || initial!.id;
      // Map the returned unit offering (with its id) back onto our form
      // state, so a newly-created offering gets a serverId to attach
      // photos to.
      const returnedOfferingId = metadataData.unit_offerings?.[0]?.id;
      const unitOfferingServerId = hasUnitOffering
        ? (unitOffering.serverId ?? returnedOfferingId)
        : undefined;

      // Upload the unit offering's new photos.
      if (unitOffering.newPhotoFiles.length > 0) {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();
        const laravelBase = process.env.NEXT_PUBLIC_API_URL;
        const unitOfferImageUrl = `${laravelBase}/api/properties/${propertyId}/unit-offer-images`;

        // Group files by category so each category gets its own request.
        const filesByCategory = unitOffering.newPhotoFiles.reduce(
          (acc, f) => {
            (acc[f.category] ??= []).push(f);
            return acc;
          },
          {} as Record<string, NewUnitOfferingPhotoFile[]>,
        );

        for (const [category, files] of Object.entries(filesByCategory)) {
          const BATCH_SIZE = 5;
          for (let i = 0; i < files.length; i += BATCH_SIZE) {
            const batch = files.slice(i, i + BATCH_SIZE);
            const fd = new FormData();
            fd.append("category", category);
            batch.forEach((f) => fd.append("images[]", f.file));

            await new Promise<void>((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.addEventListener("load", () =>
                xhr.status >= 200 && xhr.status < 300
                  ? resolve()
                  : reject(
                      new Error(
                        `Unit offer photo upload failed for ${category} (${xhr.status})`,
                      ),
                    ),
              );
              xhr.addEventListener("error", () =>
                reject(
                  new Error("Network error during unit offer photo upload"),
                ),
              );
              xhr.open("POST", unitOfferImageUrl);
              if (token)
                xhr.setRequestHeader("Authorization", `Bearer ${token}`);
              xhr.send(fd);
            });
          }
        }
      }

      // Upload images in batches of 5 (matching developers page behaviour)
      if (galleryFiles.length > 0 || thumbFile) {
        const tokenRes = await fetch("/api/auth/token");
        const tokenData = await tokenRes.json();
        const token = tokenData.token;
        const laravelBase = process.env.NEXT_PUBLIC_API_URL;
        const imageUrl = `${laravelBase}/api/properties/${propertyId}/images`;

        // Upload thumbnail first if present
        if (thumbFile) {
          const thumbFd = new FormData();
          thumbFd.append("thumbnail", thumbFile);
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.addEventListener("load", () =>
              xhr.status >= 200 && xhr.status < 300
                ? resolve()
                : reject(new Error(`Thumbnail upload failed (${xhr.status})`)),
            );
            xhr.addEventListener("error", () =>
              reject(new Error("Network error during thumbnail upload")),
            );
            xhr.open("POST", imageUrl);
            if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            xhr.send(thumbFd);
          });
        }

        // Upload gallery images in batches of 5
        const BATCH_SIZE = 5;
        const totalBatches = Math.ceil(galleryFiles.length / BATCH_SIZE);

        for (let i = 0; i < galleryFiles.length; i += BATCH_SIZE) {
          const batch = galleryFiles.slice(i, i + BATCH_SIZE);
          const imageFd = new FormData();
          batch.forEach((f) => imageFd.append("images[]", f));

          const batchNum = Math.floor(i / BATCH_SIZE) + 1;

          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener("progress", (event) => {
              if (event.lengthComputable) {
                const batchProgress = (event.loaded / event.total) * 100;
                const overallProgress = Math.round(
                  ((batchNum - 1 + batchProgress / 100) / totalBatches) * 100,
                );
                setUploadProgress(overallProgress);
              }
            });

            xhr.addEventListener("load", () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
              } else if (xhr.status === 413) {
                reject(new Error("413: Upload too large"));
              } else if (xhr.status === 408 || xhr.status === 504) {
                reject(new Error(`${xhr.status}: Upload timeout`));
              } else {
                reject(new Error(`Server error (${xhr.status})`));
              }
            });

            xhr.addEventListener("error", () => {
              reject(new Error("Network error during upload"));
            });

            xhr.open("POST", imageUrl);
            if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            xhr.send(imageFd);
          });
        }
      }

      if (videoFile) {
        const videoFd = new FormData();
        videoFd.append("video", videoFile);
        videoFd.append("title", form.title || "Property Video");

        const tokenRes = await fetch("/api/auth/token");
        const tokenData = await tokenRes.json();
        const token = tokenData.token;

        const laravelBase = process.env.NEXT_PUBLIC_API_URL;

        try {
          const videoUrl = `${laravelBase}/api/properties/${propertyId}/videos`;

          const uploadPromise = new Promise<any>((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener("progress", (event) => {
              if (event.lengthComputable) {
                const percentComplete = Math.round(
                  (event.loaded / event.total) * 100,
                );
                setUploadProgress(percentComplete);
              }
            });

            xhr.addEventListener("load", () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const response = JSON.parse(xhr.responseText);
                  resolve(response);
                } catch {
                  resolve(xhr.responseText);
                }
              } else {
                try {
                  const errorData = JSON.parse(xhr.responseText);
                  reject(
                    new Error(
                      errorData.error ||
                        `Upload failed with status ${xhr.status}`,
                    ),
                  );
                } catch {
                  reject(new Error(`Upload failed with status ${xhr.status}`));
                }
              }
            });

            xhr.addEventListener("error", () => {
              reject(new Error("Network error during video upload"));
            });

            xhr.open("POST", videoUrl);
            if (token) {
              xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            }
            xhr.send(videoFd);
          });

          await uploadPromise;

          setUploadProgress(0);
        } catch (err: any) {
          setError(
            `Property saved, but video upload failed: ${err.message || "Unknown error"}`,
          );
          setLoading(false);
          setUploadProgress(0);
          return;
        }

        setVideoFile(null);
        setVideoPreview(null);
        if (videoRef.current) videoRef.current.value = "";
      }

      setUploadProgress(0);
      onSaved(mode === "create" ? "Property created!" : "Property updated!");
      onClose();
    } catch (err: any) {
      if (err.message?.includes("413")) {
        setError(
          `❌ Image upload too large. Try these solutions:\n\n1. Compress your images\n2. Reduce number of images per upload (max 5)\n3. Use JPG instead of PNG`,
        );
      } else {
        setError(err.message || "Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inp =
    "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all";
  const sel = `${inp} appearance-none cursor-pointer`;
  const lbl =
    "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2";
  const propertyTypes = [
    "house",
    "condo",
    "townhouse",
    "lot",
    "commercial",
    "warehouse",
  ];
  const isSale = form.listing_type === "sale";
  const pricePreview = isSale
    ? priceDisplay
      ? `₱${priceDisplay}`
      : ""
    : rentDisplay
      ? `₱${rentDisplay}/mo`
      : "";

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
                {mode === "create" ? "Add New Property" : "Edit Property"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {mode === "create"
                  ? "Fill in the details to list a new property."
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
          <div className="flex-1 overflow-y-auto relative">
            {fetchingFull && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                <span className="text-sm text-slate-500 font-medium">
                  Loading details...
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 min-h-full">
              {/* ── Left column ── */}
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

                  {/* Toggle on any tag already used on another property */}
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
                          className="w-4 h-4 rounded accent-red-600 flex-shrink-0"
                        />
                        <input
                          type="text"
                          value={tag.label}
                          onChange={(e) =>
                            updateTag(i, { label: e.target.value })
                          }
                          placeholder="e.g. 3 Months Free"
                          className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-400"
                        />
                        <select
                          value={tag.color}
                          onChange={(e) =>
                            updateTag(i, { color: e.target.value })
                          }
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-red-400 appearance-none cursor-pointer flex-shrink-0"
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
                  {isSale ? (
                    <>
                      <label className={lbl}>Selling Price ₱ *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold select-none">
                          ₱
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          className={`${inp} pl-7`}
                          value={priceDisplay}
                          onChange={(e) =>
                            setPriceDisplay(formatNumberInput(e.target.value))
                          }
                          placeholder="4,500,000"
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        One-time selling price
                      </p>
                    </>
                  ) : (
                    <>
                      <label className={lbl}>Monthly Rent ₱ *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold select-none">
                          ₱
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          className={`${inp} pl-7`}
                          value={rentDisplay}
                          onChange={(e) =>
                            setRentDisplay(formatNumberInput(e.target.value))
                          }
                          placeholder="25,000"
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Price per month
                      </p>
                    </>
                  )}
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
                    1-999: Lower numbers = higher priority. Leave empty for no
                    priority.
                  </p>
                </div>

                {/* Developer Toggle Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className={lbl}>Developer (Optional)</label>
                    <button
                      type="button"
                      onClick={() => {
                        setDeveloperEnabled(!developerEnabled);
                        if (!developerEnabled) {
                          setDeveloperMode("predefined");
                        } else {
                          setF("developer", "");
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        developerEnabled
                          ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                          : "bg-slate-100 border-slate-300 text-slate-600 hover:border-slate-400"
                      }`}
                    >
                      {developerEnabled ? "✓ Enabled" : "Disabled"}
                    </button>
                  </div>

                  {developerEnabled && (
                    <>
                      <div className="flex gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setDeveloperMode("predefined")}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all border ${
                            developerMode === "predefined"
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-400"
                          }`}
                        >
                          Select from List
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeveloperMode("custom")}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all border ${
                            developerMode === "custom"
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-400"
                          }`}
                        >
                          Enter Custom
                        </button>
                      </div>

                      {developerMode === "predefined" && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                            {DEVELOPER_OPTIONS.map((dev) => (
                              <button
                                key={dev}
                                type="button"
                                onClick={() => setF("developer", dev)}
                                className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium border transition-all text-left ${
                                  normalizeLabel(form.developer) ===
                                  normalizeLabel(dev)
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-400"
                                }`}
                              >
                                {dev}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-slate-400 mt-2">
                            Select a developer from the list above
                          </p>
                        </div>
                      )}

                      {developerMode === "custom" && (
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            className={`${inp} pl-9`}
                            value={form.developer}
                            onChange={(e) => setF("developer", e.target.value)}
                            placeholder="Enter developer name"
                          />
                          <p className="text-xs text-slate-400 mt-1">
                            Enter a custom developer name
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Thumbnail */}
                <div>
                  <label className={lbl}>Thumbnail</label>
                  <div
                    onClick={() => thumbRef.current?.click()}
                    className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 hover:border-red-400 cursor-pointer transition-colors group bg-white"
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
                        <ImageIcon className="w-7 h-7 text-slate-300 group-hover:text-red-400 transition-colors" />
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
                      setThumbFile(file);
                      setThumbPreview(URL.createObjectURL(file));
                    }}
                  />
                </div>

                {/* Gallery */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`${lbl} mb-0`}>
                      Gallery ({totalGalleryCount}/15)
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

                  {/* Existing saved images */}
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
                          <div className="absolute top-1 left-1 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-tight">
                            SAVED
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteExistingImage(img.id)}
                            disabled={deletingImageId === img.id}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-60"
                          >
                            {deletingImageId === img.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── CHANGED: updated upload tips to match developers page ── */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-800">
                        <p className="font-semibold mb-1">Upload Tips:</p>
                        <ul className="space-y-0.5 text-amber-700">
                          <li>
                            • Max {formatFileSize(MAX_IMAGE_SIZE)} per image
                          </li>
                          <li>• Up to 15 images total per property</li>
                          <li>
                            • Max {formatFileSize(MAX_VIDEO_SIZE)} per video
                          </li>
                          <li>• Compress large images before uploading</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Upload area — only show if under limit */}
                  {totalGalleryCount < 15 && (
                    <div
                      onClick={() => galleryRef.current?.click()}
                      className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-red-400 cursor-pointer transition-colors bg-white text-center group"
                    >
                      <Upload className="w-5 h-5 text-slate-300 group-hover:text-red-400 mx-auto mb-1 transition-colors" />
                      <p className="text-xs text-slate-400 font-medium">
                        {totalGalleryCount === 0
                          ? "Add gallery images"
                          : "Add more images"}
                      </p>
                      <p className="text-[10px] text-slate-300">
                        All formats supported
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

                      if (errors.length > 0) {
                        setError(
                          `⚠️ File size issues:\n${errors.join("\n")}\n\nKeep images under ${formatFileSize(MAX_IMAGE_SIZE)} each.`,
                        );
                      }

                      const remaining = 15 - existingImages.length;
                      setGalleryFiles((prev) =>
                        [...prev, ...valid].slice(0, remaining),
                      );
                      e.target.value = "";
                    }}
                  />

                  {/* New file previews */}
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
                            <div className="absolute top-1 left-1 bg-blue-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-tight">
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

                {/* Status (edit only) */}
                {mode === "edit" && (
                  <div>
                    <label className={lbl}>Status</label>
                    <select
                      className={sel}
                      value={form.status}
                      onChange={(e) => setF("status", e.target.value)}
                    >
                      {["active", "sold", "rented", "inactive"].map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Video Upload */}
                <div>
                  <label className={lbl}>
                    Property Video{" "}
                    <span className="text-slate-400 text-xs font-normal">
                      (Optional)
                    </span>
                  </label>
                  {videoPreview ? (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-slate-300 bg-black group">
                      <video
                        src={videoPreview}
                        controls
                        className="w-full h-full"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setVideoFile(null);
                          setVideoPreview(null);
                          if (videoRef.current) videoRef.current.value = "";
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => videoRef.current?.click()}
                      className="w-full p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 cursor-pointer transition-colors bg-white text-center group"
                    >
                      <Video className="w-6 h-6 text-slate-300 group-hover:text-blue-400 mx-auto mb-2 transition-colors" />
                      <p className="text-xs text-slate-400 font-medium">
                        Click to upload video
                      </p>
                      <p className="text-[10px] text-slate-300">
                        MP4, MOV, or WebM up to {formatFileSize(MAX_VIDEO_SIZE)}
                      </p>
                    </div>
                  )}
                  <input
                    ref={videoRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const validation = validateVideoFile(file);
                      if (!validation.valid) {
                        setError(validation.error);
                        if (videoRef.current) videoRef.current.value = "";
                        return;
                      }

                      setError(null);
                      setVideoFile(file);
                      setVideoPreview(URL.createObjectURL(file));
                    }}
                  />
                  {videoFile && (
                    <p className="text-xs text-blue-600 font-medium mt-2">
                      Video will be uploaded when you save the property
                    </p>
                  )}

                  {/* Existing videos (edit mode only) */}
                  {mode === "edit" && existingVideos.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <label className={`${lbl} mb-3`}>
                        Saved Videos ({existingVideos.length})
                      </label>
                      <div className="space-y-3">
                        {existingVideos.map((video) => (
                          <div
                            key={video.id}
                            className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden"
                          >
                            <div className="bg-black aspect-video flex items-center justify-center overflow-hidden">
                              <video
                                src={video.url}
                                controls
                                className="w-full h-full object-contain"
                              />
                            </div>

                            <div className="p-3 flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-700 truncate">
                                  {video.title || "Property Video"}
                                </p>
                                {video.created_at && (
                                  <p className="text-[10px] text-slate-500 mt-0.5">
                                    {new Date(
                                      video.created_at,
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteExistingVideo(video.id)
                                }
                                disabled={deletingVideoId === video.id}
                                className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60 flex-shrink-0"
                              >
                                {deletingVideoId === video.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Right column ── */}
              <div className="col-span-2 p-6 space-y-5">
                {/* Title */}
                <div>
                  <label className={lbl}>Property Title *</label>
                  <input
                    className={inp}
                    value={form.title}
                    onChange={(e) => setF("title", e.target.value)}
                    placeholder="e.g. Modern 3BR Condo in BGC"
                  />
                </div>

                {/* Property Type */}
                <div>
                  <label className={lbl}>Property Type *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {propertyTypes.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setF("property_type", t)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-medium capitalize transition-all border ${
                          form.property_type === t
                            ? "bg-slate-800 border-slate-800 text-white"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-400"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Address + City */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Address *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        className={`${inp} pl-9`}
                        value={form.address}
                        onChange={(e) => setF("address", e.target.value)}
                        placeholder="123 Rizal St."
                      />
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>City *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        className={`${inp} pl-9`}
                        value={form.city}
                        onChange={(e) => setF("city", e.target.value)}
                        placeholder="Makati"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={lbl}>Visibility Map *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      className={`${inp} pl-9`}
                      value={form.visibility_map}
                      onChange={(e) => setF("visibility_map", e.target.value)}
                      placeholder="Google Maps URL, e.g. https://www.google.com/maps/embed?pb=..."
                    />
                  </div>
                </div>

                {/* Beds / Baths / Area */}
                <div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className={lbl}>Bedrooms</label>
                      <div className="relative">
                        <Bed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="number"
                          className={`${inp} pl-9`}
                          value={form.bedrooms}
                          onChange={(e) => setF("bedrooms", e.target.value)}
                          placeholder="0"
                          min={0}
                        />
                      </div>
                    </div>
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
                      <label className={lbl}>Area Min (sqm)</label>
                      <div className="relative">
                        <Square className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="number"
                          className={`${inp} pl-9`}
                          value={areaMin}
                          onChange={(e) => setAreaMin(e.target.value)}
                          placeholder="23"
                          min={0}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Area Max (sqm)</label>
                      <input
                        type="number"
                        className={inp}
                        value={areaMax}
                        onChange={(e) => setAreaMax(e.target.value)}
                        placeholder="55 (opt.)"
                        min={0}
                      />
                    </div>
                  </div>
                  {(areaMin || areaMax) && (
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                      Saves as:&nbsp;
                      <span className="font-semibold text-slate-700">
                        {buildArea()}
                      </span>
                    </p>
                  )}
                </div>

                {/* Unit Offering Photos */}
                <div>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <label className={`${lbl} mb-0`}>
                      Unit Photos (Optional)
                    </label>

                    <span
                      className={`text-[10px] font-bold ${
                        countUnitOfferingPhotos(unitOffering) >=
                        MAX_UNIT_OFFERING_PHOTOS
                          ? "text-red-500"
                          : "text-slate-400"
                      }`}
                    >
                      {countUnitOfferingPhotos(unitOffering)}/
                      {MAX_UNIT_OFFERING_PHOTOS}
                    </span>
                  </div>

                  {/* 4 Category Columns */}
                  <div className="grid grid-cols-4 gap-2 items-start">
                    {UNIT_PHOTO_CATEGORIES.map(({ key, label }) => {
                      // Photos belonging to this category
                      const existingCategoryPhotos =
                        unitOffering.existingPhotos.filter(
                          (photo) => photo.category === key,
                        );

                      const newCategoryPhotos =
                        unitOffering.newPhotoFiles.filter(
                          (photo) => photo.category === key,
                        );

                      return (
                        <div key={key} className="min-w-0">
                          {/* Upload Button */}
                          <div
                            onClick={() => {
                              if (
                                countUnitOfferingPhotos(unitOffering) <
                                MAX_UNIT_OFFERING_PHOTOS
                              ) {
                                unitOfferingPhotoRefs.current[key]?.click();
                              }
                            }}
                            className={`
                w-full
                py-4
                rounded-xl
                border-2
                border-dashed
                border-slate-300
                hover:border-red-400
                cursor-pointer
                transition-colors
                bg-slate-50
                text-center
                group
                ${
                  countUnitOfferingPhotos(unitOffering) >=
                  MAX_UNIT_OFFERING_PHOTOS
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }
              `}
                          >
                            <Upload
                              className="
                  w-5 h-5
                  text-slate-300
                  group-hover:text-red-400
                  mx-auto
                  transition-colors
                "
                            />

                            <p className="text-xs text-slate-500 font-semibold mt-1">
                              {label}
                            </p>

                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Click to upload
                            </p>
                          </div>

                          {/* Hidden Input */}
                          <input
                            ref={(el) => {
                              unitOfferingPhotoRefs.current[key] = el;
                            }}
                            type="file"
                            accept={ACCEPT_ALL_IMAGES}
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files ?? []);

                              if (files.length > 0) {
                                addUnitOfferingPhotos(files, key);
                              }

                              e.target.value = "";
                            }}
                          />

                          {/* Photos for THIS category only */}
                          <div className="mt-2 space-y-1.5">
                            {/* Existing saved photos */}
                            {existingCategoryPhotos.map((photo) => (
                              <div
                                key={String(photo.id)}
                                className="
      relative
      group
      aspect-square
      rounded-lg
      overflow-hidden
      border
      border-emerald-200
      bg-slate-100
    "
                              >
                                <img
                                  src={photo.url}
                                  alt={`${label} unit photo`}
                                  className="w-full h-full object-cover"
                                />

                                <span className="absolute top-1 left-1 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                                  SAVED
                                </span>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (photo.path) {
                                      removeExistingUnitOfferingPhoto(
                                        photo.id,
                                        key,
                                        photo.path,
                                      );
                                    }
                                  }}
                                  className="
        absolute
        top-1
        right-1
        w-5
        h-5
        rounded-full
        bg-black/60
        text-white
        flex
        items-center
        justify-center
      "
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}

                            {/* Newly selected photos */}
                            {newCategoryPhotos.map((f) => {
                              const url = URL.createObjectURL(f.file);

                              return (
                                <div
                                  key={f.tempId}
                                  className="
        relative
        group
        aspect-square
        rounded-lg
        overflow-hidden
        border
        border-blue-200
        bg-slate-100
      "
                                >
                                  <img
                                    src={url}
                                    alt={f.file.name}
                                    className="w-full h-full object-cover"
                                    onLoad={() => URL.revokeObjectURL(url)}
                                  />

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeNewUnitOfferingPhoto(f.tempId)
                                    }
                                    className="
          absolute
          top-1
          right-1
          w-5
          h-5
          rounded-full
          bg-black/60
          text-white
          flex
          items-center
          justify-center
        "
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className={lbl}>Description</label>
                  <textarea
                    className={`${inp} resize-none`}
                    rows={3}
                    value={form.description}
                    onChange={(e) => setF("description", e.target.value)}
                    placeholder="Describe the property..."
                  />
                </div>

                {/* Amenities */}
                <div>
                  <label className={lbl}>
                    Amenities
                    {selectedAmenities.length > 0 && (
                      <span className="ml-2 text-red-500 normal-case font-normal tracking-normal text-xs">
                        {selectedAmenities.length} selected
                      </span>
                    )}
                  </label>
                  <TagCheckboxGroup
                    options={AMENITY_OPTIONS}
                    selected={selectedAmenities}
                    onChange={setSelectedAmenities}
                    accentColor="red"
                  />
                  {selectedAmenities.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedAmenities([])}
                      className="mt-2 text-[11px] text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Clear selection
                    </button>
                  )}
                </div>

                {/* Features */}
                <div>
                  <label className={lbl}>
                    Features
                    {selectedFeatures.length > 0 && (
                      <span className="ml-2 text-blue-500 normal-case font-normal tracking-normal text-xs">
                        {selectedFeatures.length} selected
                      </span>
                    )}
                  </label>
                  <TagCheckboxGroup
                    options={FEATURE_OPTIONS}
                    selected={selectedFeatures}
                    onChange={setSelectedFeatures}
                    accentColor="blue"
                  />
                  {selectedFeatures.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedFeatures([])}
                      className="mt-2 text-[11px] text-slate-400 hover:text-blue-500 transition-colors"
                    >
                      Clear selection
                    </button>
                  )}
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
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className={`w-2.5 h-2.5 rounded-full ${isSale ? "bg-red-500" : "bg-blue-500"}`}
              />
              <span className="text-xs font-semibold text-slate-500">
                {isSale ? "For Sale" : "For Rent"}
                {pricePreview && ` — ${pricePreview}`}
                {buildArea() && ` · ${buildArea()}`}
                {form.priority && ` · Priority #${form.priority}`}
                {tags.filter((t) => t.active && t.label.trim()).length > 0 &&
                  ` · ${tags.filter((t) => t.active && t.label.trim()).length} tag(s)`}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-blue-700">
                        Uploading{" "}
                        {galleryFiles.length > 0 && videoFile
                          ? "Images & Video"
                          : videoFile
                            ? "Video"
                            : "Images"}
                      </span>
                      <span className="text-xs font-bold text-blue-600">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
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
                      ? "+ Create Property"
                      : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── View Modal ────────────────────────────────────────────────────────────────

function ViewModal({
  property: initialProperty,
  onClose,
}: {
  property: Property;
  onClose: () => void;
}) {
  type ViewTab = "details" | "photos" | "videos" | "units";
  const [activeTab, setActiveTab] = useState<ViewTab>("details");

  // local copy of the property that we can enrich with full details
  const [property, setProperty] = useState<Property>(initialProperty);
  const [loadingFull, setLoadingFull] = useState(true);

  // fetch full property details (includes unit_offerings, amenities, etc.)
  useEffect(() => {
    let cancelled = false;
    setLoadingFull(true);

    fetch(`/api/properties/${initialProperty.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((full: any) => {
        if (cancelled || !full) return;

        // ── TEMP DEBUG: log the raw response so we can see the real
        // shape/field-name of unit offerings coming back from the API.
        // Remove this once we confirm the correct field name. ──
        console.log("[ViewModal] /api/properties/:id response:", full);
        console.log(
          "[ViewModal] unit_offerings on response:",
          full?.unit_offerings,
        );
        console.log("[ViewModal] all response keys:", Object.keys(full));

        setProperty((prev) => ({ ...prev, ...full }));
      })
      .catch((err) => console.error("Failed to load full property:", err))
      .finally(() => !cancelled && setLoadingFull(false));

    // Videos come from a separate endpoint, same as the edit form
    fetch(`/api/properties/${initialProperty.id}/videos`)
      .then((res) => (res.ok ? res.json() : null))
      .then((videosData) => {
        if (cancelled || !videosData) return;
        const videos = Array.isArray(videosData)
          ? videosData
          : (videosData.data ?? []);
        setProperty((prev) => ({ ...prev, videos }));
      })
      .catch((err) => console.error("Videos fetch error:", err));

    return () => {
      cancelled = true;
    };
  }, [initialProperty.id]);

  const price =
    property.listing_type === "rent"
      ? property.price_per_month
        ? `₱${Number(property.price_per_month).toLocaleString("en-PH")}/mo`
        : "—"
      : property.price
        ? `₱${Number(property.price).toLocaleString("en-PH")}`
        : "—";

  const statusStyles: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    sold: "bg-blue-100 text-blue-700 border-blue-200",
    rented: "bg-purple-100 text-purple-700 border-purple-200",
    inactive: "bg-slate-100 text-slate-500 border-slate-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  };

  const images = property.images ?? [];
  const videos = property.videos ?? [];
  const units = property.unit_offerings?.length
    ? normalizeUnitOfferings(property.unit_offerings)
    : property.bedrooms ||
        property.bathrooms ||
        property.area ||
        property.yearBuilt
      ? normalizeUnitOfferings([
          {
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            area: property.area,
            year_built: property.yearBuilt,
          },
        ])
      : [];
  const amenities = (property.amenities ?? [])
    .map((a) => (typeof a === "string" ? a : a?.name))
    .filter(Boolean) as string[];
  const features = (property.features ?? [])
    .map((f) => (typeof f === "string" ? f : f?.name))
    .filter(Boolean) as string[];

  const tabs: { id: ViewTab; label: string; count?: number }[] = [
    { id: "details", label: "Details" },
    { id: "photos", label: "Photos", count: images.length },
    { id: "videos", label: "Videos", count: videos.length },
    { id: "units", label: "Unit Offerings", count: units.length },
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
          {property.thumbnail && (
            <div className="h-52 w-full relative flex-shrink-0">
              <img
                src={property.thumbnail}
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
          )}

          {!property.thumbnail && (
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
              className={`text-xs px-3 py-1 rounded-full border font-semibold capitalize ${statusStyles[property.status]}`}
            >
              {property.status}
            </span>
            <span
              className={`text-xs px-3 py-1 rounded-full border font-semibold ${getListingTypeBadgeClasses(property.listing_type)}`}
            >
              {property.listing_type === "rent" ? "🔑 For Rent" : "🏷 For Sale"}
            </span>
            {(property.tags ?? [])
              .filter((t) => (t.active ?? true) && t.label?.trim())
              .map((t, i) => (
                <span
                  key={i}
                  className={`text-xs px-3 py-1 rounded-full border font-semibold ${getTagColorClasses(t.color)}`}
                >
                  {t.label}
                </span>
              ))}
            <span className="text-xs px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600 font-semibold capitalize">
              {property.property_type}
            </span>
            {property.priority && (
              <span
                className={`text-xs px-3 py-1 rounded-full border font-semibold flex items-center gap-1 ${getPriorityBadgeColor(property.priority)}`}
              >
                🚩 Priority #{property.priority}
              </span>
            )}
            {property.agent_id && (
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                ✓ Agent Submission
              </span>
            )}
          </div>

          {/* Tab bar */}
          <div className="px-6 mt-4 border-b border-slate-100 flex-shrink-0">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const isEmpty = tab.id !== "details" && (tab.count ?? 0) === 0;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? "border-red-600 text-red-600"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isActive
                            ? "bg-red-100 text-red-600"
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
                  {/* About the Property */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                      About the Property
                    </h3>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        {
                          icon: DollarSign,
                          label:
                            property.listing_type === "rent"
                              ? "Monthly Rent"
                              : "Price",
                          value: price,
                        },
                        { icon: MapPin, label: "City", value: property.city },
                        {
                          icon: Calendar,
                          label: "Listed",
                          value: new Date(
                            property.created_at,
                          ).toLocaleDateString("en-PH", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }),
                        },
                      ].map(({ icon: Icon, label, value }) => (
                        <div
                          key={label}
                          className="bg-slate-50 rounded-xl p-2.5 border border-slate-100"
                        >
                          <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
                            <Icon className="w-3 h-3" />
                            {label}
                          </div>
                          <p className="text-slate-700 font-bold text-xs">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 mb-3">
                      <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        Full Address
                      </p>
                      <p className="text-slate-700 font-semibold text-sm">
                        {property.address}, {property.city}
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

                  {/* Visibility Map */}
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

                  {/* Amenities */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                      Amenities
                    </h3>
                    {amenities.length > 0 || features.length > 0 ? (
                      <div className="flex flex-1 flex-wrap gap-1.5">
                        {amenities.map((a, i) => (
                          <span
                            key={`am-${i}`}
                            className="text-xs px-3 py-1 rounded-full border border-red-200 bg-red-50 text-red-700 font-medium"
                          >
                            {a}
                          </span>
                        ))}
                        {features.map((f, i) => (
                          <span
                            key={`ft-${i}`}
                            className="text-xs px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 font-medium"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        No amenities or features listed.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "photos" && (
                <div>
                  {images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {images
                        .slice()
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((img) => (
                          <div
                            key={img.id}
                            className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                          >
                            <img
                              src={img.url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
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
                      {videos.map((video) => (
                        <div
                          key={video.id}
                          className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden"
                        >
                          <div className="bg-black aspect-video flex items-center justify-center overflow-hidden">
                            <video
                              src={video.url}
                              controls
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="p-3">
                            <p className="text-xs font-medium text-slate-700 truncate">
                              {video.title || "Property Video"}
                            </p>
                            {video.created_at && (
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                {new Date(
                                  video.created_at,
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
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
                <div className="space-y-5">
                  {loadingFull ? (
                    <div className="flex items-center justify-center py-12 gap-2 text-slate-400 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading unit offerings...
                    </div>
                  ) : units.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
                      {units.map((unit) => (
                        <div
                          key={unit.id}
                          className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden"
                        >
                          <div className="p-3.5">
                            <div className="grid grid-cols-4 gap-1.5">
                              <div className="bg-white rounded-lg p-2 border border-slate-100">
                                <div className="flex items-center gap-1 text-slate-400 text-[9px] mb-0.5">
                                  <Bed className="w-3 h-3" />
                                  Beds
                                </div>
                                <p className="text-slate-700 font-bold text-xs">
                                  {unit.bedrooms ?? "—"}
                                </p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-slate-100">
                                <div className="flex items-center gap-1 text-slate-400 text-[9px] mb-0.5">
                                  <Bath className="w-3 h-3" />
                                  Baths
                                </div>
                                <p className="text-slate-700 font-bold text-xs">
                                  {unit.bathrooms ?? "—"}
                                </p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-slate-100">
                                <div className="flex items-center gap-1 text-slate-400 text-[9px] mb-0.5">
                                  <Square className="w-3 h-3" />
                                  Area
                                </div>
                                <p className="text-slate-700 font-bold text-xs">
                                  {unit.area ?? "—"}
                                </p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-slate-100">
                                <div className="flex items-center gap-1 text-slate-400 text-[9px] mb-0.5">
                                  <Calendar className="w-3 h-3" />
                                  Built
                                </div>
                                <p className="text-slate-700 font-bold text-xs">
                                  {unit.yearBuilt ?? "—"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-2xl p-8 border border-dashed border-slate-200 text-center">
                      <Building2 className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">
                        No unit offerings added for this property yet.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────────

export default function AdminPropertiesPage() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    listing_type: "",
    property_type: "",
    status: "",
    developer: "",
  });
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [otpDeleteModalOpen, setOtpDeleteModalOpen] = useState(false);
  const [otpPropertyId, setOtpPropertyId] = useState<number | null>(null);
  const [otpPropertyTitle, setOtpPropertyTitle] = useState<string | null>(null);

  const toast = (type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, type, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: "12",
      });
      if (search) params.set("search", search);
      if (filters.listing_type)
        params.set("listing_type", filters.listing_type);
      if (filters.property_type)
        params.set("property_type", filters.property_type);
      if (filters.status) params.set("status", filters.status);
      if (filters.developer) params.set("developer", filters.developer);

      const res = await fetch(`/api/admin/properties?${params}`);

      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        throw new Error(`Non-JSON response: ${res.status}`);
      }

      const jsonData = await res.json();
      setData({
        ...jsonData,
        data: Array.isArray(jsonData.data) ? jsonData.data : [],
      });
    } catch (err) {
      console.error("fetchProperties error:", err);
      toast("error", "Failed to load properties.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [page, search, filters]);

  const handleDeleteClick = (property: Property) => {
    setOtpPropertyId(property.id);
    setOtpPropertyTitle(property.title);
    setOtpDeleteModalOpen(true);
    setConfirmId(null);
  };

  const handleOtpDeleteSuccess = () => {
    toast("success", "Property deleted.");
    fetchProperties();
    setOtpDeleteModalOpen(false);
  };

  const handleOtpDeleteError = (message: string) => {
    toast("error", message);
  };

  const handleApproveProperty = async (id: number) => {
    setApprovingId(id);
    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? data.message ?? "Failed to approve");
      }
      toast("success", "Property approved and activated.");
      window.dispatchEvent(new Event("propertyUpdated"));
      fetchProperties();
      setApprovalDialogOpen(false);
      setSelected(null);
    } catch (e: any) {
      toast("error", e.message ?? "Failed to approve property.");
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectProperty = async (id: number, reason: string) => {
    setApprovingId(id);
    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "inactive", rejection_reason: reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? data.message ?? "Failed to reject");
      }
      toast("success", "Property rejected and marked inactive.");
      window.dispatchEvent(new Event("propertyUpdated"));
      fetchProperties();
      setApprovalDialogOpen(false);
      setSelected(null);
    } catch (e: any) {
      toast("error", e.message ?? "Failed to reject property.");
    } finally {
      setApprovingId(null);
    }
  };

  const statusStyles: Record<string, { dot: string; badge: string }> = {
    active: {
      dot: "bg-emerald-500",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    sold: {
      dot: "bg-blue-500",
      badge: "bg-blue-50 text-blue-700 border-blue-200",
    },
    rented: {
      dot: "bg-purple-500",
      badge: "bg-purple-50 text-purple-700 border-purple-200",
    },
    inactive: {
      dot: "bg-slate-400",
      badge: "bg-slate-50 text-slate-500 border-slate-200",
    },
    pending: {
      dot: "bg-amber-500",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
    },
    rejected: {
      dot: "bg-red-500",
      badge: "bg-red-50 text-red-700 border-red-200",
    },
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
                Properties
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {data ? `${data.total} total listings` : "Loading..."}
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
                className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all shadow-sm"
                placeholder="Search by title, address, city..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select
              className="bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm text-slate-600 focus:outline-none focus:border-red-400 shadow-sm appearance-none cursor-pointer"
              value={filters.listing_type}
              onChange={(e) => {
                setFilters((f) => ({ ...f, listing_type: e.target.value }));
                setPage(1);
              }}
            >
              <option value="">All Listing Types</option>
              <option value="sale">For Sale</option>
              <option value="rent">For Rent</option>
            </select>
            <select
              className="bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm text-slate-600 focus:outline-none focus:border-red-400 shadow-sm appearance-none cursor-pointer"
              value={filters.property_type}
              onChange={(e) => {
                setFilters((f) => ({ ...f, property_type: e.target.value }));
                setPage(1);
              }}
            >
              <option value="">All Property Types</option>
              {[
                "house",
                "condo",
                "townhouse",
                "lot",
                "commercial",
                "warehouse",
              ].map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
            <select
              className="bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm text-slate-600 focus:outline-none focus:border-red-400 shadow-sm appearance-none cursor-pointer"
              value={filters.status}
              onChange={(e) => {
                setFilters((f) => ({ ...f, status: e.target.value }));
                setPage(1);
              }}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              className="bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm text-slate-600 focus:outline-none focus:border-red-400 shadow-sm appearance-none cursor-pointer"
              value={filters.developer}
              onChange={(e) => {
                setFilters((f) => ({ ...f, developer: e.target.value }));
                setPage(1);
              }}
            >
              <option value="">All Developers</option>
              <option value="Avida">Avida</option>
              <option value="Ayala">Ayala</option>
              <option value="DMCI">DMCI</option>
              <option value="Megaworld">Megaworld</option>
              <option value="Sycamore">Sycamore</option>
              <option value="Robinsons">Robinsons</option>
              <option value="Emaar">Emaar</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-[2.5fr_1fr_1.2fr_1fr_1fr_120px] gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50">
              {[
                "Property",
                "Category",
                "Price",
                "Location",
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
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">
                  Loading properties...
                </p>
              </div>
            ) : !data?.data?.length ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
                  <Home className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-base font-semibold text-slate-600">
                  No properties found
                </p>
                <p className="text-sm text-slate-400">
                  Try adjusting your filters or add a new property.
                </p>
              </div>
            ) : (
              <div>
                {data.data
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
                        ? p.price_per_month
                          ? `₱${Number(p.price_per_month).toLocaleString("en-PH")}/mo`
                          : "—"
                        : p.price
                          ? `₱${Number(p.price).toLocaleString("en-PH")}`
                          : "—";
                    const ss = statusStyles[p.status] ?? statusStyles.inactive;
                    const isAgentProperty = !!p.agent_id;

                    return (
                      <div
                        key={p.id}
                        className={`row-hover grid grid-cols-[2.5fr_1fr_1.1fr_1.2fr_0.9fr_120px] gap-5 px-6 py-4 items-center transition-colors ${idx < data.data.length - 1 ? "border-b border-slate-50" : ""}`}
                        style={{
                          animation: `fadeUp 0.3s ease ${idx * 0.04}s both`,
                        }}
                      >
                        {/* Property */}
                        <div className="flex items-start gap-3.5 overflow-hidden">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100">
                            {p.thumbnail ? (
                              <img
                                src={p.thumbnail}
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
                            {isAgentProperty && (
                              <div className="mb-1">
                                <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-block whitespace-nowrap">
                                  ⚠ Review to Approve/Reject
                                </span>
                              </div>
                            )}

                            {p.priority && (
                              <div className="mb-1 flex flex-wrap gap-1">
                                <span
                                  className={`text-[10px] px-2 py-1 rounded-full font-bold inline-block whitespace-nowrap flex items-center gap-1 border ${getPriorityBadgeColor(p.priority)}`}
                                >
                                  🚩 Priority #{p.priority}
                                </span>
                              </div>
                            )}

                            {p.status === "pending" && (
                              <div className="mb-1">
                                <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-block whitespace-nowrap flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Pending Approval
                                </span>
                              </div>
                            )}

                            <p className="text-slate-800 text-sm font-bold line-clamp-1 mb-0.5">
                              {p.title}
                            </p>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                                  p.listing_type === "rent"
                                    ? "bg-blue-50 text-blue-600"
                                    : "bg-red-50 text-red-600"
                                }`}
                              >
                                {getListingTypeLabel(p.listing_type)}
                              </span>

                              {(p.tags ?? []).some(
                                (t) => (t.active ?? true) && t.label?.trim(),
                              ) && (
                                <div className="mb-1 flex flex-wrap gap-1">
                                  {(p.tags ?? [])
                                    .filter(
                                      (t) =>
                                        (t.active ?? true) && t.label?.trim(),
                                    )
                                    .map((t, i) => (
                                      <span
                                        key={i}
                                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border inline-block whitespace-nowrap ${getTagColorClasses(t.color)}`}
                                      >
                                        {t.label}
                                      </span>
                                    ))}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-slate-400 text-xs line-clamp-1">
                                {p.address}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Category */}
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-600 text-sm capitalize">
                            {p.property_type}
                          </span>
                        </div>

                        {/* Price */}
                        <p className="text-slate-800 text-sm font-bold">
                          {price}
                        </p>

                        {/* Location */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span
                            className="text-slate-600 text-sm truncate"
                            title={p.address}
                          >
                            {p.address && p.address.length > 10
                              ? p.address.substring(0, 10) + "..."
                              : p.address}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${ss.dot}`}
                          />
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full border font-semibold capitalize ${ss.badge}`}
                          >
                            {p.status}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelected(p);
                              setApprovalDialogOpen(true);
                            }}
                            disabled={
                              approvingId === p.id || p.status === "active"
                            }
                            className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title={
                              p.status === "active"
                                ? "Already approved"
                                : "Approve"
                            }
                          >
                            {approvingId === p.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setSelected(p);
                              setApprovalDialogOpen(true);
                            }}
                            disabled={
                              approvingId === p.id || p.status === "inactive"
                            }
                            className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center text-red-600 hover:text-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title={
                              p.status === "inactive"
                                ? "Already rejected"
                                : "Reject"
                            }
                          >
                            {approvingId === p.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </button>

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
                            onClick={() => handleDeleteClick(p)}
                            disabled={otpDeleteModalOpen}
                            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors disabled:opacity-40"
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
            {data && data.last_page > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {(page - 1) * data.per_page + 1}–
                    {Math.min(page * data.per_page, data.total)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {data.total}
                  </span>
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: data.last_page }, (_, i) => i + 1)
                    .filter((n) => Math.abs(n - page) <= 2)
                    .map((n) => (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`w-9 h-9 rounded-xl border text-sm font-bold transition-all shadow-sm ${
                          n === page
                            ? "bg-red-600 border-red-600 text-white shadow-red-200"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(data.last_page, p + 1))
                    }
                    disabled={page === data.last_page}
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

      {/* OTP Delete Modal */}
      {otpDeleteModalOpen && otpPropertyId && otpPropertyTitle && (
        <OTPDeleteModal
          propertyId={otpPropertyId}
          propertyTitle={otpPropertyTitle}
          isOpen={otpDeleteModalOpen}
          onClose={() => {
            setOtpDeleteModalOpen(false);
            setOtpPropertyId(null);
            setOtpPropertyTitle(null);
          }}
          onSuccess={handleOtpDeleteSuccess}
          onError={handleOtpDeleteError}
        />
      )}

      {/* Approval dialog */}
      {approvalDialogOpen && selected && (
        <ApprovalDialog
          propertyTitle={selected.title}
          loading={approvingId === selected.id}
          onApprove={() => handleApproveProperty(selected.id)}
          onReject={(reason) => handleRejectProperty(selected.id, reason)}
          onCancel={() => {
            setApprovalDialogOpen(false);
            setSelected(null);
          }}
        />
      )}
    </>
  );
}
