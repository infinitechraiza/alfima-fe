"use client";

import { useState, useRef } from "react";
import {
  Plus,
  X,
  Upload,
  Check,
  Home,
  Building2,
  Landmark,
  Trees,
  Store,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Ruler,
  Calendar,
  FileText,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle,
  Video,
} from "lucide-react";

type ListingType = "sale" | "rent";
type PropertyType =
  | "house"
  | "apartment"
  | "condo"
  | "townhouse"
  | "lot"
  | "commercial";

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

// ─── Chunk size: 3 MB — safely under Vercel's 4.5 MB limit ──────────────────
const CHUNK_SIZE = 3 * 1024 * 1024;

function formatNumberInput(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-PH");
}

function stripCommas(val: string): string {
  return val.replace(/,/g, "");
}

// ─── Chunked video uploader — goes directly to Laravel, bypasses Vercel ──────
// ─── Chunked video uploader ───────────────────────────────────────────────
async function uploadVideoChunked(
  file: File,
  propertyId: number,
  title: string,
  token: string | null,
  onProgress: (pct: number) => void,
): Promise<void> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // ✅ Hardcode the direct Laravel URL — never go through Next.js
  const laravelBase = process.env.NEXT_PUBLIC_API_URL;

  if (!laravelBase) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set — cannot upload video directly to server.",
    );
  }

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const chunk = file.slice(start, Math.min(start + CHUNK_SIZE, file.size));

    const fd = new FormData();
    fd.append("upload_id", uploadId);
    fd.append("chunk_index", String(i));
    fd.append("total_chunks", String(totalChunks));
    fd.append("file_name", file.name);
    fd.append("property_id", String(propertyId));
    fd.append("title", title);
    fd.append("chunk", chunk, file.name);

    console.log(
      `[chunk ${i + 1}/${totalChunks}] Sending to: ${laravelBase}/api/properties/${propertyId}/videos/chunk`,
    );

    const res = await fetch(
      `${laravelBase}/api/properties/${propertyId}/videos/chunk`,
      {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      },
    );

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      console.error(`[chunk ${i + 1}/${totalChunks}] Failed:`, d);
      throw new Error(d.message ?? `Chunk ${i + 1}/${totalChunks} failed`);
    }

    const result = await res.json();
    console.log(`[chunk ${i + 1}/${totalChunks}] Response:`, result);

    onProgress(Math.round(((i + 1) / totalChunks) * 100));
  }
}

export default function ListPropertyPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    propertyType: "house" as PropertyType,
    listingType: "sale" as ListingType,
    price: "",
    pricePerMonth: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    yearBuilt: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    amenities: [] as string[],
    features: [] as string[],
    images: [] as { file: File; preview: string }[],
    thumbnail: null as { file: File; preview: string } | null,
    // No FileReader preview for video — avoids loading large files into memory
    video: null as { file: File } | null,
  });

  const [activeSection, setActiveSection] = useState(0);
  const [otherAmenity, setOtherAmenity] = useState("");
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [uploadStep, setUploadStep] = useState("");
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoTotalChunks, setVideoTotalChunks] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // ── Field helpers ─────────────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ── Thumbnail ─────────────────────────────────────────────────────────────
  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setFormData((prev) => ({
        ...prev,
        thumbnail: { file, preview: reader.result as string },
      }));
    reader.readAsDataURL(file);
  };

  // ── Gallery images ────────────────────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    Array.from(e.target.files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, { file, preview: reader.result as string }],
        }));
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) =>
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));

  // ── Video — store File only, no FileReader ────────────────────────────────
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, video: { file } }));
    setVideoProgress(0);
  };

  // ── Amenities & Features ──────────────────────────────────────────────────
  const handleAmenityToggle = (amenity: string) =>
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));

  const handleFeatureToggle = (feature: string) =>
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));

  const addCustomAmenity = () => {
    const trimmed = otherAmenity.trim();
    if (
      trimmed &&
      !customAmenities.includes(trimmed) &&
      !amenityOptions.find((a) => a.name === trimmed)
    ) {
      setCustomAmenities((prev) => [...prev, trimmed]);
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, trimmed],
      }));
      setOtherAmenity("");
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): string[] => {
    const e: string[] = [];
    // if (!formData.title.trim()) e.push("Property title is required.");
    if (!formData.description.trim()) e.push("Description is required.");
    // if (!formData.yearBuilt.trim()) e.push("Year built is required.");
    if (!formData.address.trim()) e.push("Street address is required.");
    if (!formData.city.trim()) e.push("City / Municipality is required.");
    if (!formData.state.trim()) e.push("Province / Region is required.");
    if (!formData.zipCode.trim()) e.push("Postal code is required.");
    // if (!formData.bedrooms.trim()) e.push("Number of bedrooms is required.");
    // if (!formData.bathrooms.trim()) e.push("Number of bathrooms is required.");
    // if (!formData.area.trim()) e.push("Floor area is required.");
    // if (formData.listingType === "sale" && !formData.price.trim())
    //   e.push("Asking price is required.");
    // if (formData.listingType === "rent" && !formData.pricePerMonth.trim())
    //   e.push("Monthly rent is required.");
    return e;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setErrors([]);
    setApiError(null);
    setLoading(true);
    setVideoProgress(0);
    setUploadStep("Creating listing…");

    try {
      // ── Step 1: Get auth token for direct Laravel calls ───────────────────
      const tokenRes = await fetch("/api/auth/token");
      const tokenData = await tokenRes.json();
      const token: string | null = tokenData.token ?? null;
      const laravelBase = process.env.NEXT_PUBLIC_API_URL;

      // ── Step 2: POST text fields only to Next.js proxy → Laravel ─────────
      // No media here — keeps this request tiny and well under Vercel's limit
      const fd = new FormData();
      fd.append("title", formData.title.trim());
      fd.append("description", formData.description.trim());
      fd.append("listing_type", formData.listingType);
      fd.append("property_type", formData.propertyType);
      fd.append("address", formData.address.trim());
      fd.append("city", formData.city.trim());
      fd.append("state", formData.state.trim());
      fd.append("zip_code", formData.zipCode.trim());
      fd.append("bedrooms", formData.bedrooms);
      fd.append("bathrooms", formData.bathrooms);
      fd.append("area", formData.area);
      fd.append("year_built", formData.yearBuilt);

      if (formData.listingType === "sale") {
        fd.append("price", stripCommas(formData.price));
        fd.append("price_per_month", "");
      } else {
        fd.append("price_per_month", stripCommas(formData.pricePerMonth));
        fd.append("price", "");
      }

      formData.amenities.forEach((a) => fd.append("amenities[]", a));
      formData.features.forEach((f) => fd.append("features[]", f));

      const res = await fetch("/api/properties", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          const msgs = Object.values(
            data.errors as Record<string, string[]>,
          ).flat();
          setApiError(msgs.join(" "));
        } else {
          setApiError(
            data.message ??
              data.error ??
              "Something went wrong. Please try again.",
          );
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const propertyId: number = data.id;

      // ── Step 3: Upload thumbnail directly to Laravel (bypasses Vercel) ────
      if (formData.thumbnail) {
        setUploadStep("Uploading thumbnail…");
        const thumbFd = new FormData();
        thumbFd.append("thumbnail", formData.thumbnail.file);

        const thumbRes = await fetch(
          `${laravelBase}/api/properties/${propertyId}/images`,
          {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: thumbFd,
          },
        );

        if (!thumbRes.ok) {
          const d = await thumbRes.json().catch(() => ({}));
          setApiError(
            `Listing created! But thumbnail upload failed: ${d.error ?? "Unknown error"}`,
          );
          setSuccess(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
      }

      // ── Step 4: Upload gallery images directly to Laravel ─────────────────
      if (formData.images.length > 0) {
        setUploadStep(
          `Uploading ${formData.images.length} image${formData.images.length > 1 ? "s" : ""}…`,
        );
        const imgFd = new FormData();
        formData.images
          .slice(0, 10)
          .forEach((img) => imgFd.append("images[]", img.file));

        const imgRes = await fetch(
          `${laravelBase}/api/properties/${propertyId}/images`,
          {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: imgFd,
          },
        );

        if (!imgRes.ok) {
          const d = await imgRes.json().catch(() => ({}));
          setApiError(
            `Listing created! But image upload failed: ${d.error ?? "Unknown error"}`,
          );
          setSuccess(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
      }

      // ── Step 5: Chunked video upload directly to Laravel ──────────────────
      if (formData.video) {
        const totalChunks = Math.ceil(formData.video.file.size / CHUNK_SIZE);
        setVideoTotalChunks(totalChunks);
        setUploadStep("Uploading video…");

        try {
          await uploadVideoChunked(
            formData.video.file,
            propertyId,
            formData.title.trim() || "Property Video",
            token,
            (pct) => setVideoProgress(pct),
          );
        } catch (err) {
          setApiError(
            `Listing created! But video upload failed: ${err instanceof Error ? err.message : "Unknown error"}. You can upload it later from the admin panel.`,
          );
          setSuccess(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
      }

      // ── Done ──────────────────────────────────────────────────────────────
      setUploadStep("");
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });

      setFormData({
        title: "",
        description: "",
        propertyType: "house",
        listingType: "sale",
        price: "",
        pricePerMonth: "",
        bedrooms: "",
        bathrooms: "",
        area: "",
        yearBuilt: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        amenities: [],
        features: [],
        images: [],
        thumbnail: null,
        video: null,
      });
      setCustomAmenities([]);
      setVideoProgress(0);
      setVideoTotalChunks(0);
      setActiveSection(0);
    } catch {
      setApiError("Network error. Please check your connection and try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
      setUploadStep("");
    }
  };

  // ── Static data ───────────────────────────────────────────────────────────
  const propertyTypes: {
    value: PropertyType;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { value: "house", label: "House", icon: <Home className="w-5 h-5" /> },
    {
      value: "apartment",
      label: "Apartment",
      icon: <Building2 className="w-5 h-5" />,
    },
    { value: "condo", label: "Condo", icon: <Landmark className="w-5 h-5" /> },
    {
      value: "townhouse",
      label: "Townhouse",
      icon: <Home className="w-5 h-5" />,
    },
    { value: "lot", label: "Lot", icon: <Trees className="w-5 h-5" /> },
    {
      value: "commercial",
      label: "Commercial",
      icon: <Store className="w-5 h-5" />,
    },
  ];

  const amenityOptions = [
    { name: "Pool", emoji: "🏊" },
    { name: "Gym", emoji: "💪" },
    { name: "Parking", emoji: "🅿️" },
    { name: "Doorman", emoji: "🚪" },
    { name: "Rooftop Deck", emoji: "🌆" },
    { name: "Pet Friendly", emoji: "🐾" },
    { name: "Security", emoji: "🔒" },
    { name: "Garden", emoji: "🌳" },
    { name: "Balcony", emoji: "🏠" },
    { name: "Washer/Dryer", emoji: "🧺" },
    { name: "Concierge", emoji: "🛎️" },
    { name: "Storage", emoji: "📦" },
    { name: "Elevator", emoji: "🛗" },
    { name: "CCTV", emoji: "📹" },
    { name: "Generator", emoji: "⚡" },
    { name: "Solar Panels", emoji: "☀️" },
    { name: "Water Tank", emoji: "💧" },
    { name: "Internet Ready", emoji: "📶" },
    { name: "Air Conditioning", emoji: "❄️" },
    { name: "Fireplace", emoji: "🔥" },
    { name: "Sauna", emoji: "🧖" },
    { name: "Basketball Court", emoji: "🏀" },
    { name: "Tennis Court", emoji: "🎾" },
    { name: "Playground", emoji: "🛝" },
    { name: "Clubhouse", emoji: "🏡" },
    { name: "Function Hall", emoji: "🎪" },
    { name: "Jogging Path", emoji: "🏃" },
    { name: "Shuttle Service", emoji: "🚌" },
  ];

  const sections = [
    "Basic Info",
    "Photos & Video",
    "Location",
    "Details",
    "Amenities",
  ];

  const videoFile = formData.video?.file ?? null;
  const videoSizeMB = videoFile
    ? (videoFile.size / 1024 / 1024).toFixed(1)
    : null;
  const videoChunkCount = videoFile
    ? Math.ceil(videoFile.size / CHUNK_SIZE)
    : 0;
  const isVideoUploading = loading && uploadStep === "Uploading video…";

  return (
    <div
      className="min-h-screen py-12 px-4"
      style={{
        background:
          "linear-gradient(145deg,#3d1818 0%,#4a1f1f 50%,#2d1212 100%)",
      }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12 relative">
          <div className="absolute -top-4 -left-4 w-32 h-32 bg-orange-600/10 rounded-full blur-3xl" />
          <div className="relative">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4"
              style={{
                background: "rgba(232,168,160,0.15)",
                border: "1px solid rgba(232,168,160,0.3)",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: "#e8a8a0" }} />
              <span
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: "#e8a8a0" }}
              >
                New Listing
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-3 tracking-tight">
              List Your{" "}
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #e8a8a0, #d4a5a0)",
                }}
              >
                Property
              </span>
            </h1>
            <p className="text-white/50 text-lg">
              Reach thousands of qualified buyers and renters across the
              Philippines
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-0 mb-10 overflow-x-auto pb-2">
          {sections.map((section, i) => (
            <div key={i} className="flex items-center flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveSection(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeSection === i
                    ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30"
                    : activeSection > i
                      ? "bg-white/10 text-white/70"
                      : "text-white/30"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    activeSection > i
                      ? "bg-green-500 text-white"
                      : activeSection === i
                        ? "bg-white/20"
                        : "bg-white/10"
                  }`}
                >
                  {activeSection > i ? <Check className="w-3 h-3" /> : i + 1}
                </span>
                {section}
              </button>
              {i < sections.length - 1 && (
                <div
                  className={`w-8 h-px mx-1 flex-shrink-0 ${activeSection > i ? "bg-green-500/50" : "bg-white/10"}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Validation errors */}
        {errors.length > 0 && (
          <div className="mb-6 p-5 bg-orange-500/20 border border-orange-500/40 rounded-2xl">
            <p className="text-orange-300 font-bold mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Please fix the following before publishing:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((err, i) => (
                <li key={i} className="text-orange-300/80 text-sm">
                  {err}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* API error */}
        {apiError && (
          <div className="mb-6 p-4 bg-orange-500/20 border border-orange-500/40 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
            <p className="text-orange-300 text-sm">{apiError}</p>
          </div>
        )}

        {/* Success banner */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/40 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <p className="text-green-300 font-medium">
              Property listed successfully! Our team will review it shortly.
            </p>
          </div>
        )}

        <div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
            {/* ── SECTION 0: Basic Info ── */}
            <div className={activeSection === 0 ? "block" : "hidden"}>
              <div className="p-8 sm:p-12">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-orange-600/20 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Basic Information
                    </h2>
                    <p className="text-white/40 text-sm">
                      Tell us about your property
                    </p>
                  </div>
                </div>

                {/* Listing Type Toggle */}
                <div className="mb-8">
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
                    Listing Type
                  </label>
                  <div className="inline-flex bg-black/20 rounded-2xl p-1.5 border border-white/10">
                    {(["sale", "rent"] as ListingType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({ ...p, listingType: type }))
                        }
                        className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                          formData.listingType === type
                            ? "bg-orange-600 text-white shadow-lg shadow-orange-600/40"
                            : "text-white/40 hover:text-white/70"
                        }`}
                      >
                        {type === "sale" ? "🏠 For Sale" : "🔑 For Rent"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Property Type Grid */}
                <div className="mb-8">
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
                    Property Type
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {propertyTypes.map(({ value, label, icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({ ...p, propertyType: value }))
                        }
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                          formData.propertyType === value
                            ? "border-orange-500 bg-orange-600/20 text-white"
                            : "border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:text-white/70"
                        }`}
                      >
                        {icon}
                        <span className="text-xs font-semibold">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
                    Property Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Modern Downtown Apartment with City Views"
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all text-lg"
                  />
                </div>

                {/* Description */}
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your property in detail — highlights, nearby amenities, special features..."
                    rows={5}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* ── SECTION 1: Photos & Video ── */}
            <div className={activeSection === 1 ? "block" : "hidden"}>
              <div className="p-8 sm:p-12">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-orange-600/20 rounded-xl flex items-center justify-center">
                    <Upload className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Photos & Media
                    </h2>
                  </div>
                </div>

                {/* Thumbnail */}
                <div className="mb-8">
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">
                    Featured Thumbnail (Main Image)
                  </label>
                  <button
                    type="button"
                    onClick={() => thumbInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-orange-500/50 rounded-2xl p-8 text-center hover:border-orange-500 transition-all bg-orange-500/5"
                  >
                    {formData.thumbnail ? (
                      <div className="space-y-3">
                        <img
                          src={formData.thumbnail.preview}
                          alt="Thumbnail"
                          className="w-40 h-40 object-cover rounded-lg mx-auto"
                        />
                        <p className="text-orange-300 text-sm font-medium">
                          {formData.thumbnail.file.name}
                        </p>
                        <p className="text-white/30 text-xs">
                          {(formData.thumbnail.file.size / 1024 / 1024).toFixed(
                            1,
                          )}{" "}
                          MB
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData((p) => ({ ...p, thumbnail: null }));
                          }}
                          className="mt-2 px-4 py-2 bg-orange-600/30 hover:bg-orange-600/50 rounded-lg text-orange-300 text-sm font-medium transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-orange-400 mx-auto" />
                        <p className="text-white font-medium">
                          Click to upload thumbnail
                        </p>
                        <p className="text-white/40 text-sm">
                          PNG, JPG, WebP — any size
                        </p>
                      </div>
                    )}
                  </button>
                  <input
                    ref={thumbInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                  />
                </div>

                {/* Gallery Images */}
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">
                    Additional Photos ({formData.images.length}/10)
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-orange-500 hover:bg-orange-500/5 transition-all"
                  >
                    <Plus className="w-6 h-6 text-white/40 mx-auto mb-2" />
                    <p className="text-white/60 font-medium">Add photos</p>
                    <p className="text-white/40 text-sm">
                      Up to 10 images — any size
                    </p>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {formData.images.length > 0 && (
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img.preview}
                            alt={`Gallery ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <div className="absolute bottom-1 left-1 right-1 text-center">
                            <span className="text-[10px] text-white/60 bg-black/60 rounded px-1.5 py-0.5">
                              {(img.file.size / 1024 / 1024).toFixed(1)} MB
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Video Upload */}
                <div className="mt-12 pt-8 border-t border-white/10">
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">
                    Property Video (Optional)
                  </label>

                  {formData.video ? (
                    <div className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-orange-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Video className="w-5 h-5 text-orange-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium text-sm truncate">
                            {formData.video.file.name}
                          </p>
                          <p className="text-white/40 text-xs mt-0.5">
                            {videoSizeMB} MB
                            {videoChunkCount > 1 && (
                              <span className="ml-2 text-orange-400/70">
                                → {videoChunkCount} chunks × 3 MB
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((p) => ({ ...p, video: null }));
                          setVideoProgress(0);
                        }}
                        className="w-8 h-8 bg-orange-600/30 hover:bg-orange-600/50 rounded-full flex items-center justify-center flex-shrink-0 ml-4 transition-all"
                      >
                        <X className="w-4 h-4 text-orange-300" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-orange-500 hover:bg-orange-500/5 transition-all"
                    >
                      <Video className="w-8 h-8 text-white/40 mx-auto mb-2" />
                      <p className="text-white font-medium">
                        Click to upload video
                      </p>
                      <p className="text-white/40 text-sm">
                        MP4, MOV, or WebM — any size
                      </p>
                      <p className="text-orange-400/60 text-xs mt-1.5">
                        ⚡ Chunked upload — bypasses all server limits
                      </p>
                    </button>
                  )}
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* ── SECTION 2: Location ── */}
            <div className={activeSection === 2 ? "block" : "hidden"}>
              <div className="p-8 sm:p-12">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-orange-600/20 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Location</h2>
                    <p className="text-white/40 text-sm">
                      Where is your property located?
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g., 123 Main Street, Apt 4B"
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
                      City / Municipality
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g., Manila"
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
                      Province / Region
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="e.g., NCR"
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      placeholder="e.g., 1000"
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 3: Details ── */}
            <div className={activeSection === 3 ? "block" : "hidden"}>
              <div className="p-8 sm:p-12">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-orange-600/20 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Property Details
                    </h2>
                    <p className="text-white/40 text-sm">
                      Features and characteristics
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">
                    Features
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {FEATURE_OPTIONS.map((feature) => (
                      <button
                        key={feature}
                        type="button"
                        onClick={() => handleFeatureToggle(feature)}
                        className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          formData.features.includes(feature)
                            ? "border-orange-500 bg-orange-600/20 text-white"
                            : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                        }`}
                      >
                        {feature}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 4: Amenities ── */}
            <div className={activeSection === 4 ? "block" : "hidden"}>
              <div className="p-8 sm:p-12">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-orange-600/20 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Amenities</h2>
                    <p className="text-white/40 text-sm">
                      What special amenities does your property have?
                    </p>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {amenityOptions.map(({ name }) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleAmenityToggle(name)}
                        className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          formData.amenities.includes(name)
                            ? "border-orange-500 bg-orange-600/20 text-white"
                            : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10">
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
                    Add Custom Amenity
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={otherAmenity}
                      onChange={(e) => setOtherAmenity(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomAmenity();
                        }
                      }}
                      placeholder="e.g., Smart Home, Wine Cellar..."
                      className="flex-1 px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={addCustomAmenity}
                      className="px-6 py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-600/30"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {customAmenities.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {customAmenities.map((amenity) => (
                        <div
                          key={amenity}
                          className="px-4 py-2 bg-orange-600/20 border border-orange-500/50 rounded-lg text-orange-300 text-sm flex items-center gap-2"
                        >
                          {amenity}
                          <button
                            type="button"
                            onClick={() => {
                              setCustomAmenities((prev) =>
                                prev.filter((a) => a !== amenity),
                              );
                              setFormData((prev) => ({
                                ...prev,
                                amenities: prev.amenities.filter(
                                  (a) => a !== amenity,
                                ),
                              }));
                            }}
                            className="text-orange-300 hover:text-orange-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-10 space-y-4">
            {/* Upload progress — shown while submitting */}
            {loading && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-400 flex-shrink-0" />
                  <span>{uploadStep || "Processing…"}</span>
                </div>

                {/* Video chunk progress bar */}
                {isVideoUploading && videoTotalChunks > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-white/40">
                      <span>
                        Chunk{" "}
                        {Math.max(
                          1,
                          Math.ceil((videoProgress / 100) * videoTotalChunks),
                        )}{" "}
                        of {videoTotalChunks}
                      </span>
                      <span className="text-orange-400 font-bold">
                        {videoProgress}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-300"
                        style={{ width: `${videoProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center gap-4 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                disabled={activeSection === 0 || loading}
                className={`px-8 py-4 rounded-2xl font-bold transition-all ${
                  activeSection === 0 || loading
                    ? "text-white/30 cursor-not-allowed"
                    : "text-white hover:bg-white/10"
                }`}
              >
                ← Previous
              </button>

              {activeSection < sections.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setActiveSection(
                      Math.min(sections.length - 1, activeSection + 1),
                    )
                  }
                  className="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-600/30"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-600/50 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-600/30 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {uploadStep || "Publishing…"}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Publish Listing
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
