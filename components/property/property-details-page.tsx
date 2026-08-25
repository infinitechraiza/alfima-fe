//@/components/property/property-details-page.tsx

"use client";

import Link from "next/link";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useState, use, useCallback } from "react";
import { Property } from "@/lib/types";
import { useAuth } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Phone,
  Share2,
  Mail,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  Loader2,
  User,
  Home,
  Video,
  Image as ImageIcon,
  Play,
  Grid3x3,
  Building2,
  MessageSquare,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Search,
} from "lucide-react";
import DeveloperInquiryModal from "@/components/DeveloperInquiryModal";

// ── Property snapshot ─────────────────────────────────────────────────────────
interface PropertySnapshot {
  id: number;
  title: string;
  image: string;
  blurHash?: string;
  price: string;
  address: string;
  city: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: string | null;
  agentId?: number | null;
  listing_type?: "sale" | "rent" | null;
}

// ── Tour Modal ────────────────────────────────────────────────────────────────
interface TourForm {
  name: string;
  phone: string;
  email: string;
  tourType: "in-person" | "video";
  date: string;
  time: string;
  preferredContact: "sms" | "viber" | "email" | "phone";
}

type TourStep = "pick-slot" | "details" | "submitting" | "success";

const TIME_SLOTS = [
  { label: "9:00 AM", value: "09:00", period: "morning" },
  { label: "10:00 AM", value: "10:00", period: "morning" },
  { label: "11:00 AM", value: "11:00", period: "morning" },
  { label: "12:00 NN", value: "12:00", period: "morning" },
  { label: "1:00 PM", value: "13:00", period: "afternoon" },
  { label: "2:00 PM", value: "14:00", period: "afternoon" },
  { label: "3:00 PM", value: "15:00", period: "afternoon" },
  { label: "4:00 PM", value: "16:00", period: "afternoon" },
  { label: "5:00 PM", value: "17:00", period: "afternoon" },
];

const TOUR_VALIDATORS: Record<
  "name" | "phone" | "email",
  (v: string, form?: TourForm) => string | null
> = {
  name: (v) => {
    if (!v.trim()) return "Full name is required";
    if (v.trim().split(/\s+/).length < 2)
      return "Please enter your full name (first & last)";
    return null;
  },
  phone: (v) => {
    if (!v.trim()) return "Phone number is required";
    const digits = v.replace(/\D/g, "");
    if (!/^(09\d{9}|639\d{9})$/.test(digits))
      return "Must be 11 digits starting with 09";
    return null;
  },
  email: (v, form) => {
    if (form?.preferredContact === "email") {
      if (!v.trim()) return "Email is required when confirming via Email";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()))
        return "Enter a valid email address";
    } else {
      if (v.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()))
        return "Enter a valid email address";
    }
    return null;
  },
};

function getAvailableDates() {
  const dates: {
    value: string;
    label: string;
    day: string;
    isPopular: boolean;
  }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let d = new Date(today);
  d.setDate(d.getDate() + 1);
  while (dates.length < 14) {
    if (d.getDay() !== 0) {
      const value = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      });
      const day = d.toLocaleDateString("en-PH", { weekday: "short" });
      dates.push({ value, label, day, isPopular: d.getDay() === 6 });
    }
    d = new Date(d);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

// ── Lazy-load the heavy Three.js modal ───────────────────────────────────────
// const VirtualTourModal = lazy(() => import('@/components/VirtualTourModal')); // ← 360° tour — commented out

// ── Tiny 1×1 transparent placeholder used as blurDataURL fallback ─────────────
const BLUR_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

/**
 * Build a Cloudinary (or passthrough) URL with size + quality transforms.
 */
function cdnUrl(url: string, w: number, h: number): string {
  if (!url) return "/placeholder-property.jpg"; // local fallback, no external DNS

  // Rewrite backend localhost URLs through the Next.js rewrite proxy
  if (url.includes("localhost:8000")) {
    url = url.replace("http://localhost:8000", "/img-proxy");
  }

  // Also handle production backend URL if needed
  if (url.includes("infinitech-api14.site")) {
    // production URL is fine as-is
  }

  if (url.includes("cloudinary.com")) {
    return url.replace(
      "/upload/",
      `/upload/w_${w * 2},h_${h * 2},c_fill,f_auto,q_auto:good/`,
    );
  }
  return url;
}

function FieldWrapper({
  error,
  children,
}: {
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      {children}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            marginTop: 5,
          }}
        >
          <span style={{ fontSize: 13, color: "#ef4444", lineHeight: 1.4 }}>
            ⚠ {error}
          </span>
        </div>
      )}
    </div>
  );
}

function imgUrl(url: string): string {
  if (!url) return "/placeholder-property.jpg";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;
}

function formatPrice(price: string | number | null | undefined): string {
  if (!price) return "Price upon request";
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(numPrice)) return "Price upon request";
  return `₱${numPrice.toLocaleString("en-PH")}`;
}

// Formats a single price or a min–max range, with the correct rent suffix.
function formatPriceRange(
  min: string | number | null | undefined,
  max: string | number | null | undefined,
  isRent: boolean,
): string {
  const suffix = isRent ? "/mo" : "";
  const minNum =
    min == null || min === ""
      ? null
      : typeof min === "string"
        ? parseFloat(min)
        : min;
  const maxNum =
    max == null || max === ""
      ? null
      : typeof max === "string"
        ? parseFloat(max)
        : max;

  if (minNum == null && maxNum == null) return "Price upon request";
  if (minNum != null && maxNum != null && minNum !== maxNum) {
    return `${formatPrice(minNum)} – ${formatPrice(maxNum)}${suffix}`;
  }
  return `${formatPrice(minNum ?? maxNum)}${suffix}`;
}

// ── Estimated Payments (frontend-only, price-based, no backend fields) ────
const ASSUMED_INTEREST_RATE = 6.5; // annual %
const ASSUMED_LOAN_TERM_YEARS = 20;

// `backendKey` maps each frontend payment category to the value stored in
// the property's `financing_option` array (see DeveloperPropertiesController
// FINANCING_OPTIONS / FINANCING_OPTIONS constant on the admin form) so we
// can gate which buttons are clickable based on what the property actually
// offers.
const PAYMENT_CATEGORIES = [
  {
    id: "inhouse",
    label: "In-House Financing",
    downPaymentPercent: 10,
    backendKey: "in_house_financing",
  },
  {
    id: "pagibig",
    label: "PAG-IBIG Financing",
    downPaymentPercent: 5,
    backendKey: "pag_ibig_financing",
  },
  {
    id: "bank",
    label: "Bank Financing",
    downPaymentPercent: 20,
    backendKey: "bank_financing",
  },
] as const;

function pesos(amount: number): string {
  if (!amount || isNaN(amount)) return "₱0";
  return `₱${amount.toLocaleString("en-PH", { maximumFractionDigits: 2 })}`;
}

function EstimatedPayments({
  price,
  availableFinancing,
}: {
  price: number;
  // Raw backend values, e.g. ["in_house_financing", "bank_financing"].
  // Empty/undefined means "not specified" — in that case we fall back to
  // showing all options as clickable rather than silently locking out
  // financing selection on properties that predate this field.
  availableFinancing?: string[];
}) {
  const hasRestriction = (availableFinancing?.length ?? 0) > 0;

  const isAvailable = (backendKey: string) =>
    !hasRestriction || availableFinancing!.includes(backendKey);

  const initialCategory =
    PAYMENT_CATEGORIES.find((c) => isAvailable(c.backendKey)) ??
    PAYMENT_CATEGORIES[0];

  const [selectedCategory, setSelectedCategory] =
    useState<(typeof PAYMENT_CATEGORIES)[number]>(initialCategory);

  // Re-validate the selected category whenever the available financing list
  // changes (e.g. property data finishes loading after initial mount).
  useEffect(() => {
    if (!isAvailable(selectedCategory.backendKey)) {
      const fallback =
        PAYMENT_CATEGORIES.find((c) => isAvailable(c.backendKey)) ??
        PAYMENT_CATEGORIES[0];
      setSelectedCategory(fallback);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableFinancing?.join(",")]);

  const downPaymentPercent = selectedCategory.downPaymentPercent;
  const downPayment = price * (downPaymentPercent / 100);
  const loanAmount = price - downPayment;
  const monthlyRate = ASSUMED_INTEREST_RATE / 100 / 12;
  const numPayments = ASSUMED_LOAN_TERM_YEARS * 12;

  const monthlyMortgage =
    monthlyRate === 0
      ? loanAmount / numPayments
      : (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);

  return (
    <div className="mb-2 space-y-5">
      {/* Estimated Monthly */}
      <div className="space-y-1">
        <p className="text-sm text-white/80">Estimated Monthly</p>

        <h3 className="text-4xl font-bold leading-tight text-white">
          {pesos(monthlyMortgage)}
          <span className="ml-1 text-lg font-normal text-white/80">/mo</span>
        </h3>
      </div>

      {/* Payment Category Links */}
      <div className="space-y-2">
        <p className="text-xs text-white/80">Financing Option</p>

        <div className="flex flex-wrap gap-1.5">
          {PAYMENT_CATEGORIES.map((category) => {
            const available = isAvailable(category.backendKey);
            const isSelected = selectedCategory.id === category.id;
            return (
              <button
                key={category.id}
                onClick={() => available && setSelectedCategory(category)}
                disabled={!available}
                title={available ? undefined : "Not offered on this property"}
                className={`rounded-md px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
                  !available
                    ? "bg-white/5 text-white/30 cursor-not-allowed"
                    : isSelected
                      ? "bg-white text-red-800"
                      : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {category.label}
                {!available && (
                  <span className="ml-1 text-[9px] font-normal">
                    (Unavailable)
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Breakdown */}
      <div className="rounded-xl border border-white/15 bg-black/20 p-4">
        <div className="space-y-3">
          {/* Downpayment */}
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-white/80">
              Downpayment ({downPaymentPercent}%)
            </span>

            <span className="shrink-0 font-semibold text-white">
              {pesos(downPayment)}
            </span>
          </div>

          {/* Loan Amount */}
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-white/80">Loan Amount</span>

            <span className="shrink-0 font-semibold text-white">
              {pesos(loanAmount)}
            </span>
          </div>

          {/* Monthly Mortgage */}
          <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3 text-sm">
            <span className="text-white/80">Est. Monthly Mortgage</span>

            <span className="shrink-0 font-semibold text-white">
              {pesos(monthlyMortgage)}
            </span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] leading-relaxed text-white/60">
        Estimate only, based on {ASSUMED_INTEREST_RATE}% interest and a{" "}
        {ASSUMED_LOAN_TERM_YEARS}-yr term.
      </p>
    </div>
  );
}

function tagColorClasses(color?: string): string {
  const map: Record<string, string> = {
    red: "bg-red-500/90 text-white",
    orange: "bg-orange-500/90 text-white",
    yellow: "bg-yellow-500/90 text-black",
    green: "bg-emerald-500/90 text-white",
    blue: "bg-blue-500/90 text-white",
    purple: "bg-purple-500/90 text-white",
    pink: "bg-pink-500/90 text-white",
    gray: "bg-gray-500/90 text-white",
  };
  return map[(color ?? "red").toLowerCase()] ?? map.red;
}

// ── Unit Offering Photos (ported from AdminDevelopersPage) ────────────────────
// `unit_offer_images` on a property is grouped per input field
// (e.g. "bedroom_type", "office_area", "commercial_frontage", ...) rather
// than being one flat gallery. This mirrors the exact field groupings and
// parsing logic used in the admin's ViewModal "Units" tab so photos line up
// with the same labels an admin sees when they upload them. This grouping
// is shared by BOTH developer properties and regular (individual/agent)
// properties — regular listings default to the `residential` category (see
// `unitPhotoFields` below) since that's the only shape they can offer.
interface UnitOfferingPhoto {
  id: string;
  url: string;
  category: string;
}

const UNIT_PHOTO_FIELDS: Record<string, { key: string; label: string }[]> = {
  residential: [
    { key: "residential_type", label: "Residential Type" },
    { key: "bedroom_type", label: "Bedroom Type" },
    { key: "floor_level", label: "Floor Level" },
    { key: "furnished", label: "Furnished Status" },
    { key: "bathrooms", label: "Bathrooms" },
    { key: "area", label: "Area (sqm)" },
    { key: "parking_slots", label: "Parking" },
  ],
  office_space: [
    { key: "office_space_type", label: "Office Type" },
    { key: "office_internet", label: "Internet" },
    { key: "office_area", label: "Area (sqm)" },
    { key: "office_floor", label: "Floor Level" },
    { key: "office_space_name", label: "Office Name / Label" },
  ],
  commercial: [
    { key: "commercial_type", label: "Commercial Type" },
    { key: "commercial_floor_level", label: "Floor Level" },
    { key: "commercial_area", label: "Total Area (sqm)" },
    { key: "commercial_frontage", label: "Frontage Width (m)" },
    { key: "commercial_name", label: "Commercial Name / Label" },
  ],
};

// `unit_offer_images` can arrive as a real object (from show()) OR a raw,
// un-decoded JSON string (from index()) depending on which endpoint served
// the data — handle both the same way AdminDevelopersPage does, so photos
// don't silently disappear just because this page hit a different route.
function mapUnitOfferImagesToPhotos(
  unitOfferImages: unknown,
): UnitOfferingPhoto[] {
  const result: UnitOfferingPhoto[] = [];
  if (!unitOfferImages) return result;

  let parsed: Record<string, Array<{ path?: string; url: string }>> | null =
    null;

  if (typeof unitOfferImages === "string") {
    const trimmed = unitOfferImages.trim();
    if (!trimmed) return result;
    try {
      const decoded = JSON.parse(trimmed);
      if (decoded && typeof decoded === "object" && !Array.isArray(decoded)) {
        parsed = decoded;
      }
    } catch {
      // Not valid JSON — nothing we can do with it.
      return result;
    }
  } else if (
    typeof unitOfferImages === "object" &&
    !Array.isArray(unitOfferImages)
  ) {
    parsed = unitOfferImages as Record<
      string,
      Array<{ path?: string; url: string }>
    >;
  }

  if (!parsed) return result;

  Object.entries(parsed).forEach(([category, photos]) => {
    if (!Array.isArray(photos)) return;
    photos.forEach((img, index) => {
      if (!img?.url) return;
      result.push({
        id: `${category}-${index}-${img.path ?? img.url}`,
        url: imgUrl(String(img.url)),
        category,
      });
    });
  });

  return result;
}

type Agent = {
  id: number;
  name: string;
  avatar?: string | null;
  phone?: string | null;
  email?: string | null;
  specialization?: string | null;
  experience_years?: number | null;
  listings?: number;
  is_active?: boolean;
};

type LeadForm = {
  name: string;
  phone: string;
  email: string;
  message: string;
  preferredContact: "sms" | "viber" | "email" | "phone" | "whatsapp";
  viewingDate: string;
};

type ModalStep = "select-agent" | "lead-form" | "submitting" | "success";

// ── Shared styles ─────────────────────────────────────────────────────────────
const s = {
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(40, 15, 15, 0.75)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backdropFilter: "blur(6px)",
  },
  modal: {
    background: "#fff",
    borderRadius: 24,
    width: "100%",
    maxWidth: 640,
    maxHeight: "92vh",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
    boxShadow: "0 40px 100px rgba(0,0,0,0.3)",
  },
  header: {
    padding: "22px 28px 18px",
    borderBottom: "1px solid #f0f0f0",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexShrink: 0,
    background: "linear-gradient(135deg, #fff 0%, #fafafa 100%)",
  },
  closeBtn: {
    background: "#f3f4f6",
    border: "none",
    borderRadius: 10,
    padding: 8,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
  },
  primaryBtn: (disabled = false) => ({
    flex: 2,
    padding: "13px 20px",
    border: "none",
    borderRadius: 12,
    background: disabled
      ? "#e5e7eb"
      : "linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)",
    color: disabled ? "#9ca3af" : "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: disabled ? "none" : "0 4px 14px rgba(192,57,43,0.35)",
  }),
  secondaryBtn: {
    flex: 1,
    padding: "13px 20px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 12,
    background: "#fff",
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  input: (hasError = false) => ({
    width: "100%",
    padding: "11px 14px",
    border: `1.5px solid ${hasError ? "#ef4444" : "#e5e7eb"}`,
    borderRadius: 10,
    fontSize: 14,
    color: "#111827",
    outline: "none",
    transition: "border 0.15s",
    background: "#fafafa",
    boxSizing: "border-box" as const,
  }),
  readonlyInput: {
    width: "100%",
    padding: "11px 14px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 10,
    fontSize: 14,
    color: "#6b7280",
    outline: "none",
    background: "#f3f4f6",
    boxSizing: "border-box" as const,
    cursor: "not-allowed" as const,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
  },
  fieldGroup: { marginBottom: 16 },
};

// ── Logged-in banner ──────────────────────────────────────────────────────────
function LoggedInBanner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 14px",
        background: "#f0fdf4",
        border: "1.5px solid #bbf7d0",
        borderRadius: 10,
        marginBottom: 16,
      }}
    >
      <Lock size={13} color="#16a34a" />
      <span style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}>
        Auto-filled from your account&nbsp;·&nbsp;
        <span style={{ fontWeight: 400 }}>contact fields are locked</span>
      </span>
    </div>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: ModalStep }) {
  const steps = ["select-agent", "lead-form"];
  const currentIdx = steps.indexOf(step);
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}
    >
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: i <= currentIdx ? "#c0392b" : "#e5e7eb",
              color: i <= currentIdx ? "#fff" : "#9ca3af",
              transition: "all 0.3s",
            }}
          >
            {i < currentIdx ? <CheckCircle2 size={13} /> : i + 1}
          </div>
          <span
            style={{
              fontSize: 12,
              color: i <= currentIdx ? "#c0392b" : "#9ca3af",
              fontWeight: i === currentIdx ? 700 : 400,
            }}
          >
            {i === 0 ? "Choose Agent" : "Your Details"}
          </span>
          {i < steps.length - 1 && (
            <div
              style={{
                width: 24,
                height: 2,
                background: i < currentIdx ? "#c0392b" : "#e5e7eb",
                borderRadius: 1,
                transition: "background 0.3s",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Agent avatar ──────────────────────────────────────────────────────────────
function AgentAvatar({
  src,
  alt,
  size = 54,
  className = "",
  style = {},
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&size=${size * 2}&background=random`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || fallback}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      className={`object-cover rounded-full flex-shrink-0 ${className}`}
      style={{ width: size, height: size, ...style }}
      onError={(e) => {
        (e.target as HTMLImageElement).src = fallback;
      }}
    />
  );
}

function ContactAgentModal({
  onClose,
  property,
  listedAgent,
}: {
  onClose: () => void;
  property: PropertySnapshot;
  listedAgent?: Agent | null;
}) {
  const { user } = useAuth();

  const [step, setStep] = useState<ModalStep>(
    listedAgent ? "lead-form" : "select-agent",
  );
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(
    listedAgent ?? null,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [form, setForm] = useState<LeadForm>({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
    message: "",
    preferredContact: "sms",
    viewingDate: "",
  });

  const lockedFields = {
    name: !!user?.name,
    phone: !!user?.phone,
    email: !!user?.email,
  };

  const handleSubmit = async () => {
    setStep("submitting");
    setSubmitError(null);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: property.id,
          agent_id: selectedAgent!.id,
          lead_name: form.name,
          lead_phone: form.phone.replace(/\D/g, "").replace(/^639/, "0"),
          lead_email: form.email || null,
          message: form.message || null,
          preferred_contact: form.preferredContact,
          viewing_date: form.viewingDate || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.errors
          ? Object.values(data.errors as Record<string, string[]>)
              .flat()
              .join(" ")
          : (data.message ?? data.error ?? "Failed to send inquiry.");
        setSubmitError(msg);
        setStep("lead-form");
        return;
      }

      setStep("success");
    } catch {
      setSubmitError("Network error. Please try again.");
      setStep("lead-form");
    }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        {submitError && step === "lead-form" && (
          <div
            style={{
              padding: "10px 28px",
              background: "#fef2f2",
              borderBottom: "1px solid #fecaca",
              flexShrink: 0,
            }}
          >
            <p style={{ fontSize: 13, color: "#dc2626", margin: 0 }}>
              ⚠ {submitError}
            </p>
          </div>
        )}
        {step === "select-agent" && (
          <AgentSelectStep
            selected={selectedAgent}
            setSelected={setSelectedAgent}
            onNext={() => setStep("lead-form")}
            onClose={onClose}
            propertyTitle={property.title}
          />
        )}
        {(step === "lead-form" || step === "submitting") && selectedAgent && (
          <LeadFormStep
            agent={selectedAgent}
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            onBack={() => setStep("select-agent")}
            onClose={onClose}
            submitting={step === "submitting"}
            property={property}
            canGoBack={!listedAgent}
            lockedFields={lockedFields}
          />
        )}
        {step === "success" && selectedAgent && (
          <SuccessStep agent={selectedAgent} form={form} onClose={onClose} />
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Agent Selection Step ──────────────────────────────────────────────────────

// ── Agent Selection Step ──────────────────────────────────────────────────────
function AgentSelectStep({
  selected,
  setSelected,
  onNext,
  onClose,
  propertyTitle,
}: {
  selected: Agent | null;
  setSelected: (a: Agent | null) => void;
  onNext: () => void;
  onClose: () => void;
  propertyTitle: string;
}) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch("/api/agents");
        if (!res.ok) throw new Error("Failed to fetch agents");
        const data = await res.json();
        setAgents(
          Array.isArray(data) ? data : (data.agents ?? data.data ?? []),
        );
      } catch {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const filtered = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.specialization ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div style={s.header}>
        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#111827",
              margin: 0,
            }}
          >
            Choose Your Agent
          </h2>
          <StepIndicator step="select-agent" />
        </div>
        <button style={s.closeBtn} onClick={onClose}>
          <X size={18} color="#6b7280" />
        </button>
      </div>

      <div
        style={{
          padding: "12px 28px",
          background: "#fff8f8",
          borderBottom: "1px solid #fde8e8",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Building2 size={14} color="#c0392b" />
        <span style={{ fontSize: 13, color: "#6b7280" }}>
          Inquiring about:{" "}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
          {propertyTitle}
        </span>
      </div>

      <div
        style={{
          padding: "14px 28px",
          borderBottom: "1px solid #f0f0f0",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#f9fafb",
            border: "1.5px solid #e5e7eb",
            borderRadius: 12,
            padding: "9px 14px",
          }}
        >
          <Search size={15} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search by name or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 14,
              color: "#111827",
              width: "100%",
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 28px" }}>
        {loading ? (
          <div style={{ display: "grid", gap: 10 }}>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: 86,
                  background: "#f3f4f6",
                  borderRadius: 14,
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        ) : fetchError ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ fontSize: 14, color: "#ef4444", marginBottom: 8 }}>
              Failed to load agents.
            </p>
            <p style={{ fontSize: 12, color: "#9ca3af" }}>
              Please check your connection and try again.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "#9ca3af",
              padding: "40px 0",
              fontSize: 14,
            }}
          >
            No agents found for "{search}"
          </p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {filtered.map((agent) => {
              const isSel = selected?.id === agent.id;
              return (
                <div
                  key={agent.id}
                  onClick={() => setSelected(isSel ? null : agent)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    borderRadius: 16,
                    cursor: "pointer",
                    border: isSel ? "2px solid #c0392b" : "1.5px solid #e5e7eb",
                    background: isSel ? "#fff5f5" : "#fff",
                    transition: "all 0.15s",
                    position: "relative",
                    boxShadow: isSel
                      ? "0 4px 16px rgba(192,57,43,0.12)"
                      : "none",
                  }}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <AgentAvatar
                      src={agent.avatar ?? ""}
                      alt={agent.name}
                      size={54}
                      style={{
                        border: isSel
                          ? "2.5px solid #c0392b"
                          : "2px solid #e5e7eb",
                      }}
                    />
                    {isSel && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: -2,
                          right: -2,
                          width: 20,
                          height: 20,
                          background: "#c0392b",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "2px solid #fff",
                        }}
                      >
                        <CheckCircle2 size={12} color="#fff" />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 3,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#111827",
                          margin: 0,
                        }}
                      >
                        {agent.name}
                      </p>
                      {agent.specialization && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#c0392b",
                            background: "#fff0ee",
                            padding: "2px 9px",
                            borderRadius: 20,
                            flexShrink: 0,
                          }}
                        >
                          {agent.specialization}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        flexWrap: "wrap" as const,
                      }}
                    >
                      {agent.experience_years != null && (
                        <span style={{ fontSize: 12, color: "#6b7280" }}>
                          {agent.experience_years} yrs exp
                        </span>
                      )}
                      {(agent.listings ?? 0) > 0 && (
                        <span style={{ fontSize: 12, color: "#6b7280" }}>
                          {agent.listings} listings
                        </span>
                      )}
                    </div>
                    {agent.phone && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "#9ca3af",
                          margin: "4px 0 0",
                        }}
                      >
                        {agent.phone}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        style={{
          padding: "18px 28px",
          borderTop: "1px solid #f0f0f0",
          flexShrink: 0,
          display: "flex",
          gap: 10,
        }}
      >
        <button style={s.secondaryBtn} onClick={onClose}>
          Cancel
        </button>
        <button
          style={s.primaryBtn(!selected)}
          onClick={() => selected && onNext()}
          disabled={!selected}
        >
          Continue <ArrowRight size={16} />
        </button>
      </div>
    </>
  );
}

// ── Validation ────────────────────────────────────────────────────────────────
type ValidatableField = "name" | "phone" | "email" | "message" | "viewingDate";

const VALIDATORS: Record<ValidatableField, (v: string) => string | null> = {
  name: (v) => {
    if (!v.trim()) return "Full name is required";
    if (v.trim().length < 2) return "Name must be at least 2 characters";
    if (v.trim().length > 60) return "Name must be 60 characters or less";
    if (!/^[a-zA-ZÀ-ÖØ-öø-ÿ\s'\-\.]+$/.test(v.trim()))
      return "Name must contain letters only";
    if (v.trim().split(/\s+/).length < 2)
      return "Please enter your full name (first & last)";
    return null;
  },
  phone: (v) => {
    if (!v.trim()) return "Phone number is required";
    const digits = v.replace(/\D/g, "");
    if (!/^\d+$/.test(digits)) return "Phone number must contain numbers only";
    if (!/^(09\d{9}|639\d{9})$/.test(digits)) {
      if (digits.length < 11)
        return `Phone number too short — must be 11 digits (e.g. 09171234567)`;
      if (digits.length > 12)
        return `Phone number too long — must be 11 digits (e.g. 09171234567)`;
      return "Must start with 09 (e.g. 09171234567) or +639";
    }
    return null;
  },
  email: (v) => {
    if (!v.trim()) return null;
    if (v.length > 100) return "Email must be 100 characters or less";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()))
      return "Enter a valid email address (e.g. juan@gmail.com)";
    return null;
  },
  message: (v) => {
    if (!v.trim()) return null;
    if (v.trim().length < 10) return "Message must be at least 10 characters";
    if (v.length > 500) return `Message too long — ${v.length}/500 characters`;
    return null;
  },
  viewingDate: (v) => {
    if (!v) return null;
    const selected = new Date(v);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (selected < tomorrow) return "Viewing date must be tomorrow or later";
    const maxDate = new Date(today);
    maxDate.setMonth(today.getMonth() + 6);
    if (selected > maxDate)
      return "Viewing date must be within the next 6 months";
    return null;
  },
};

function LeadFormStep({
  agent,
  form,
  setForm,
  onSubmit,
  onBack,
  onClose,
  submitting,
  property,
  canGoBack,
  lockedFields,
}: {
  agent: Agent;
  form: LeadForm;
  setForm: (f: LeadForm) => void;
  onSubmit: () => void;
  onBack: () => void;
  onClose: () => void;
  submitting: boolean;
  property: PropertySnapshot;
  canGoBack?: boolean;
  lockedFields?: { name?: boolean; phone?: boolean; email?: boolean };
}) {
  const [errors, setErrors] = useState<Partial<Record<keyof LeadForm, string>>>(
    {},
  );
  const [touched, setTouched] = useState<
    Partial<Record<keyof LeadForm, boolean>>
  >({});

  const isLocked = (field: "name" | "phone" | "email") =>
    !!lockedFields?.[field];

  const runValidator = (key: keyof LeadForm, val: string): string | null => {
    if (key in VALIDATORS) return VALIDATORS[key as ValidatableField](val);
    return null;
  };

  const touch = (key: keyof LeadForm) => {
    if (isLocked(key as any)) return;
    setTouched((prev) => ({ ...prev, [key]: true }));
    const err = runValidator(key, form[key] as string);
    setErrors((prev) => ({ ...prev, [key]: err ?? undefined }));
  };

  const update = (key: keyof LeadForm, val: string) => {
    if (isLocked(key as any)) return;
    if (key === "phone") val = val.replace(/[^\d+\s\-()]/g, "");
    if (key === "name") val = val.replace(/[0-9]/g, "");
    setForm({ ...form, [key]: val });
    if (touched[key]) {
      const err = runValidator(key, val);
      setErrors((prev) => ({ ...prev, [key]: err ?? undefined }));
    }
  };

  const validate = () => {
    const e: Partial<Record<keyof LeadForm, string>> = {};
    (Object.keys(VALIDATORS) as ValidatableField[]).forEach((key) => {
      if (isLocked(key as any)) return;
      const err = VALIDATORS[key](form[key] as string);
      if (err) e[key] = err;
    });
    setErrors(e);
    setTouched({
      name: true,
      phone: true,
      email: true,
      message: true,
      viewingDate: true,
      preferredContact: true,
    });
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onSubmit();
  };

  const contactOptions: {
    value: LeadForm["preferredContact"];
    label: string;
    icon: React.ReactNode;
  }[] = [
    { value: "sms", label: "SMS", icon: <MessageSquare size={20} /> },
    { value: "viber", label: "Viber", icon: <Phone size={20} /> },
    { value: "email", label: "Email", icon: <Mail size={20} /> },
    { value: "phone", label: "Call", icon: <Phone size={20} /> },
  ];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 6);
  const maxDateStr = maxDate.toISOString().split("T")[0];
  const phoneDigits = form.phone.replace(/\D/g, "").length;
  const hasLockedFields =
    lockedFields &&
    (lockedFields.name || lockedFields.phone || lockedFields.email);

  return (
    <>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
        <div style={s.header}>
          <div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#111827",
                margin: 0,
              }}
            >
              Your Contact Details
            </h2>
            {canGoBack && <StepIndicator step="lead-form" />}
          </div>
          <button style={s.closeBtn} onClick={onClose}>
            <X size={18} color="#6b7280" />
          </button>
        </div>

        {/* Property snapshot removed */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            background: "#fff8f8",
            border: "1.5px solid #fde8e8",
            borderRadius: 12,
            marginBottom: 14,
          }}
        >
          <AgentAvatar
            src={agent.avatar ?? ""}
            alt={agent.name}
            size={36}
            style={{ border: "2px solid #c0392b" }}
          />
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#111827",
                margin: 0,
              }}
            >
              Contacting {agent.name}
            </p>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
              {agent.specialization ?? "Real Estate Agent"} ·{" "}
              {agent.experience_years ?? "—"} yrs exp
            </p>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
        {hasLockedFields && <LoggedInBanner />}

        <div style={{ marginBottom: 16 }}>
          <FieldWrapper error={errors.name}>
            <label style={s.label}>
              Full Name <span style={{ color: "#ef4444" }}>*</span>
              {isLocked("name") && (
                <Lock
                  size={11}
                  color="#9ca3af"
                  style={{
                    display: "inline",
                    marginLeft: 5,
                    verticalAlign: "middle",
                  }}
                />
              )}
            </label>
            <div style={{ position: "relative" }}>
              <User
                size={14}
                color={errors.name ? "#ef4444" : "#9ca3af"}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                style={{
                  ...(isLocked("name")
                    ? s.readonlyInput
                    : s.input(!!errors.name)),
                  paddingLeft: 34,
                }}
                placeholder="Juan dela Cruz"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                onBlur={() => touch("name")}
                readOnly={isLocked("name")}
                maxLength={60}
                autoComplete="name"
              />
              {(isLocked("name") ||
                (form.name.trim().length > 0 &&
                  !errors.name &&
                  touched.name)) && (
                <CheckCircle2
                  size={14}
                  color="#22c55e"
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />
              )}
            </div>
            {!errors.name && !isLocked("name") && (
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                First and last name required
              </p>
            )}
          </FieldWrapper>

          <FieldWrapper error={errors.phone}>
            <label style={s.label}>
              Phone Number <span style={{ color: "#ef4444" }}>*</span>
              {isLocked("phone") && (
                <Lock
                  size={11}
                  color="#9ca3af"
                  style={{
                    display: "inline",
                    marginLeft: 5,
                    verticalAlign: "middle",
                  }}
                />
              )}
            </label>
            <div style={{ position: "relative" }}>
              <Phone
                size={14}
                color={errors.phone ? "#ef4444" : "#9ca3af"}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                style={{
                  ...(isLocked("phone")
                    ? s.readonlyInput
                    : s.input(!!errors.phone)),
                  paddingLeft: 34,
                  paddingRight: 52,
                }}
                placeholder="09171234567"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                onBlur={() => touch("phone")}
                readOnly={isLocked("phone")}
                type="tel"
                maxLength={15}
                autoComplete="tel"
                inputMode="numeric"
              />
              <span
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: isLocked("phone")
                    ? "#22c55e"
                    : phoneDigits === 11
                      ? "#22c55e"
                      : phoneDigits > 11
                        ? "#ef4444"
                        : "#9ca3af",
                }}
              >
                {isLocked("phone") ? (
                  <CheckCircle2 size={14} color="#22c55e" />
                ) : (
                  `${phoneDigits}/11`
                )}
              </span>
            </div>
            {!errors.phone && !isLocked("phone") && (
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                PH mobile number — 11 digits (e.g. 09171234567)
              </p>
            )}
          </FieldWrapper>

          <FieldWrapper error={errors.email}>
            <label style={s.label}>
              Email Address{" "}
              {isLocked("email") ? (
                <Lock
                  size={11}
                  color="#9ca3af"
                  style={{
                    display: "inline",
                    marginLeft: 5,
                    verticalAlign: "middle",
                  }}
                />
              ) : (
                <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                  (optional)
                </span>
              )}
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={14}
                color={errors.email ? "#ef4444" : "#9ca3af"}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                style={{
                  ...(isLocked("email")
                    ? s.readonlyInput
                    : s.input(!!errors.email)),
                  paddingLeft: 34,
                }}
                placeholder="juan@email.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                onBlur={() => touch("email")}
                readOnly={isLocked("email")}
                type="email"
                maxLength={100}
                autoComplete="email"
              />
              {(isLocked("email") ||
                (form.email.trim().length > 0 &&
                  !errors.email &&
                  touched.email)) && (
                <CheckCircle2
                  size={14}
                  color="#22c55e"
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />
              )}
            </div>
          </FieldWrapper>

          <div style={s.fieldGroup}>
            <label style={s.label}>Preferred Contact Method</label>
            <div style={{ display: "flex", gap: 8 }}>
              {contactOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update("preferredContact", opt.value)}
                  style={{
                    flex: 1,
                    padding: "10px 8px",
                    borderRadius: 10,
                    cursor: "pointer",
                    border:
                      form.preferredContact === opt.value
                        ? "2px solid #c0392b"
                        : "1.5px solid #e5e7eb",
                    background:
                      form.preferredContact === opt.value
                        ? "#fff5f5"
                        : "#fafafa",
                    fontSize: 12,
                    fontWeight: form.preferredContact === opt.value ? 700 : 500,
                    color:
                      form.preferredContact === opt.value
                        ? "#c0392b"
                        : "#6b7280",
                    transition: "all 0.15s",
                    display: "flex",
                    flexDirection: "column" as const,
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {opt.icon}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <FieldWrapper error={errors.viewingDate}>
            <label style={s.label}>
              <Calendar
                size={13}
                style={{
                  display: "inline",
                  marginRight: 5,
                  verticalAlign: "middle",
                }}
              />
              Preferred Viewing Date{" "}
              <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                (optional)
              </span>
            </label>
            <input
              style={s.input(!!errors.viewingDate)}
              type="date"
              min={minDate}
              max={maxDateStr}
              value={form.viewingDate}
              onChange={(e) => update("viewingDate", e.target.value)}
              onBlur={() => touch("viewingDate")}
            />
            {!errors.viewingDate && (
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                Available slots: tomorrow up to 6 months ahead
              </p>
            )}
          </FieldWrapper>

          <FieldWrapper error={errors.message}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <label style={{ ...s.label, marginBottom: 0 }}>
                <MessageSquare
                  size={13}
                  style={{
                    display: "inline",
                    marginRight: 5,
                    verticalAlign: "middle",
                  }}
                />
                Message to Agent{" "}
                <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                  (optional)
                </span>
              </label>
              <span
                style={{
                  fontSize: 11,
                  color: form.message.length > 450 ? "#ef4444" : "#9ca3af",
                }}
              >
                {form.message.length}/500
              </span>
            </div>
            <textarea
              style={{
                ...s.input(!!errors.message),
                resize: "vertical" as const,
                minHeight: 88,
                paddingTop: 11,
              }}
              placeholder="Hi, I'm interested in this property. Can we schedule a viewing?"
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              onBlur={() => touch("message")}
              rows={3}
              maxLength={500}
            />
          </FieldWrapper>

          <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6 }}>
            🔒 Your details are shared only with your selected agent and will
            not be used for marketing without consent.
          </p>
        </div>

        <div
          style={{
            padding: "18px 28px",
            borderTop: "1px solid #f0f0f0",
            flexShrink: 0,
            display: "flex",
            gap: 10,
          }}
        >
          {canGoBack && (
            <button
              style={s.secondaryBtn}
              onClick={onBack}
              disabled={submitting}
            >
              ← Back
            </button>
          )}
          <button
            style={s.primaryBtn(submitting)}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />{" "}
                Sending…
              </>
            ) : (
              <>
                Send Inquiry <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

function SuccessStep({
  agent,
  form,
  onClose,
}: {
  agent: Agent;
  form: LeadForm;
  onClose: () => void;
}) {
  return (
    <div className="px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
        ✓
      </div>
      <h3 className="text-2xl font-bold text-slate-900">Inquiry Sent! 🎉</h3>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">
        <span className="font-bold text-slate-900">{agent.name}</span> has
        received your inquiry and will contact you via{" "}
        <span className="font-bold text-slate-900">
          {form.preferredContact}
        </span>{" "}
        within 24 hours.
      </p>
      <button
        onClick={onClose}
        className="mt-6 w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-500"
      >
        Done
      </button>
    </div>
  );
}

function ScheduleTourModal({
  onClose,
  property,
}: {
  onClose: () => void;
  property: PropertySnapshot;
}) {
  const { user } = useAuth();

  const [step, setStep] = useState<TourStep>("pick-slot");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [form, setForm] = useState<TourForm>({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
    tourType: "in-person",
    date: "",
    time: "",
    preferredContact: "sms",
  });

  const [errors, setErrors] = useState<
    Partial<Record<"name" | "phone" | "email", string>>
  >({});
  const [touched, setTouched] = useState<
    Partial<Record<"name" | "phone" | "email", boolean>>
  >({});

  const isLocked = (field: "name" | "phone" | "email") => {
    if (field === "name") return !!user?.name;
    if (field === "phone") return !!user?.phone;
    if (field === "email") return !!user?.email;
    return false;
  };

  const dates = getAvailableDates();
  const phoneDigits = form.phone.replace(/\D/g, "").length;
  const canProceedSlot = form.date && form.time;

  const updateForm = (key: keyof TourForm, val: string) => {
    if ((key === "name" || key === "phone" || key === "email") && isLocked(key))
      return;
    if (key === "phone") val = val.replace(/[^\d+\s\-()]/g, "");
    if (key === "name") val = val.replace(/[0-9]/g, "");
    const updated = { ...form, [key]: val };
    setForm(updated);
    if (
      (key === "name" || key === "phone" || key === "email") &&
      touched[key as "name" | "phone" | "email"]
    ) {
      const err = TOUR_VALIDATORS[key as "name" | "phone" | "email"](
        val,
        updated,
      );
      setErrors((prev) => ({ ...prev, [key]: err ?? undefined }));
    }
    if (key === "preferredContact" && touched.email) {
      const err = TOUR_VALIDATORS.email(form.email, updated);
      setErrors((prev) => ({ ...prev, email: err ?? undefined }));
    }
  };

  const touch = (key: "name" | "phone" | "email") => {
    if (isLocked(key)) return;
    setTouched((prev) => ({ ...prev, [key]: true }));
    const err = TOUR_VALIDATORS[key](form[key], form);
    setErrors((prev) => ({ ...prev, [key]: err ?? undefined }));
  };

  const validateDetails = () => {
    const e: Partial<Record<"name" | "phone" | "email", string>> = {};
    (["name", "phone", "email"] as const).forEach((k) => {
      if (isLocked(k)) return;
      const err = TOUR_VALIDATORS[k](form[k], form);
      if (err) e[k] = err;
    });
    setErrors(e);
    setTouched({ name: true, phone: true, email: true });
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateDetails()) return;
    setStep("submitting");
    setSubmitError(null);
    try {
      const res = await fetch("/api/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: property.id,
          agent_id: property.agentId ?? null,
          tour_type: form.tourType,
          tour_date: form.date,
          tour_time: form.time,
          lead_name: form.name,
          lead_phone: form.phone.replace(/\D/g, "").replace(/^639/, "0"),
          lead_email: form.email || null,
          preferred_contact: form.preferredContact,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.errors
          ? Object.values(data.errors as Record<string, string[]>)
              .flat()
              .join(" ")
          : (data.error ?? data.message ?? "Failed to book tour.");
        setSubmitError(msg);
        setStep("details");
        return;
      }

      setStep("success");
    } catch {
      setSubmitError("Network error. Please try again.");
      setStep("details");
    }
  };

  const tourContactOptions: {
    value: TourForm["preferredContact"];
    label: string;
  }[] = [
    { value: "sms", label: "SMS" },
    { value: "viber", label: "Viber" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Call" },
  ];

  const selectedDate = dates.find((d) => d.value === form.date);
  const selectedTime = TIME_SLOTS.find((t) => t.value === form.time);

  const gcalLink =
    form.date && form.time
      ? (() => {
          const start = new Date(`${form.date}T${form.time}:00`);
          const end = new Date(start.getTime() + 60 * 60 * 1000);
          const fmt = (d: Date) =>
            d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
          return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Property Tour: ${property.title}`)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(`${form.tourType === "video" ? "Video" : "In-Person"} tour of ${property.title} at ${property.address}, ${property.city}`)}&location=${encodeURIComponent(`${property.address}, ${property.city}`)}`;
        })()
      : "#";

  const hasLockedFields =
    isLocked("name") || isLocked("phone") || isLocked("email");

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        {step === "pick-slot" && (
          <>
            <div style={s.header}>
              <div>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  Schedule a Tour
                </h2>
                <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                  Pick a date, time & tour type
                </p>
              </div>
              <button style={s.closeBtn} onClick={onClose}>
                <X size={18} color="#6b7280" />
              </button>
            </div>

            <div
              style={{
                padding: "12px 28px",
                background: "#fff8f8",
                borderBottom: "1px solid #fde8e8",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#111827",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {property.title}
                </p>
                <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                  📍 {property.address}, {property.city}
                </p>
              </div>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#c0392b",
                  flexShrink: 0,
                }}
              >
                {property.price}
              </span>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
              <div style={{ marginBottom: 22 }}>
                <label style={s.label}>Tour Type</label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  {(
                    [
                      {
                        value: "in-person",
                        label: "In-Person Visit",
                        sub: "Visit the actual property",
                        icon: <Home size={22} />,
                        badge: "Recommended",
                        badgeColor: "#16a34a",
                        badgeBg: "#dcfce7",
                      },
                      {
                        value: "video",
                        label: "Video Tour",
                        sub: "Viber / Messenger call",
                        icon: <Video size={22} />,
                        badge: "Great for OFWs",
                        badgeColor: "#2563eb",
                        badgeBg: "#dbeafe",
                      },
                    ] as const
                  ).map((opt) => {
                    const sel = form.tourType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => updateForm("tourType", opt.value)}
                        style={{
                          padding: "14px 16px",
                          borderRadius: 14,
                          cursor: "pointer",
                          textAlign: "left" as const,
                          border: sel
                            ? "2px solid #c0392b"
                            : "1.5px solid #e5e7eb",
                          background: sel ? "#fff5f5" : "#fafafa",
                          transition: "all 0.15s",
                          boxShadow: sel
                            ? "0 4px 14px rgba(192,57,43,0.1)"
                            : "none",
                        }}
                      >
                        <div
                          style={{
                            color: sel ? "#c0392b" : "#6b7280",
                            marginBottom: 8,
                          }}
                        >
                          {opt.icon}
                        </div>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: sel ? "#c0392b" : "#111827",
                            margin: "0 0 2px",
                          }}
                        >
                          {opt.label}
                        </p>
                        <p
                          style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}
                        >
                          {opt.sub}
                        </p>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: opt.badgeColor,
                            background: opt.badgeBg,
                            padding: "2px 7px",
                            borderRadius: 20,
                            marginTop: 6,
                            display: "inline-block",
                          }}
                        >
                          {opt.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 22 }}>
                <label style={s.label}>
                  <Calendar
                    size={13}
                    style={{
                      display: "inline",
                      marginRight: 5,
                      verticalAlign: "middle",
                    }}
                  />
                  Select Date{" "}
                  <span
                    style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}
                  >
                    (Sundays unavailable)
                  </span>
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    overflowX: "auto",
                    paddingBottom: 6,
                    paddingTop: 12,
                  }}
                >
                  {dates.map((d) => {
                    const sel = form.date === d.value;
                    return (
                      <button
                        key={d.value}
                        onClick={() => updateForm("date", d.value)}
                        style={{
                          flexShrink: 0,
                          width: 62,
                          paddingTop: 14,
                          paddingBottom: 10,
                          paddingLeft: 6,
                          paddingRight: 6,
                          borderRadius: 12,
                          cursor: "pointer",
                          textAlign: "center" as const,
                          border: sel
                            ? "2px solid #c0392b"
                            : "1.5px solid #e5e7eb",
                          background: sel
                            ? "#fff5f5"
                            : d.isPopular
                              ? "#fffbeb"
                              : "#fafafa",
                          transition: "all 0.15s",
                          position: "relative" as const,
                          boxShadow: sel
                            ? "0 4px 12px rgba(192,57,43,0.12)"
                            : "none",
                        }}
                      >
                        {d.isPopular && (
                          <span
                            style={{
                              position: "absolute",
                              top: -10,
                              left: "50%",
                              transform: "translateX(-50%)",
                              fontSize: 9,
                              fontWeight: 800,
                              color: "#fff",
                              background: "#f59e0b",
                              padding: "2px 7px",
                              borderRadius: 20,
                              whiteSpace: "nowrap" as const,
                            }}
                          >
                            🔥 Popular
                          </span>
                        )}
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: sel ? "#c0392b" : "#9ca3af",
                            margin: "0 0 2px",
                          }}
                        >
                          {d.day}
                        </p>
                        <p
                          style={{
                            fontSize: 18,
                            fontWeight: 800,
                            color: sel ? "#c0392b" : "#111827",
                            margin: "0 0 1px",
                          }}
                        >
                          {d.label.split(" ")[1]}
                        </p>
                        <p
                          style={{
                            fontSize: 10,
                            color: sel ? "#c0392b" : "#9ca3af",
                            margin: 0,
                          }}
                        >
                          {d.label.split(" ")[0]}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.date && (
                <div style={{ marginBottom: 8 }}>
                  <label style={s.label}>
                    <Clock
                      size={13}
                      style={{
                        display: "inline",
                        marginRight: 5,
                        verticalAlign: "middle",
                      }}
                    />
                    Select Time
                  </label>
                  {(["morning", "afternoon"] as const).map((period) => (
                    <div key={period} style={{ marginBottom: 12 }}>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#9ca3af",
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.06em",
                          marginBottom: 8,
                        }}
                      >
                        {period}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap" as const,
                        }}
                      >
                        {TIME_SLOTS.filter((t) => t.period === period).map(
                          (t) => {
                            const sel = form.time === t.value;
                            return (
                              <button
                                key={t.value}
                                onClick={() => updateForm("time", t.value)}
                                style={{
                                  padding: "9px 16px",
                                  borderRadius: 10,
                                  cursor: "pointer",
                                  fontSize: 13,
                                  fontWeight: sel ? 700 : 500,
                                  border: sel
                                    ? "2px solid #c0392b"
                                    : "1.5px solid #e5e7eb",
                                  background: sel ? "#fff5f5" : "#fafafa",
                                  color: sel ? "#c0392b" : "#374151",
                                  transition: "all 0.15s",
                                }}
                              >
                                {t.label}
                              </button>
                            );
                          },
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                padding: "18px 28px",
                borderTop: "1px solid #f0f0f0",
                flexShrink: 0,
                display: "flex",
                gap: 10,
              }}
            >
              <button style={s.secondaryBtn} onClick={onClose}>
                Cancel
              </button>
              <button
                style={s.primaryBtn(!canProceedSlot)}
                disabled={!canProceedSlot}
                onClick={() => setStep("details")}
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}

        {(step === "details" || step === "submitting") && (
          <>
            <div style={s.header}>
              <div>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  Your Details
                </h2>
                <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                  {form.tourType === "video"
                    ? "📹 Video Tour"
                    : "🏠 In-Person Visit"}{" "}
                  · {selectedDate?.label} · {selectedTime?.label}
                </p>
              </div>
              <button style={s.closeBtn} onClick={onClose}>
                <X size={18} color="#6b7280" />
              </button>
            </div>

            {submitError && (
              <div
                style={{
                  padding: "10px 28px",
                  background: "#fef2f2",
                  borderBottom: "1px solid #fecaca",
                  flexShrink: 0,
                }}
              >
                <p style={{ fontSize: 13, color: "#dc2626", margin: 0 }}>
                  ⚠ {submitError}
                </p>
              </div>
            )}

            <div
              style={{
                padding: "12px 28px",
                background: "#f0fdf4",
                borderBottom: "1px solid #bbf7d0",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: "#dcfce7",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {form.tourType === "video" ? (
                  <Video size={18} color="#16a34a" />
                ) : (
                  <Home size={18} color="#16a34a" />
                )}
              </div>
              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#15803d",
                    margin: 0,
                  }}
                >
                  {form.tourType === "video" ? "Video Tour" : "In-Person Visit"}{" "}
                  — {selectedDate?.day}, {selectedDate?.label} at{" "}
                  {selectedTime?.label}
                </p>
                <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>
                  {property.title}
                </p>
              </div>
              <button
                onClick={() => setStep("pick-slot")}
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  color: "#c0392b",
                  fontWeight: 600,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                Change
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
              {hasLockedFields && <LoggedInBanner />}

              <div style={{ marginBottom: 16 }}>
                <label style={s.label}>
                  Full Name <span style={{ color: "#ef4444" }}>*</span>
                  {isLocked("name") && (
                    <Lock
                      size={11}
                      color="#9ca3af"
                      style={{
                        display: "inline",
                        marginLeft: 5,
                        verticalAlign: "middle",
                      }}
                    />
                  )}
                </label>
                <div style={{ position: "relative" }}>
                  <User
                    size={14}
                    color={errors.name ? "#ef4444" : "#9ca3af"}
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                  <input
                    style={{
                      ...(isLocked("name")
                        ? s.readonlyInput
                        : s.input(!!errors.name)),
                      paddingLeft: 34,
                    }}
                    placeholder="Juan dela Cruz"
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    onBlur={() => touch("name")}
                    readOnly={isLocked("name")}
                    maxLength={60}
                  />
                  {(isLocked("name") ||
                    (form.name.trim().length > 1 &&
                      !errors.name &&
                      touched.name)) && (
                    <CheckCircle2
                      size={14}
                      color="#22c55e"
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    />
                  )}
                </div>
                {errors.name && (
                  <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>
                    ⚠ {errors.name}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={s.label}>
                  Phone Number <span style={{ color: "#ef4444" }}>*</span>
                  {isLocked("phone") && (
                    <Lock
                      size={11}
                      color="#9ca3af"
                      style={{
                        display: "inline",
                        marginLeft: 5,
                        verticalAlign: "middle",
                      }}
                    />
                  )}
                </label>
                <div style={{ position: "relative" }}>
                  <Phone
                    size={14}
                    color={errors.phone ? "#ef4444" : "#9ca3af"}
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                  <input
                    style={{
                      ...(isLocked("phone")
                        ? s.readonlyInput
                        : s.input(!!errors.phone)),
                      paddingLeft: 34,
                      paddingRight: 52,
                    }}
                    placeholder="09171234567"
                    value={form.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    onBlur={() => touch("phone")}
                    readOnly={isLocked("phone")}
                    type="tel"
                    maxLength={15}
                    inputMode="numeric"
                  />
                  <span
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 11,
                      fontWeight: 600,
                      color: isLocked("phone")
                        ? "#22c55e"
                        : phoneDigits === 11
                          ? "#22c55e"
                          : phoneDigits > 11
                            ? "#ef4444"
                            : "#9ca3af",
                    }}
                  >
                    {isLocked("phone") ? (
                      <CheckCircle2 size={14} color="#22c55e" />
                    ) : (
                      `${phoneDigits}/11`
                    )}
                  </span>
                </div>
                {errors.phone && (
                  <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>
                    ⚠ {errors.phone}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={s.label}>Confirm Tour Via</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {tourContactOptions.map((opt) => {
                    const sel = form.preferredContact === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() =>
                          updateForm("preferredContact", opt.value)
                        }
                        style={{
                          flex: 1,
                          padding: "10px 6px",
                          borderRadius: 10,
                          cursor: "pointer",
                          border: sel
                            ? "2px solid #c0392b"
                            : "1.5px solid #e5e7eb",
                          background: sel ? "#fff5f5" : "#fafafa",
                          fontSize: 12,
                          fontWeight: sel ? 700 : 500,
                          color: sel ? "#c0392b" : "#6b7280",
                          transition: "all 0.15s",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.preferredContact === "email" && (
                <div style={{ marginBottom: 16 }}>
                  <label style={s.label}>
                    Email Address <span style={{ color: "#ef4444" }}>*</span>
                    {isLocked("email") && (
                      <Lock
                        size={11}
                        color="#9ca3af"
                        style={{
                          display: "inline",
                          marginLeft: 5,
                          verticalAlign: "middle",
                        }}
                      />
                    )}
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail
                      size={14}
                      color={errors.email ? "#ef4444" : "#9ca3af"}
                      style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    />
                    <input
                      style={{
                        ...(isLocked("email")
                          ? s.readonlyInput
                          : s.input(!!errors.email)),
                        paddingLeft: 34,
                      }}
                      placeholder="juan@email.com"
                      value={form.email}
                      onChange={(e) => updateForm("email", e.target.value)}
                      onBlur={() => touch("email")}
                      readOnly={isLocked("email")}
                      type="email"
                      maxLength={100}
                    />
                    {(isLocked("email") ||
                      (form.email.trim().length > 0 &&
                        !errors.email &&
                        touched.email)) && (
                      <CheckCircle2
                        size={14}
                        color="#22c55e"
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                        }}
                      />
                    )}
                  </div>
                  {errors.email && (
                    <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>
                      ⚠ {errors.email}
                    </p>
                  )}
                </div>
              )}

              <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6 }}>
                🔒 Your details are only used to confirm this tour booking.
              </p>
            </div>

            <div
              style={{
                padding: "18px 28px",
                borderTop: "1px solid #f0f0f0",
                flexShrink: 0,
                display: "flex",
                gap: 10,
              }}
            >
              <button
                style={s.secondaryBtn}
                onClick={() => setStep("pick-slot")}
                disabled={step === "submitting"}
              >
                ← Back
              </button>
              <button
                style={s.primaryBtn(step === "submitting")}
                onClick={handleSubmit}
                disabled={step === "submitting"}
              >
                {step === "submitting" ? (
                  <>
                    <Loader2
                      size={16}
                      style={{ animation: "spin 1s linear infinite" }}
                    />{" "}
                    Booking…
                  </>
                ) : (
                  <>
                    Confirm Tour <CheckCircle2 size={16} />
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {step === "success" && (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "32px 28px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 68,
                height: 68,
                background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                boxShadow: "0 8px 24px rgba(16,185,129,0.2)",
              }}
            >
              <CheckCircle2 size={34} color="#059669" />
            </div>
            <h3
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#111827",
                marginBottom: 6,
              }}
            >
              Tour Booked! 🎉
            </h3>
            <p
              style={{
                fontSize: 14,
                color: "#6b7280",
                maxWidth: 320,
                lineHeight: 1.7,
                marginBottom: 20,
              }}
            >
              Your{" "}
              {form.tourType === "video" ? "video tour" : "in-person visit"} for{" "}
              <strong style={{ color: "#111827" }}>
                {selectedDate?.day}, {selectedDate?.label} at{" "}
                {selectedTime?.label}
              </strong>{" "}
              has been submitted. We'll confirm via{" "}
              <strong style={{ color: "#111827" }}>
                {form.preferredContact.toUpperCase()}
              </strong>
              .
            </p>
            <a
              href={gcalLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px",
                border: "1.5px solid #e5e7eb",
                borderRadius: 12,
                marginBottom: 10,
                background: "#fff",
                fontSize: 14,
                fontWeight: 600,
                color: "#374151",
                textDecoration: "none",
              }}
            >
              📅 Add to Google Calendar
            </a>
            <button
              onClick={onClose}
              style={{
                ...s.primaryBtn(false),
                width: "100%",
                flex: "none" as any,
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function PropertyDetailsPage({
  params,
  source = "developer",
}: {
  params: Promise<{ id: string }>;
  source?: "developer" | "property";
}) {
  const { id } = use(params);
  const [property, setProperty] = useState<PropertySnapshot | null>(null);
  const [relatedProperties, setRelatedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [videoIndex, setVideoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "gallery" | "videos" | "details" | "offerings"
  >("details");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [videoLightboxOpen, setVideoLightboxOpen] = useState(false);
  // ── Unit-offer-photo lightbox (independent from the main gallery lightbox) ──
  const [unitLightboxOpen, setUnitLightboxOpen] = useState(false);
  const [unitLightboxIndex, setUnitLightboxIndex] = useState(0);
  // ── Which Unit Details field/category is currently selected for the
  // Unit Photos panel below it. Defaults to the first available category
  // (e.g. "Residential Type") until the user clicks a different card. ──
  const [selectedUnitCategory, setSelectedUnitCategory] = useState<
    string | null
  >(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const fetchRelatedProperties = useCallback(
    async (currentProperty: Property) => {
      setRelatedLoading(true);
      try {
        const params = new URLSearchParams();
        if (
          currentProperty.bedrooms !== null &&
          currentProperty.bedrooms !== undefined
        ) {
          params.append("bedrooms", String(currentProperty.bedrooms));
        }
        if (currentProperty.listing_type)
          params.append("listing_type", currentProperty.listing_type);
        if (currentProperty.city) params.append("city", currentProperty.city);
        params.append("exclude_id", String(currentProperty.id));

        const res = await fetch(`/api/properties?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          let properties = [];
          if (Array.isArray(data)) properties = data;
          else if (data.data && Array.isArray(data.data))
            properties = data.data;
          else if (data.properties && Array.isArray(data.properties))
            properties = data.properties;
          setRelatedProperties(
            properties.filter((p: any) => p.id !== currentProperty.id),
          );
        }
      } catch (error) {
        console.error("Failed to fetch related properties:", error);
        setRelatedProperties([]);
      } finally {
        setRelatedLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const endpoint =
          source === "property"
            ? `/api/properties/${id}`
            : `/api/developers-properties/${id}`;

        const res = await fetch(endpoint);
        if (!res.ok) {
          setProperty(null);
          return;
        }
        const data = await res.json();
        console.log("DEVELOPER PROPERTY RAW:", data);
        setProperty(data);
        fetchRelatedProperties(data);
      } catch {
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id, fetchRelatedProperties, source]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "ArrowRight")
        setImageIndex((prev) => (prev + 1) % images.length);
      if (e.key === "ArrowLeft")
        setImageIndex((prev) => (prev - 1 + images.length) % images.length);
      if (e.key === "Escape") setLightboxOpen(false);
    },
    [lightboxOpen],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ── Lock background scroll while any lightbox is open ─────────────────────
  useEffect(() => {
    if (lightboxOpen || videoLightboxOpen || unitLightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, videoLightboxOpen, unitLightboxOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVideoLightboxOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // ── Keyboard nav for the unit-offer-photo lightbox ────────────────────────
  useEffect(() => {
    const handleUnitKeyDown = (e: KeyboardEvent) => {
      if (!unitLightboxOpen) return;
      if (e.key === "Escape") setUnitLightboxOpen(false);
      if (e.key === "ArrowRight")
        setUnitLightboxIndex(
          (prev) => (prev + 1) % Math.max(allUnitPhotosLength, 1),
        );
      if (e.key === "ArrowLeft")
        setUnitLightboxIndex(
          (prev) =>
            (prev - 1 + Math.max(allUnitPhotosLength, 1)) %
            Math.max(allUnitPhotosLength, 1),
        );
    };
    window.addEventListener("keydown", handleUnitKeyDown);
    return () => window.removeEventListener("keydown", handleUnitKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitLightboxOpen]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="glass rounded-xl h-96 animate-pulse" />
      </div>
    );
  }

  const handleShare = async () => {
    const shareData = {
      title: property?.title,
      text: `${property?.title} — ${priceDisplay}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  if (!property) {
    const backHref = source === "property" ? "/properties" : "/developer";
    const backLabel =
      source === "property"
        ? "Back to Properties"
        : "Back to Developer Properties";

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-16">
        <div className="text-center glass rounded-xl p-12">
          <p className="text-lg text-muted-foreground mb-4">
            Property not found
          </p>
          <Link href={backHref}>
            <Button className="bg-primary hover:bg-primary/90">
              {backLabel}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Normalise tags ─────────────────────────────────────────────────────────
  const rawTags: any[] = (property as any)?.tags ?? [];
  const tags = rawTags
    .filter((t: any) => t && (t.active ?? true))
    .map((t: any, idx: number) => ({
      id: idx,
      label: typeof t === "string" ? t : (t?.label ?? ""),
      color: typeof t === "string" ? "red" : (t?.color ?? "red"),
    }))
    .filter((t) => t.label);

  // ── Normalise images ──────────────────────────────────────────────────────
  const rawImages: any[] = (property as any).images ?? [];
  const images: string[] = rawImages
    .map((img: any) => {
      const raw =
        typeof img === "string"
          ? img
          : (img?.url ?? img?.path ?? img?.image_url ?? "");
      return raw ? imgUrl(String(raw)) : "";
    })
    .filter(Boolean);

  if (images.length === 0) {
    const thumb = (property as any).thumbnail ?? (property as any).image ?? "";
    if (thumb) images.push(imgUrl(String(thumb)));
  }

  const blurHash: string = (property as any).blur_hash ?? "";
  const currentImage = images[imageIndex] ?? "/placeholder-property.jpg";

  const nextImage = () => setImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () =>
    setImageIndex((prev) => (prev - 1 + images.length) % images.length);

  // ── Normalise videos ───────────────────────────────────────────────────────
  const rawVideos: any[] = (property as any).videos ?? [];
  const videos: string[] = rawVideos
    .map((v: any) =>
      typeof v === "string" ? v : (v?.url ?? v?.path ?? v?.video_url ?? ""),
    )
    .filter(Boolean);
  const hasVideo = videos.length > 0;
  const currentVideo = videos[videoIndex] ? imgUrl(videos[videoIndex]) : "";

  const nextVideo = () => setVideoIndex((prev) => (prev + 1) % videos.length);
  const prevVideo = () =>
    setVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);

  const openLightboxAt = (idx: number) => {
    setImageIndex(idx);
    setLightboxOpen(true);
  };

  // ── Normalise unit offerings ──────────────────────────────────────────────
  const rawUnitOfferings: any[] =
    (property as any).unit_offerings ??
    (property as any).unitOfferings ??
    (property as any).units ??
    [];

  const listingType =
    (property as any).listing_type ?? (property as any).listingType;

  // ── Normalise financing options ──────────────────────────────────────────
  // `financing_option` comes back from the backend as a real array (when
  // show() has already json_decode()'d it) or occasionally as a raw JSON
  // string, depending on the endpoint — handle both the same way tags/
  // images/videos are handled elsewhere in this file.
  const rawFinancing: any = (property as any).financing_option ?? [];
  const financingOptions: string[] = Array.isArray(rawFinancing)
    ? rawFinancing.filter((f: any) => typeof f === "string")
    : typeof rawFinancing === "string"
      ? (() => {
          const trimmed = rawFinancing.trim();
          if (!trimmed) return [];
          try {
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed)
              ? parsed.filter((f: any) => typeof f === "string")
              : [];
          } catch {
            return [];
          }
        })()
      : [];

  // ── Unit-type-specific details ──────────────────────────────────────────
  // There's no separate "units" table — each Property/DeveloperProperty row
  // IS one unit type, with fields that vary by property_type
  // (residential / office_space / commercial). Pull straight from those.
  const propertyType = String(
    (property as any).property_type ?? (property as any).propertyType ?? "",
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  const propertyTypeLabel = propertyType.replace(/_/g, " ");

  // `key` links a unit-detail field to the matching `unit_offer_images`
  // category (see UNIT_PHOTO_FIELDS above) so clicking the card can filter
  // the Unit Photos panel below it. Fields without a matching photo
  // category (e.g. generic "property" source fields) simply omit `key`
  // and render as non-clickable, exactly as before.
  const unitTypeFields: { label: string; value: string; key?: string }[] =
    (() => {
      const p = property as any;

      // "property" source → plain Property model. Regular listings only
      // ever offer one "unit" (the listing itself), so they're treated as
      // the `residential` category — the same one used for developer
      // properties — so uploaded `unit_offer_images` line up the same way.
      if (source === "property") {
        return [
          {
            label: "Property Type",
            value: p.property_type
              ? String(p.property_type).replace(/_/g, " ")
              : "—",
            key: "residential_type",
          },
          {
            label: "Bedroom Type",
            value: p.bedrooms != null ? String(p.bedrooms) : "—",
            key: "bedroom_type",
          },
          {
            label: "Bathrooms",
            value: p.bathrooms != null ? String(p.bathrooms) : "—",
            key: "bathrooms",
          },
          { label: "Area (sqm)", value: p.area ?? "—", key: "area" },
          {
            label: "Floor Level",
            value: p.floor_level ?? "—",
            key: "floor_level",
          },
          {
            label: "Furnished",
            value: p.furnished ?? "—",
            key: "furnished",
          },
          {
            label: "Year Built",
            value: p.year_built != null ? String(p.year_built) : "—",
          key: "year_built",  
         },
          {
            label: "Listing Type",
            value: p.listing_type === "rent" ? "For Rent" : "For Sale",
          key: "listing_type",  
          },
        ].filter((f) => f.value !== "—");
      }
      if (source === "developer") {
        // "developer" source → developer-property model with
        // residential/office_space/commercial-specific fields.
        if (propertyType === "residential") {
          return [
            {
              label: "Resedential Type",
              value: p.residential_type ?? "—",
              key: "residential_type",
            },
            {
              label: "Bedroom Type",
              value: p.bedroom_type ?? "—",
              key: "bedroom_type",
            },
            {
              label: "Bathrooms",
              value: p.bathrooms != null ? String(p.bathrooms) : "—",
              key: "bathrooms",
            },
            { label: "Area (sqm)", value: p.area ?? "—", key: "area" },
            {
              label: "Floor Level",
              value: p.floor_level ?? "—",
              key: "floor_level",
            },
            {
              label: "Furnished",
              value: p.furnished ?? "—",
              key: "furnished",
            },
            {
              label: "Parking Slots",
              value: p.parking_slots != null ? String(p.parking_slots) : "—",
              key: "parking_slots",
            },
          ].filter((f) => f.value !== "—");
        }

        if (propertyType === "office_space") {
          return [
            {
              label: "Office Type",
              value: p.office_space_type ?? "—",
              key: "office_space_type",
            },
            {
              label: "Office Name",
              value: p.office_space_name ?? "—",
              key: "office_space_name",
            },
            {
              label: "Area (sqm)",
              value: p.office_area ?? "—",
              key: "office_area",
            },
            {
              label: "Floor",
              value: p.office_floor ?? "—",
              key: "office_floor",
            },
            {
              label: "Internet",
              value: p.office_internet ?? "—",
              key: "office_internet",
            },
          ].filter((f) => f.value !== "—");
        }

        if (propertyType === "commercial") {
          return [
            {
              label: "Commercial Type",
              value: p.commercial_type ?? "—",
              key: "commercial_type",
            },
            {
              label: "Name",
              value: p.commercial_name ?? "—",
              key: "commercial_name",
            },
            {
              label: "Area (sqm)",
              value: p.commercial_area ?? "—",
              key: "commercial_area",
            },
            {
              label: "Frontage",
              value: p.commercial_frontage ?? "—",
              key: "commercial_frontage",
            },
            {
              label: "Floor Level",
              value: p.commercial_floor_level ?? "—",
              key: "commercial_floor_level",
            },
          ].filter((f) => f.value !== "—");
        }
      }

      return [];
    })();

  // ── Unit offering photos (ported from AdminDevelopersPage) ──────────────
  // Grouped per input field (Bedroom Type, Area, Floor Level, ...) so the
  // photos line up with the same labels an admin sees when uploading them.
  const unitPhotos = mapUnitOfferImagesToPhotos(
    (property as any).unit_offer_images,
  );
  // Regular ("property" source) listings don't carry a residential /
  // office_space / commercial `property_type` value the way developer
  // properties do, so `UNIT_PHOTO_FIELDS[propertyType]` would always miss
  // for them — fall back to the `residential` field set in that case,
  // since that's the only shape a regular listing can offer.
  const unitPhotoFields =
    UNIT_PHOTO_FIELDS[propertyType] ??
    (source === "property" ? UNIT_PHOTO_FIELDS.residential : []);

  // ── Flattened unit photo list, in the same order they're rendered below,
  // used to drive the dedicated unit-offer-photo lightbox (independent of
  // the main gallery lightbox, since these images usually aren't part of
  // the main `images` array at all).
  const allUnitPhotos = unitPhotoFields.flatMap(({ key }) =>
    unitPhotos.filter((p) => p.category === key),
  );
  const allUnitPhotosLength = allUnitPhotos.length;

  // ── Active category driving the Unit Photos panel. Defaults to the
  // first unit-detail field that has a photo-category `key` (e.g.
  // "Resedential Type") so those images show first, exactly like the
  // reference screenshot. Clicking any other card with a `key` swaps
  // this, and the photo grid below updates to match. ──
  const activeUnitCategory: string | null =
    selectedUnitCategory ??
    unitTypeFields.find((f) => f.key)?.key ??
    unitPhotoFields[0]?.key ??
    null;

  const activeCategoryPhotos = activeUnitCategory
    ? unitPhotos.filter((p) => p.category === activeUnitCategory)
    : [];

  const activeCategoryLabel =
    unitTypeFields.find((f) => f.key === activeUnitCategory)?.label ??
    unitPhotoFields.find((f) => f.key === activeUnitCategory)?.label ??
    "";

  const openUnitLightboxAt = (idx: number) => {
    setUnitLightboxIndex(idx);
    setUnitLightboxOpen(true);
  };
  const nextUnitPhoto = () =>
    setUnitLightboxIndex((prev) => (prev + 1) % allUnitPhotos.length);
  const prevUnitPhoto = () =>
    setUnitLightboxIndex(
      (prev) => (prev - 1 + allUnitPhotos.length) % allUnitPhotos.length,
    );
  const currentUnitPhoto = allUnitPhotos[unitLightboxIndex];

  const priceDisplay = (() => {
    const price =
      listingType === "rent"
        ? ((property as any).price_per_month ?? (property as any).pricePerMonth)
        : (property as any).price;
    return formatPrice(price) + (listingType === "rent" ? "/month" : "");
  })();

  const propertyId = Number(property.id);

  const thumbUrls = images;

  // Collage: video (or 1st image) big on the left, next 4 images in a 2x2 grid.
  const collageImages = images.slice(hasVideo ? 0 : 1, hasVideo ? 4 : 5);
  const remainingCount =
    images.length -
    (hasVideo ? collageImages.length : collageImages.length + 1);

  // ── Lightbox JSX (rendered via portal so it escapes the blurred wrapper) ──
  const imageLightbox = lightboxOpen && (
    <div
      className="fixed inset-0 h-screen w-screen overflow-hidden z-[9999] flex items-center justify-center p-4"
      onClick={() => setLightboxOpen(false)}
      style={{ background: "rgba(20, 8, 8, 0.97)" }}
    >
      <button
        onClick={() => setLightboxOpen(false)}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors z-10"
      >
        <X className="w-5 h-5" />
      </button>

      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium z-10">
          {imageIndex + 1} / {images.length}
        </div>
      )}

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Content: sized to fit viewport, image keeps its own ratio via object-contain */}
      <div
        className="relative flex items-center justify-center w-full h-full max-w-6xl mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full max-h-[85vh] flex items-center justify-center">
          <Image
            src={currentImage}
            alt={property.title}
            width={1600}
            height={1200}
            sizes="90vw"
            priority
            unoptimized
            className="w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[80vw] px-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setImageIndex(idx);
              }}
              className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 relative transition-all ${idx === imageIndex ? "border-white" : "border-white/20 opacity-40 hover:opacity-80"}`}
            >
              <Image
                src={thumbUrls[idx]}
                alt=""
                fill
                sizes="56px"
                loading="lazy"
                placeholder="blur"
                blurDataURL={blurHash || BLUR_PLACEHOLDER}
                unoptimized
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const videoLightbox = videoLightboxOpen && hasVideo && (
    <div
      className="fixed inset-0 h-screen w-screen overflow-hidden z-[9999] flex items-center justify-center p-4"
      onClick={() => setVideoLightboxOpen(false)}
      style={{ background: "rgba(20, 8, 8, 0.97)" }}
    >
      <button
        onClick={() => setVideoLightboxOpen(false)}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors z-10"
      >
        <X className="w-5 h-5" />
      </button>
      {videos.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium z-10">
          {videoIndex + 1} / {videos.length}
        </div>
      )}
      {videos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevVideo();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextVideo();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
      <div
        className="relative w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <video
          key={currentVideo}
          src={currentVideo}
          controls
          autoPlay
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );

  // ── Unit-offer-photo lightbox (portaled, independent nav/state from the
  // main gallery lightbox above) ────────────────────────────────────────────
  const unitPhotoLightbox = unitLightboxOpen && currentUnitPhoto && (
    <div
      className="fixed inset-0 h-screen w-screen overflow-hidden z-[9999] flex items-center justify-center p-4"
      onClick={() => setUnitLightboxOpen(false)}
      style={{ background: "rgba(20, 8, 8, 0.97)" }}
    >
      <button
        onClick={() => setUnitLightboxOpen(false)}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors z-10"
      >
        <X className="w-5 h-5" />
      </button>

      {allUnitPhotos.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium z-10">
          {unitLightboxIndex + 1} / {allUnitPhotos.length}
        </div>
      )}

      {allUnitPhotos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevUnitPhoto();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextUnitPhoto();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <div
        className="relative flex flex-col items-center justify-center w-full h-full max-w-6xl mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full max-h-[80vh] flex items-center justify-center">
          <Image
            src={currentUnitPhoto.url}
            alt={currentUnitPhoto.category}
            width={1600}
            height={1200}
            sizes="90vw"
            unoptimized
            className="w-auto h-auto max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
        <p className="mt-3 text-white/80 text-sm font-medium capitalize">
          {currentUnitPhoto.category.replace(/_/g, " ")}
        </p>
      </div>

      {allUnitPhotos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[80vw] px-2">
          {allUnitPhotos.map((photo, idx) => (
            <button
              key={photo.id}
              onClick={(e) => {
                e.stopPropagation();
                setUnitLightboxIndex(idx);
              }}
              className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 relative transition-all ${idx === unitLightboxIndex ? "border-white" : "border-white/20 opacity-40 hover:opacity-80"}`}
            >
              <Image
                src={photo.url}
                alt=""
                fill
                sizes="56px"
                loading="lazy"
                unoptimized
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full mt-16 bg-gradient-to-b from-red-800/30 from-[40%] via-[#8b1a1a]/80 via-[70%] to-red-500/60 to-[100%] backdrop-blur-sm">
      {/* ── Developer Inquiry Modal ── */}
      {source === "developer" && (
        <DeveloperInquiryModal
          isOpen={showInquiryModal}
          onClose={() => setShowInquiryModal(false)}
          propertyId={propertyId}
          propertyTitle={property.title}
        />
      )}

      {source === "property" && showContactModal && (
        <ContactAgentModal
          onClose={() => setShowContactModal(false)}
          property={property}
          listedAgent={(property as any).agent ?? null}
        />
      )}

      {source === "property" && showTourModal && (
        <ScheduleTourModal
          onClose={() => setShowTourModal(false)}
          property={property}
        />
      )}

      {/* ── Image, Video, and Unit Photo Lightboxes (portaled to body to escape backdrop-blur ancestor) ── */}
      {mounted && imageLightbox && createPortal(imageLightbox, document.body)}
      {mounted && videoLightbox && createPortal(videoLightbox, document.body)}
      {mounted &&
        unitPhotoLightbox &&
        createPortal(unitPhotoLightbox, document.body)}

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-7 pb-2">
        <Link
          href={source === "property" ? "/properties" : "/developer"}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
        >
          <ChevronLeft className="w-4 h-4" />
          {source === "property"
            ? "Back to Properties"
            : "Back to Developer Properties"}
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* ── HERO COLLAGE (full width, images & videos on top) ── */}
        <div className="glass rounded-xl p-7 mb-6">
          <div className="grid grid-cols-4 grid-rows-2 gap-3 h-[280px] sm:h-[360px] lg:h-[440px]">
            {/* ── Card 1: big left card — video (with play button) or first image ── */}
            <div
              className="relative col-span-2 row-span-2 overflow-hidden cursor-pointer group shadow-sm"
              onClick={() =>
                hasVideo ? setVideoLightboxOpen(true) : openLightboxAt(0)
              }
            >
              <Image
                src={images[0] ?? "/placeholder-property.jpg"}
                alt={`${property.title} - main`}
                fill
                sizes="(max-width: 1024px) 50vw, 33vw"
                priority
                placeholder="blur"
                blurDataURL={blurHash || BLUR_PLACEHOLDER}
                unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {hasVideo && (
                <>
                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Play className="w-7 h-7 sm:w-9 sm:h-9 text-red-800 fill-red-800 ml-1" />
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5" />
                    {videos.length > 1 ? `${videos.length} videos` : "Video"}
                  </div>
                </>
              )}
            </div>

            {/* ── Cards 2–5: right 2x2 grid of images ── */}
            {[0, 1, 2, 3].map((slot) => {
              const img = collageImages[slot];
              const isLastVisibleSlot = slot === 3;
              if (!img) {
                return (
                  <div key={slot} className="relative rounded-xl bg-muted/40" />
                );
              }
              return (
                <div
                  key={slot}
                  className="relative overflow-hidden cursor-pointer group shadow-sm"
                  onClick={() =>
                    openLightboxAt(
                      images.indexOf(img) >= 0 ? images.indexOf(img) : 0,
                    )
                  }
                >
                  <Image
                    src={img}
                    alt={`${property.title} - ${slot + 2}`}
                    fill
                    sizes="(max-width: 1054px) 45vw, 34vw"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL={blurHash || BLUR_PLACEHOLDER}
                    unoptimized
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {isLastVisibleSlot && remainingCount > 0 && (
                    <div className="absolute bottom-3 right-3 bg-white/85 group-hover:bg-white/95 backdrop-blur-sm py-2 px-3 rounded-lg flex items-center gap-1.5 shadow-md transition-colors">
                      <Grid3x3 className="w-5 h-5 text-black" />
                      <span className="text-black text-xs sm:text-sm font-bold uppercase">
                        See all {images.length} photos
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── TAB NAVIGATION (full width) ── */}
        <div className="glass rounded-xl p-2 flex items-center gap-1 overflow-x-auto border-b border-border mb-6">
          <button
            onClick={() => setActiveTab("details")}
            className={`flex items-center gap-2 px-4 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === "details"
                ? "rounded-lg text-white"
                : "rounded-lg border-b-2 border-transparent text-white/60 hover:text-white"
            }`}
            style={
              activeTab === "details"
                ? { backgroundColor: "rgb(161, 46, 46)" }
                : undefined
            }
          >
            <Home className="w-5 h-5" />
            Details
          </button>

          <button
            onClick={() => setActiveTab("gallery")}
            className={`flex items-center gap-2 px-4 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === "gallery"
                ? "rounded-lg text-white"
                : "rounded-lg border-b-2 border-transparent text-white/60 hover:text-white"
            }`}
            style={
              activeTab === "gallery"
                ? { backgroundColor: "rgb(161, 46, 46)" }
                : undefined
            }
          >
            <ImageIcon className="w-5 h-5" />
            Photos
            <span className="ml-1 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">
              {images.length}
            </span>
          </button>

          {videos.length > 0 && (
            <button
              onClick={() => setActiveTab("videos")}
              className={`flex items-center gap-2 px-4 py-3 font-semibold transition whitespace-nowrap ${
                activeTab === "videos"
                  ? "rounded-lg text-white"
                  : "rounded-lg border-b-2 border-transparent text-white/60 hover:text-white"
              }`}
              style={
                activeTab === "videos"
                  ? { backgroundColor: "rgb(161, 46, 46)" }
                  : undefined
              }
            >
              <Video className="w-5 h-5" />
              Videos
              <span className="ml-1 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">
                {videos.length}
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("offerings")}
            className={`flex items-center gap-2 px-4 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === "offerings"
                ? "rounded-lg text-white"
                : "rounded-lg border-b-2 border-transparent text-white/60 hover:text-white"
            }`}
            style={
              activeTab === "offerings"
                ? { backgroundColor: "rgb(161, 46, 46)" }
                : undefined
            }
          >
            <Building2 className="w-5 h-5" />
            Unit Offerings
            {unitTypeFields.length > 0 && (
              <span className="ml-1 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">
                {unitTypeFields.length}
              </span>
            )}
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              className="inline-flex w-fit h-[100%] shrink-0 items-center px-3 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-white"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              {shareCopied ? "✓ Link Copied!" : "Share"}
            </button>

            {source === "developer" ? (
              <Button
                className="inline-flex w-fit h-[100%] shrink-0 items-center px-3 py-2.5 bg-blue-700 hover:bg-blue-600 text-white"
                onClick={() => setShowInquiryModal(true)}
              >
                <Phone className="w-4 h-4 mr-2" />
                Book An Appointment
              </Button>
            ) : (
              <>
                <Button
                  className="inline-flex w-fit h-[100%] shrink-0 items-center px-3 py-2.5 bg-red-600 hover:bg-red-500 text-white"
                  onClick={() => setShowContactModal(true)}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Agent
                </Button>
                <Button
                  className="inline-flex w-fit h-[100%] shrink-0 items-center px-3 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950"
                  onClick={() => setShowTourModal(true)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Tour
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ── INFO SECTION: details/tabs on the left, pricing + agent on the right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Main Content ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* ── GALLERY TAB ── */}
            {activeTab === "gallery" && (
              <div className="glass rounded-xl p-5">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm font-semibold text-foreground">
                    Photo Gallery
                  </p>
                  {images.length > 2 && (
                    <div className="flex gap-2">
                      <button
                        onClick={prevImage}
                        className="p-2 hover:bg-muted rounded-lg transition"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="p-2 hover:bg-muted rounded-lg transition"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Two-image set that changes with chevrons */}
                <div className="grid grid-cols-2 gap-3">
                  {images.slice(imageIndex, imageIndex + 2).map((_, offset) => {
                    const idx = imageIndex + offset;
                    return (
                      <div
                        key={idx}
                        className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-primary ring-2 ring-primary/20"
                      >
                        <Image
                          src={thumbUrls[idx]}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 50vw, 250px"
                          loading="lazy"
                          placeholder="blur"
                          blurDataURL={blurHash || BLUR_PLACEHOLDER}
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Optional: position indicator dots (one per set) */}
                {images.length > 2 && (
                  <div className="flex justify-center gap-1.5 mt-3">
                    {Array.from({ length: Math.ceil(images.length / 2) }).map(
                      (_, setIdx) => (
                        <button
                          key={setIdx}
                          onClick={() => setImageIndex(setIdx * 2)}
                          className={`h-1.5 rounded-full transition-all ${
                            Math.floor(imageIndex / 2) === setIdx
                              ? "w-4 bg-primary"
                              : "w-1.5 bg-border hover:bg-muted-foreground"
                          }`}
                        />
                      ),
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── VIDEOS TAB ── */}
            {activeTab === "videos" && videos.length > 0 && (
              <div className="glass rounded-xl p-6 sm:p-8">
                {videos.length > 1 && (
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">
                      Video {videoIndex + 1} of {videos.length}
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={prevVideo}
                        className="p-2.5 hover:bg-muted rounded-lg transition"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextVideo}
                        className="p-2.5 hover:bg-muted rounded-lg transition"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="rounded-xl overflow-hidden bg-black aspect-video">
                  <video
                    src={currentVideo}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* ── UNIT OFFERINGS TAB ── */}
            {activeTab === "offerings" && (
              <div className="space-y-6">
                {unitTypeFields.length > 0 && (
                  <div className="glass rounded-xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold">Unit Details</h2>
                      <span className="text-sm text-muted-foreground capitalize">
                        {propertyTypeLabel}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {unitTypeFields.map((f) => {
                        const clickable = !!f.key;
                        const isActive =
                          clickable && f.key === activeUnitCategory;
                        return (
                          <button
                            key={f.label}
                            type="button"
                            disabled={!clickable}
                            onClick={() =>
                              clickable && setSelectedUnitCategory(f.key!)
                            }
                            className={`text-left rounded-lg border p-3 transition ${
                              clickable ? "cursor-pointer" : "cursor-default"
                            } ${
                              isActive
                                ? "bg-white/15 border-white/40 ring-2 ring-white/30"
                                : "bg-muted/50 border-border/10 hover:bg-muted/70"
                            }`}
                          >
                            <p className="text-[11px] text-muted-foreground mb-1">
                              {f.label}
                            </p>
                            <p className="text-sm font-bold text-foreground">
                              {f.value}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Unit Photos (ported from AdminDevelopersPage's ViewModal "Units" tab) ──
                     Now filtered to whichever Unit Details card is
                     currently selected above (defaulting to the first
                     photo-bearing field, e.g. "Resedential Type"), instead
                     of listing every category at once. Clicking a photo
                     still opens the dedicated `unitPhotoLightbox`, which
                     pages through the FULL `allUnitPhotos` list regardless
                     of the active filter. Works the same for both
                     `source === "developer"` and `source === "property"`. ── */}
                {unitPhotoFields.length > 0 && (
                  <div className="glass rounded-xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold">Unit Photos</h2>
                      {activeCategoryLabel && (
                        <span className="text-sm text-muted-foreground">
                          {activeCategoryLabel}
                        </span>
                      )}
                    </div>

                    {activeCategoryPhotos.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {activeCategoryPhotos.map((photo) => (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() => {
                              const idx = allUnitPhotos.findIndex(
                                (p) => p.id === photo.id,
                              );
                              openUnitLightboxAt(idx >= 0 ? idx : 0);
                            }}
                            className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/20 group"
                          >
                            <Image
                              src={photo.url}
                              alt={activeCategoryLabel}
                              fill
                              sizes="(max-width: 768px) 33vw, 200px"
                              loading="lazy"
                              unoptimized
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-white/40">No images</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── DETAILS TAB ── */}
            {activeTab === "details" && (
              <div className="space-y-5">
                {/* Property Header */}
                <div className="glass rounded-2xl border border-border/20 bg-gradient-to-br from-background to-muted/30 p-6 sm:p-7">
                  <div className="space-y-4">
                    {/* Title */}
                    <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-balance">
                      {property.title}
                    </h1>

                    {/* Location */}
                    <div className="flex items-start gap-3 text-muted-foreground">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

                      <div className="min-w-0">
                        <p className="font-medium leading-snug text-foreground">
                          {property.address}
                        </p>

                        <p className="mt-1 text-sm">
                          {property.city}
                          {(property as any).state
                            ? `, ${(property as any).state}`
                            : ""}{" "}
                          {(property as any).zip_code ??
                            (property as any).zipCode ??
                            ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      {/* Listing Type */}
                      <div
                        className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
                          property.listing_type === "rent"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {property.listing_type === "rent"
                          ? "For Rent"
                          : "For Sale"}
                      </div>

                      {tags.length > 0 && (
                        <div className="inline-flex w-fit items-center flex-wrap gap-1.5 justify-end max-w-[70%]">
                          {tags.map((tag) => (
                            <span
                              key={tag.id}
                              className={`text-[11px] font-bold px-3.5 py-1.5 rounded-full backdrop-blur-sm shadow-sm ${tagColorClasses(tag.color)}`}
                            >
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {(property as any).description && (
                  <div className="glass rounded-2xl border border-border/20 p-6 sm:p-7">
                    <div className="space-y-3">
                      <h2 className="text-xl sm:text-2xl font-bold">
                        About this property
                      </h2>

                      <p className="text-sm sm:text-base leading-7 text-muted-foreground">
                        {(property as any).description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Visibility Map */}
                {(property as any).visibility_map && (
                  <div className="glass rounded-2xl border border-border/20 p-6 sm:p-7">
                    <h2 className="mb-5 text-xl sm:text-2xl font-bold">
                      Location Map
                    </h2>
                    <div className="rounded-xl overflow-hidden border border-border/20 aspect-video">
                      <iframe
                        src={(property as any).visibility_map}
                        className="w-full h-full"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>
                )}

                {/* Amenities */}
                {((property as any).amenities ?? []).length > 0 && (
                  <div className="glass rounded-2xl border border-border/20 p-6 sm:p-7">
                    {/* Header */}
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <h2 className="text-xl sm:text-2xl font-bold">
                        Amenities
                      </h2>

                      <span className="shrink-0 text-sm text-muted-foreground">
                        {Math.min((property as any).amenities.length, 5)} of{" "}
                        {(property as any).amenities.length}
                      </span>
                    </div>

                    {/* First 5 Amenities */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {(property as any).amenities
                        .slice(0, 5)
                        .map((amenity: any, idx: number) => {
                          const label =
                            typeof amenity === "string"
                              ? amenity
                              : (amenity?.name ??
                                amenity?.label ??
                                String(amenity));

                          return (
                            <div
                              key={`${label}-${idx}`}
                              className="flex items-center gap-3 rounded-xl bg-muted/70 p-3.5 transition hover:bg-muted"
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                ✓
                              </span>

                              <span className="text-sm font-medium">
                                {label}
                              </span>
                            </div>
                          );
                        })}
                    </div>

                    {/* Remaining Amenities */}
                    {(property as any).amenities.length > 5 && (
                      <>
                        <button
                          onClick={() => {
                            const container = document.querySelector(
                              "[data-amenities-container]",
                            );

                            if (container) {
                              container.classList.toggle("max-h-none");
                              container.classList.toggle("max-h-96");
                            }
                          }}
                          className="mt-5 text-sm font-semibold text-primary transition hover:text-primary/80"
                        >
                          Show {(property as any).amenities.length - 5} more
                          amenities →
                        </button>

                        <div
                          data-amenities-container
                          className="mt-3 grid max-h-0 grid-cols-1 gap-3 overflow-hidden transition-all duration-300 md:grid-cols-2"
                        >
                          {(property as any).amenities
                            .slice(5)
                            .map((amenity: any, idx: number) => {
                              const label =
                                typeof amenity === "string"
                                  ? amenity
                                  : (amenity?.name ??
                                    amenity?.label ??
                                    String(amenity));

                              return (
                                <div
                                  key={`${label}-${idx + 5}`}
                                  className="flex items-center gap-3 rounded-xl bg-muted/70 p-3.5 transition hover:bg-muted"
                                >
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                    ✓
                                  </span>

                                  <span className="text-sm font-medium">
                                    {label}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Features */}
                {((property as any).features ?? []).length > 0 && (
                  <div className="glass rounded-2xl border border-border/20 p-6 sm:p-7">
                    <h2 className="mb-5 text-xl sm:text-2xl font-bold">
                      Features
                    </h2>

                    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {(property as any).features.map((feature: string) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3 rounded-xl bg-muted/50 p-3"
                        >
                          <span className="mt-0.5 text-primary font-bold">
                            •
                          </span>

                          <span className="text-sm leading-6 text-muted-foreground">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-6">
            <div className="glass rounded-xl p-8 sm:p-10 sticky top-24">
              {listingType !== "rent" && Number(property.price) > 0 ? (
                <>
                  <EstimatedPayments
                    price={Number(property.price)}
                    availableFinancing={financingOptions}
                  />
                  <p className="text-xs text-white mb-6">
                    List Price: {formatPrice(property.price)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-white text-sm mb-2">
                    {listingType === "rent" ? "Monthly Rent" : "Price"}
                  </p>
                  <h3 className="text-4xl font-bold text-white mb-6">
                    {listingType === "rent"
                      ? formatPrice(
                          (property as any).price_per_month ??
                            (property as any).pricePerMonth,
                        ) + "/month"
                      : formatPrice(property.price)}
                  </h3>
                </>
              )}
            </div>

            {/* ── Agent card ── */}
            {(property as any).agent && (
              <div className="glass rounded-xl p-8">
                <h3 className="font-bold text-lg mb-4">Listed by</h3>
                <div className="flex items-start gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      (property as any).agent.avatar ??
                      `https://ui-avatars.com/api/?name=${encodeURIComponent((property as any).agent.name)}&size=128&background=random`
                    }
                    alt={(property as any).agent.name}
                    width={64}
                    height={64}
                    loading="lazy"
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://ui-avatars.com/api/?name=${encodeURIComponent((property as any).agent.name)}&size=128&background=random`;
                    }}
                  />
                  <div className="flex-1">
                    <h4 className="font-bold text-foreground">
                      {(property as any).agent.name}
                    </h4>
                    {(property as any).agent.specialization && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {(property as any).agent.specialization}
                      </p>
                    )}
                    {(property as any).agent.experience_years && (
                      <p className="text-xs text-muted-foreground">
                        {(property as any).agent.experience_years} years
                        experience
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RELATED PROPERTIES ── */}
        {relatedProperties.length > 0 && (
          <div className="mt-16 pt-12 border-t border-border/30">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Similar Properties</h2>
              <p className="text-muted-foreground">
                Similar {property.bedrooms && `${property.bedrooms} bedroom`}{" "}
                {property.listing_type === "rent"
                  ? "rental"
                  : "properties for sale"}
              </p>
            </div>
            {relatedLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="glass rounded-xl h-72 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedProperties.map((prop: any) => {
                  const propPrice =
                    prop.listing_type === "rent"
                      ? `₱${Number(prop.price_per_month ?? 0).toLocaleString("en-PH")}/mo`
                      : `₱${Number(prop.price ?? 0).toLocaleString("en-PH")}`;
                  const propImage =
                    prop.thumbnail ||
                    prop.images?.[0]?.url ||
                    "/placeholder-property.jpg";
                  const propImageUrl = imgUrl(String(propImage));
                  return (
                    <Link
                      key={prop.id}
                      href={`/properties/${prop.id}`}
                      className="block h-full transition-all duration-300 hover:no-underline"
                    >
                      <div className="glass rounded-xl overflow-hidden h-full flex flex-col hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
                        <div className="relative h-64 overflow-hidden">
                          <Image
                            src={propImageUrl}
                            alt={prop.title}
                            fill
                            className="object-cover"
                          />
                          {prop.priority && (
                            <div
                              className={`absolute top-3 left-3 text-white px-2 py-1 text-xs font-bold ${
                                prop.priority === 1
                                  ? "bg-gradient-to-r from-red-600 to-red-700"
                                  : prop.priority === 2
                                    ? "bg-gradient-to-r from-orange-600 to-orange-700"
                                    : prop.priority === 3
                                      ? "bg-gradient-to-r from-yellow-600 to-yellow-700"
                                      : "bg-gradient-to-r from-blue-600 to-blue-700"
                              }`}
                            >
                              {/* Priority #{prop.priority} */}
                            </div>
                          )}
                          <div className="absolute top-3 right-3 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold">
                            {prop.listing_type === "rent"
                              ? "For Rent"
                              : "For Sale"}
                          </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                          <h3 className="font-bold text-lg mb-1 line-clamp-2 text-white">
                            {prop.title}
                          </h3>
                          <p className="text-sm text-white/70 mb-3 line-clamp-1">
                            📍 {prop.city}
                          </p>
                          <div className="flex items-center justify-between mb-3 mt-auto">
                            <span className="text-xl font-bold text-white">
                              {propPrice}
                            </span>
                          </div>
                          <div className="flex gap-2 text-xs text-white/60 flex-wrap">
                            {prop.bedrooms && (
                              <span>🛏 {prop.bedrooms} bed</span>
                            )}
                            {prop.bathrooms && (
                              <span>🚿 {prop.bathrooms} bath</span>
                            )}
                            {prop.area && <span>📐 {prop.area}</span>}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
