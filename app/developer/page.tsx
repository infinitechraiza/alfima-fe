"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PropertyCard } from "@/components/developer-property-card";
import { PropertySearch } from "@/components/property/property-search";
import {
  Home,
  Building2,
  ArrowUpDown,
  MapPin,
  ArrowRight,
  Grid3x3,
  LayoutList,
} from "lucide-react";

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const SORT_OPTIONS = [
  { label: "Priority First", value: "priority" },
  { label: "Newest", value: "newest" },
  { label: "Price: Low–High", value: "price_asc" },
  { label: "Price: High–Low", value: "price_desc" },
];

const BLUR_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

// ── Safe image URL resolver ───────────────────────────────────────────────────
// Handles: absolute URLs, relative paths from your Hostinger backend
function resolveImageUrl(raw: string | undefined | null): string {
  if (!raw) return "";
  const str = String(raw).trim();
  if (!str) return "";
  // Already absolute
  if (str.startsWith("http://") || str.startsWith("https://")) return str;
  // Relative path — prefix with backend base
  const base = (
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
  ).replace(/\/$/, "");
  return `${base}/${str.replace(/^\//, "")}`;
}

function formatPrice(amount: number): string {
  if (amount >= 1_000_000_000)
    return `₱${(amount / 1_000_000_000).toFixed(2)}B`;
  if (amount >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `₱${(amount / 1_000).toFixed(0)}K`;
  return `₱${amount.toLocaleString("en-PH")}`;
}

function normalizeListingType(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (v === "for sale" || v === "sale" || v === "buy") return "sale";
  if (v === "for rent" || v === "rent") return "rent";
  return raw;
}

// ── Stat Ticker ───────────────────────────────────────────────────────────────
function StatTicker({ total }: { total: number }) {
  return (
    <div
      className="overflow-hidden whitespace-nowrap border-y border-red-900/40 py-2.5"
      style={{ background: "rgba(0,0,0,0.25)" }}
    >
      <div className="inline-flex animate-marquee gap-16 text-xs font-bold tracking-[0.2em] uppercase text-white">
        {[...Array(6)].map((_, i) => (
          <span key={i} className="flex items-center gap-8">
            <span>{total.toLocaleString()} Properties Listed</span>
            <span className="text-red-900">◆</span>
            <span>Across the Philippines</span>
            <span className="text-red-900">◆</span>
            <span>Alfima Realty Inc.</span>
            <span className="text-red-900">◆</span>
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .animate-marquee { animation: marquee 28s linear infinite; }
      `}</style>
    </div>
  );
}

// ── Hero Right Panel ──────────────────────────────────────────────────────────
function HeroPanel({ total, loading }: { total: number; loading: boolean }) {
  const stats = [
    { value: "12+", label: "Years in Business" },
    { value: "500+", label: "Properties Sold" },
    { value: "98%", label: "Client Satisfaction" },
    { value: loading ? "…" : total.toLocaleString(), label: "Active Listings" },
  ];

  return (
    <div className="relative flex flex-col gap-4 select-none">
      <div
        className="absolute -top-8 -right-2 font-black pointer-events-none"
        style={{
          fontFamily: "Georgia, serif",
          fontSize: "180px",
          color: "transparent",
          WebkitTextStroke: "1px rgba(255,255,255,0.035)",
          lineHeight: 1,
          zIndex: 0,
        }}
      >
        №1
      </div>

      <p
        className="text-white text-[10px] font-bold tracking-[0.35em] uppercase relative z-10"
        style={{ fontFamily: "monospace" }}
      >
        Why choose us
      </p>

      <div className="grid grid-cols-2 gap-3 relative z-10">
        {stats.map((s, i) => (
          <div
            key={i}
            className="rounded-2xl p-5 border border-red-900/30 flex flex-col gap-1.5"
            style={{
              background: "rgba(0,0,0,0.28)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              className="text-3xl font-black text-white leading-none"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {s.value}
            </span>
            <span
              className="text-white/35 text-xs leading-tight"
              style={{ fontFamily: "monospace" }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 relative z-10">
        <div
          className="h-px flex-1"
          style={{ background: "rgba(255,80,60,0.2)" }}
        />
        <span
          className="text-white/70 text-[10px] tracking-widest uppercase"
          style={{ fontFamily: "monospace" }}
        >
          Trusted · Proven · Local
        </span>
        <div
          className="h-px flex-1"
          style={{ background: "rgba(255,80,60,0.2)" }}
        />
      </div>

      <div className="flex flex-wrap gap-2 relative z-10">
        {["Metro Manila", "Cebu", "Davao", "Cavite", "Laguna", "Batangas"].map(
          (city) => (
            <span
              key={city}
              className="px-3 py-1 rounded-full text-xs font-semibold border border-red-900/30 text-white/60"
              style={{ background: "rgba(0,0,0,0.2)", fontFamily: "monospace" }}
            >
              {city}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

// ── Filtered preview row ──────────────────────────────────────────────────────
interface PreviewProperty {
  id: number | string;
  title: string;
  listing_type?: string;
  price?: string | number;
  price_per_month?: string | number;
  thumbnail?: string;
  images?: any[];
  priority?: number | null;
  address?: string;
  developer_name?: string;
  _source?: "developer" | "regular";
}

function PreviewRow({
  p,
  idx,
  isLast,
}: {
  p: PreviewProperty;
  idx: number;
  isLast: boolean;
}) {
  const isRent = (p.listing_type ?? "").toLowerCase().includes("rent");
  const rawPrice = Number(
    isRent ? (p.price_per_month ?? p.price ?? 0) : (p.price ?? 0),
  );

  // Safely resolve image — handles string paths, object arrays, or missing
  const rawImg =
    p.thumbnail ??
    (Array.isArray(p.images)
      ? typeof p.images[0] === "string"
        ? p.images[0]
        : (p.images[0]?.url ?? p.images[0]?.path ?? "")
      : "");
  const imageUrl = resolveImageUrl(rawImg);

  const detailHref =
    p._source === "regular" ? `/properties/${p.id}` : `/developer/${p.id}`;

  return (
    <Link
      href={detailHref}
      className="flex items-center gap-3 px-4 py-3 group transition-all"
      style={{
        borderBottom: !isLast ? "1px solid rgba(255,255,255,0.05)" : "none",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div className="relative w-12 h-12 rounded-lg shrink-0 overflow-hidden border border-white/10">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={p.title}
            fill
            sizes="48px"
            loading="lazy"
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-white/10" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-white font-black text-sm leading-tight">
            {formatPrice(rawPrice)}
            {isRent ? (
              <span className="text-white/40 font-normal text-xs">/mo</span>
            ) : null}
          </p>
          {p.priority != null && p.priority > 0 && (
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full text-white ${
                p.priority === 1
                  ? "bg-red-600"
                  : p.priority === 2
                    ? "bg-orange-600"
                    : p.priority === 3
                      ? "bg-yellow-600"
                      : "bg-blue-600"
              }`}
            >
              Priority #{p.priority}
            </span>
          )}
          {p._source === "regular" && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white bg-blue-700/70">
              Listed
            </span>
          )}
        </div>
        <p className="text-white/70 text-xs line-clamp-1 mt-0.5">{p.title}</p>
        {p.address && (
          <p className="text-white/35 text-[10px] mt-0.5 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 shrink-0 text-red-400/60" />
            {p.address}
          </p>
        )}
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-red-400 transition-colors shrink-0" />
    </Link>
  );
}

// ── Inner page ────────────────────────────────────────────────────────────────
function PropertiesPageInner() {
  const searchParams = useSearchParams();

  const [properties, setProperties] = useState<any[]>([]);
  const [combinedTotal, setCombinedTotal] = useState(0);
  const [devPagination, setDevPagination] = useState<PaginationMeta | null>(
    null,
  );
  const [regPagination, setRegPagination] = useState<PaginationMeta | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<any>(null);
  const [developerFilter, setDeveloperFilter] = useState("");
  const [sortBy, setSortBy] = useState("priority");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // ── Dynamic developer list ────────────────────────────────────────────────
  const [developerList, setDeveloperList] = useState<string[]>([]);
  const [developersLoading, setDevelopersLoading] = useState(true);

  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const res = await fetch(
          "/api/developers-properties?per_page=200&page=1",
        );
        if (!res.ok) return;
        const data = await res.json();
        const items: any[] = data.data ?? [];
        const names = Array.from(
          new Set(
            items
              .map((p: any) => p.developer_name)
              .filter((n: any) => typeof n === "string" && n.trim() !== ""),
          ),
        ).sort() as string[];
        setDeveloperList(names);
      } catch {
        // silently fail
      } finally {
        setDevelopersLoading(false);
      }
    };
    fetchDevelopers();
  }, []);

  // ── Core fetch ────────────────────────────────────────────────────────────
  const fetchProperties = async (
    filters?: any,
    page = 1,
    sort = sortBy,
    devFilter = developerFilter,
  ) => {
    setLoading(true);
    try {
      const PER_PAGE = 12;

      const devParams = new URLSearchParams({
        page: String(page),
        per_page: String(PER_PAGE),
        status: "active",
      });
      if (filters?.search) devParams.append("search", filters.search);
      if (filters?.listingType)
        devParams.append(
          "listing_type",
          normalizeListingType(filters.listingType),
        );
      if (filters?.type) devParams.append("property_type", filters.type);
      if (devFilter) devParams.set("developer_name", devFilter);
      if (sort && sort !== "priority") devParams.set("sort", sort);

      const regParams = new URLSearchParams({
        page: String(page),
        per_page: String(PER_PAGE),
        status: "active",
      });
      if (filters?.search) regParams.append("search", filters.search);
      if (filters?.listingType)
        regParams.append(
          "listing_type",
          normalizeListingType(filters.listingType),
        );
      if (filters?.type) regParams.append("property_type", filters.type);
      if (sort && sort !== "priority") regParams.set("sort", sort);

      const devFetch = fetch(`/api/developers-properties?${devParams}`);
      // Skip regular listings when a developer filter is active
      const regFetch = devFilter
        ? Promise.resolve(null)
        : fetch(`/api/properties?${regParams}`);

      const [devRes, regRes] = await Promise.allSettled([devFetch, regFetch]);

      let devItems: any[] = [];
      let devMeta: PaginationMeta | null = null;
      if (devRes.status === "fulfilled" && devRes.value?.ok) {
        const d = await devRes.value.json();
        devItems = (d.data ?? []).map((p: any) => ({
          ...p,
          _source: "developer" as const,
        }));
        devMeta = {
          current_page: d.current_page,
          last_page: d.last_page,
          per_page: d.per_page,
          total: d.total,
        };
      }

      let regItems: any[] = [];
      let regMeta: PaginationMeta | null = null;
      if (
        regRes.status === "fulfilled" &&
        regRes.value !== null &&
        regRes.value?.ok
      ) {
        const d = await regRes.value.json();
        regItems = (d.data ?? []).map((p: any) => ({
          ...p,
          _source: "regular" as const,
        }));
        regMeta = {
          current_page: d.current_page,
          last_page: d.last_page,
          per_page: d.per_page,
          total: d.total,
        };
      }

      let merged: any[];
      if (sort === "price_asc") {
        merged = [...devItems, ...regItems].sort(
          (a, b) => Number(a.price ?? 0) - Number(b.price ?? 0),
        );
      } else if (sort === "price_desc") {
        merged = [...devItems, ...regItems].sort(
          (a, b) => Number(b.price ?? 0) - Number(a.price ?? 0),
        );
      } else if (sort === "newest") {
        merged = [...devItems, ...regItems].sort(
          (a, b) =>
            new Date(b.created_at ?? 0).getTime() -
            new Date(a.created_at ?? 0).getTime(),
        );
      } else {
        const devPriority = devItems.filter(
          (p) => p.priority != null && p.priority > 0,
        );
        const devNormal = devItems.filter(
          (p) => p.priority == null || p.priority === 0,
        );
        merged = [...devPriority, ...devNormal, ...regItems];
      }

      setProperties(merged);
      setDevPagination(devMeta);
      setRegPagination(regMeta);
      setCombinedTotal((devMeta?.total ?? 0) + (regMeta?.total ?? 0));
    } catch (error) {
      console.error("Failed to fetch properties:", error);
      setProperties([]);
      setDevPagination(null);
      setRegPagination(null);
      setCombinedTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const searchParamsString = searchParams.toString();
  useEffect(() => {
    const urlParams = new URLSearchParams(searchParamsString);
    const initialDev = urlParams.get("developer_name") ?? "";
    setCurrentPage(1);
    setActiveFilters(null);
    setDeveloperFilter(initialDev);
    setSortBy("priority");
    fetchProperties(null, 1, "priority", initialDev);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsString]);

  const lastPage = Math.max(
    devPagination?.last_page ?? 1,
    regPagination?.last_page ?? 1,
  );
  const isFiltered = !!(activeFilters || developerFilter);
  const activeFilterCount = [activeFilters, developerFilter].filter(
    Boolean,
  ).length;

  const handleSearch = (f: any) => {
    setActiveFilters(f);
    setCurrentPage(1);
    fetchProperties(f, 1, sortBy, developerFilter);
  };
  const handleDeveloperFilter = (v: string) => {
    const next = developerFilter === v ? "" : v;
    setDeveloperFilter(next);
    setCurrentPage(1);
    fetchProperties(activeFilters, 1, sortBy, next);
  };
  const handleSort = (v: string) => {
    setSortBy(v);
    setCurrentPage(1);
    fetchProperties(activeFilters, 1, v, developerFilter);
  };
  const handlePageChange = (p: number) => {
    setCurrentPage(p);
    fetchProperties(activeFilters, p, sortBy, developerFilter);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleClearFilters = () => {
    setDeveloperFilter("");
    setActiveFilters(null);
    setCurrentPage(1);
    fetchProperties(null, 1, sortBy, "");
  };

  return (
    <div
      className="w-full min-h-screen"
      style={{
        background:
          "linear-gradient(145deg,#3d1818 0%,#4a1f1f 50%,#2d1212 100%)",
        fontFamily: "'Georgia', serif",
      }}
    >
      {/* ── Hero ── */}
      <section className="relative pt-28 pb-5 overflow-hidden bg-gradient-to-bl from-red-800/40 from-[10%] via-[#3d0012]/90 via-[70%] to-red-800/60 to-[100%]">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 12px)",
          }}
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20"
          style={{
            background: "radial-gradient(ellipse, #e74c3c 0%, transparent 70%)",
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div
              className="h-px flex-1 max-w-[40px]"
              style={{ background: "rgba(255,120,100,0.4)" }}
            />
            <span
              className="text-white text-[10px] font-bold tracking-[0.35em] uppercase"
              style={{ fontFamily: "monospace" }}
            >
              Alfima Realty Inc. · Property Listings
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">
            {/* LEFT */}
            <div>
              <h1
                className="font-black leading-none mb-6 text-white"
                style={{
                  fontSize: "clamp(3.5rem, 8vw, 7rem)",
                  letterSpacing: "-0.03em",
                  lineHeight: 0.9,
                }}
              >
                <span className="block">Find Your</span>
                <span
                  className="block"
                  style={{
                    WebkitTextStroke: "2px #e46363",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Next Home.
                </span>
              </h1>

              <div className="mb-6 max-w-xl">
                <PropertySearch onSearch={handleSearch} />
              </div>

              {/* ── Developer filters ── */}
              <div className="pb-8">
                <div className="flex items-center gap-3 mb-3">
                  <p
                    className="text-white text-sm font-black tracking-widest uppercase"
                    style={{ fontFamily: "monospace" }}
                  >
                    Filter by Developer
                  </p>
                  <span
                    className="text-white text-sm font-black border border-white/30 px-3 py-0.5 rounded-md"
                    style={{
                      fontFamily: "monospace",
                      background: "rgba(255,255,255,0.12)",
                    }}
                  >
                    Developer listings only
                  </span>
                  {developerFilter !== "" && (
                    <button
                      onClick={() => {
                        setDeveloperFilter("");
                        fetchProperties(activeFilters, 1, sortBy, "");
                      }}
                      className="text-red-400/70 hover:text-red-300 text-xs font-black tracking-widest uppercase transition-all px-2 py-0.5 rounded-md hover:bg-red-900/20"
                      style={{ fontFamily: "monospace" }}
                    >
                      × Clear
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => {
                      setDeveloperFilter("");
                      setCurrentPage(1);
                      fetchProperties(activeFilters, 1, sortBy, "");
                    }}
                    className={`inline-flex items-center gap-2 px-5 py-1.5 rounded-full text-sm font-black tracking-wide border-2 transition-all duration-200 cursor-pointer ${
                      developerFilter === ""
                        ? "text-white border-white/50"
                        : "border-white/20 text-white/70 hover:text-white hover:border-white/40"
                    }`}
                    style={
                      developerFilter === ""
                        ? { background: "rgba(255,255,255,0.15)" }
                        : { background: "rgba(255,255,255,0.06)" }
                    }
                  >
                    All
                  </button>

                  {developersLoading
                    ? [...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-10 rounded-full animate-pulse"
                          style={{
                            width: `${80 + i * 20}px`,
                            background: "rgba(255,255,255,0.06)",
                            border: "2px solid rgba(255,255,255,0.08)",
                          }}
                        />
                      ))
                    : developerList.map((name) => (
                        <button
                          key={name}
                          onClick={() => handleDeveloperFilter(name)}
                          className={`inline-flex items-center gap-2 px-5 py-1.5 rounded-full text-sm font-black tracking-wide border-2 transition-all duration-200 cursor-pointer ${
                            developerFilter === name
                              ? "text-white border-emerald-400 shadow-lg shadow-emerald-900/40"
                              : "border-white/20 text-white/70 hover:text-white hover:border-white/40"
                          }`}
                          style={
                            developerFilter === name
                              ? {
                                  background:
                                    "linear-gradient(135deg, #059669, #047857)",
                                }
                              : { background: "rgba(255,255,255,0.06)" }
                          }
                        >
                          {name}
                        </button>
                      ))}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="hidden lg:block pb-0">
              {isFiltered ? (
                <div
                  className="rounded-2xl overflow-hidden flex flex-col"
                  style={{
                    minHeight: "340px",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <div
                    className="flex items-center justify-between px-4 py-3.5"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-1.5 h-8 rounded-full"
                        style={{
                          background:
                            "linear-gradient(to bottom, #e74c3c, #96281b)",
                        }}
                      />
                      <div>
                        <p
                          className="text-white/40 text-[9px] font-bold tracking-[0.3em] uppercase"
                          style={{ fontFamily: "monospace" }}
                        >
                          Top results
                        </p>
                        <p
                          className="text-white font-black text-lg leading-tight"
                          style={{ fontFamily: "Georgia, serif" }}
                        >
                          {loading ? "…" : combinedTotal.toLocaleString()}
                          <span className="text-white/40 text-xs font-normal ml-1">
                            {combinedTotal === 1 ? "property" : "properties"}
                          </span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleClearFilters}
                      className="text-white/60 hover:text-white text-[10px] font-black tracking-widest uppercase transition-all px-3 py-1.5 rounded-lg hover:bg-white/10"
                      style={{ fontFamily: "monospace" }}
                    >
                      × Clear
                      {activeFilterCount > 1 ? ` (${activeFilterCount})` : ""}
                    </button>
                  </div>

                  <div className="flex flex-col flex-1">
                    {loading
                      ? [...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 px-4 py-3 animate-pulse"
                            style={{
                              borderBottom: "1px solid rgba(255,255,255,0.05)",
                            }}
                          >
                            <div
                              className="w-12 h-12 rounded-lg shrink-0"
                              style={{ background: "rgba(255,255,255,0.08)" }}
                            />
                            <div className="flex-1 flex flex-col gap-1.5">
                              <div
                                className="h-3 rounded-md"
                                style={{
                                  background: "rgba(255,255,255,0.1)",
                                  width: "55%",
                                }}
                              />
                              <div
                                className="h-2.5 rounded-md"
                                style={{
                                  background: "rgba(255,255,255,0.06)",
                                  width: "80%",
                                }}
                              />
                            </div>
                          </div>
                        ))
                      : properties
                          .slice(0, 4)
                          .map((p: any, idx) => (
                            <PreviewRow
                              key={`${p._source}-${p.id}`}
                              p={p}
                              idx={idx}
                              isLast={
                                idx === Math.min(3, properties.length - 1)
                              }
                            />
                          ))}

                    {!loading && combinedTotal > 4 && (
                      <div className="px-4 py-3 mt-auto text-center">
                        <p
                          className="text-white/30 text-[11px]"
                          style={{ fontFamily: "monospace" }}
                        >
                          + {(combinedTotal - 4).toLocaleString()} more below ↓
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <HeroPanel total={combinedTotal} loading={loading} />
              )}
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg
            viewBox="0 0 1440 48"
            preserveAspectRatio="none"
            className="w-full h-12"
            fill="#3d1a1a"
          >
            <path d="M0,48 C480,0 960,48 1440,16 L1440,48 Z" />
          </svg>
        </div>
      </section>

      {/* ── Ticker ── */}
      <StatTicker total={combinedTotal} />

      {/* ── Results ── */}
      <section className="py-10 bg-gradient-to-t from-[#8b1a1a]/90 from-[20%] to-red-800/30 to-[100%]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Active developer filter badge */}
          {developerFilter && (
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <span
                className="text-white/25 text-[10px] font-bold tracking-widest uppercase"
                style={{ fontFamily: "monospace" }}
              >
                Developer filter:
              </span>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white border border-emerald-500/40"
                style={{ background: "rgba(5,150,105,0.25)" }}
              >
                {developerFilter}
                <button
                  onClick={() => {
                    setDeveloperFilter("");
                    setCurrentPage(1);
                    fetchProperties(activeFilters, 1, sortBy, "");
                  }}
                  className="text-white/50 hover:text-white ml-0.5"
                >
                  ×
                </button>
              </span>
              <span
                className="text-white/20 text-[10px]"
                style={{ fontFamily: "monospace" }}
              >
                · Regular listings unaffected
              </span>
            </div>
          )}

          {/* Source breakdown summary bar */}
          {!loading && !developerFilter && (devPagination || regPagination) && (
            <div
              className="flex flex-col sm:flex-row items-stretch gap-0 mb-8 rounded-2xl overflow-hidden"
              style={{
                border: "1.5px solid rgba(192,57,43,0.35)",
                background: "rgba(0,0,0,0.35)",
              }}
            >
              <div
                className="flex-1 flex items-center gap-5 px-7 py-5"
                style={{
                  background: "rgba(192,57,43,0.12)",
                  borderRight: "1.5px solid rgba(192,57,43,0.25)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: "rgba(192,57,43,0.28)",
                    border: "1.5px solid rgba(192,57,43,0.45)",
                  }}
                >
                  <Building2 className="w-6 h-6 text-red-300" />
                </div>
                <div>
                  <p
                    className="text-white font-black leading-none"
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: "2.25rem",
                    }}
                  >
                    {(devPagination?.total ?? 0).toLocaleString()}
                  </p>
                  <p
                    className="text-white text-sm font-black tracking-widest uppercase mt-1"
                    style={{ fontFamily: "monospace" }}
                  >
                    Developer Listings
                  </p>
                  <p
                    className="text-white/45 text-xs mt-1"
                    style={{ fontFamily: "monospace" }}
                  >
                    Use filter above to narrow by developer
                  </p>
                </div>
              </div>

              <div
                className="flex items-center justify-center px-5 py-3 shrink-0"
                style={{ background: "rgba(0,0,0,0.15)" }}
              >
                <span
                  className="text-white/35 text-3xl font-black select-none"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  +
                </span>
              </div>

              <div
                className="flex-1 flex items-center gap-5 px-7 py-5"
                style={{
                  background: "rgba(37,99,235,0.09)",
                  borderLeft: "1.5px solid rgba(37,99,235,0.2)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: "rgba(37,99,235,0.2)",
                    border: "1.5px solid rgba(37,99,235,0.35)",
                  }}
                >
                  <Home className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <p
                    className="text-white font-black leading-none"
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: "2.25rem",
                    }}
                  >
                    {(regPagination?.total ?? 0).toLocaleString()}
                  </p>
                  <p
                    className="text-blue-200/80 text-sm font-black tracking-widest uppercase mt-1"
                    style={{ fontFamily: "monospace" }}
                  >
                    Individual Listings
                  </p>
                  <p
                    className="text-white/45 text-xs mt-1"
                    style={{ fontFamily: "monospace" }}
                  >
                    Direct owner &amp; agent listings
                  </p>
                </div>
              </div>

              <div
                className="flex items-center justify-center px-8 py-5 shrink-0 border-l border-red-900/30"
                style={{ background: "rgba(0,0,0,0.3)", minWidth: "110px" }}
              >
                <div className="text-center">
                  <p
                    className="text-red-400 font-black leading-none"
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: "2.75rem",
                    }}
                  >
                    {combinedTotal.toLocaleString()}
                  </p>
                  <p
                    className="text-white/50 text-sm font-black tracking-widest uppercase mt-1"
                    style={{ fontFamily: "monospace" }}
                  >
                    Total
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-1 h-6 rounded-full"
                style={{
                  background: "linear-gradient(to bottom, #e74c3c, #96281b)",
                }}
              />
              <p
                className="text-white text-sm font-medium"
                style={{ fontFamily: "monospace" }}
              >
                {loading ? (
                  <span className="text-white/40">Loading…</span>
                ) : (
                  <>
                    <span
                      className="text-red-400 font-black text-xl"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {combinedTotal.toLocaleString()}
                    </span>
                    <span className="text-white ml-1.5">
                      {combinedTotal === 1 ? "property" : "properties"}
                    </span>
                    {lastPage > 1 && (
                      <span className="text-white ml-2 text-xs">
                        · p.{currentPage}/{lastPage}
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 border border-red-900/40 rounded-xl px-3 py-2"
                style={{ background: "rgba(80,10,10,0.4)" }}
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-red-500/60" />
                <select
                  value={sortBy}
                  onChange={(e) => handleSort(e.target.value)}
                  className="bg-transparent text-white/70 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option
                      key={o.value}
                      value={o.value}
                      style={{ background: "#2d0a0a" }}
                    >
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="flex border border-red-900/40 rounded-xl overflow-hidden"
                style={{ background: "rgba(80,10,10,0.4)" }}
              >
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-colors ${viewMode === "grid" ? "text-white" : "text-white/30 hover:text-white/60"}`}
                  style={
                    viewMode === "grid"
                      ? { background: "rgba(192,57,43,0.5)" }
                      : {}
                  }
                >
                  <Grid3x3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-colors ${viewMode === "list" ? "text-white" : "text-white/30 hover:text-white/60"}`}
                  style={
                    viewMode === "list"
                      ? { background: "rgba(192,57,43,0.5)" }
                      : {}
                  }
                >
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid / List */}
          {loading ? (
            <div
              className={`grid gap-5 ${
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              }`}
            >
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="h-72 rounded-2xl animate-pulse border border-red-900/20"
                  style={{
                    background:
                      "linear-gradient(135deg, #4a1f1f 0%, #3d1a1a 100%)",
                  }}
                />
              ))}
            </div>
          ) : properties.length > 0 ? (
            (() => {
              const devProps = properties.filter(
                (p) => p._source === "developer",
              );
              const regProps = properties.filter(
                (p) => p._source === "regular",
              );
              const gridClass = `grid gap-5 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`;

              return (
                <div className="mb-12">
                  {/* Developer Listings */}
                  {devProps.length > 0 && (
                    <div className="mb-10">
                      <div className="flex items-center gap-4 mb-5">
                        <div
                          className="flex items-center gap-3 px-4 py-2 rounded-xl"
                          style={{
                            background: "rgba(192,57,43,0.15)",
                            border: "1px solid rgba(192,57,43,0.3)",
                          }}
                        >
                          <Building2 className="w-4 h-4 text-red-400" />
                          <span
                            className="text-white font-black text-sm tracking-wide"
                            style={{ fontFamily: "Georgia, serif" }}
                          >
                            Developer Listings
                          </span>
                          <span
                            className="text-red-300/70 font-bold text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: "rgba(192,57,43,0.3)",
                              fontFamily: "monospace",
                            }}
                          >
                            {devPagination?.total ?? devProps.length}
                          </span>
                        </div>
                        {developerFilter && (
                          <span
                            className="text-xs font-bold px-3 py-1.5 rounded-full text-white border border-emerald-500/40"
                            style={{
                              background: "rgba(5,150,105,0.2)",
                              fontFamily: "monospace",
                            }}
                          >
                            Filtered: {developerFilter}
                          </span>
                        )}
                        <div
                          className="flex-1 h-px"
                          style={{ background: "rgba(192,57,43,0.2)" }}
                        />
                      </div>
                      <div className={gridClass}>
                        {devProps.map((p, idx) => (
                          <PropertyCard
                            key={`developer-${p.id}`}
                            property={p}
                            priority={idx < 3}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  {devProps.length > 0 && regProps.length > 0 && (
                    <div className="flex items-center gap-4 my-8">
                      <div
                        className="flex-1 h-px"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      />
                      <span
                        className="text-white/15 text-[10px] font-bold tracking-[0.3em] uppercase px-4"
                        style={{ fontFamily: "monospace" }}
                      >
                        Also available
                      </span>
                      <div
                        className="flex-1 h-px"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      />
                    </div>
                  )}

                  {/* Individual Listings */}
                  {regProps.length > 0 && (
                    <div>
                      <div className="flex items-center gap-4 mb-5">
                        <div
                          className="flex items-center gap-3 px-4 py-2 rounded-xl"
                          style={{
                            background: "rgba(37,99,235,0.12)",
                            border: "1px solid rgba(37,99,235,0.22)",
                          }}
                        >
                          <Home className="w-4 h-4 text-blue-400" />
                          <span
                            className="text-white font-black text-sm tracking-wide"
                            style={{ fontFamily: "Georgia, serif" }}
                          >
                            Individual Listings
                          </span>
                          <span
                            className="text-blue-300/70 font-bold text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: "rgba(37,99,235,0.25)",
                              fontFamily: "monospace",
                            }}
                          >
                            {regPagination?.total ?? regProps.length}
                          </span>
                        </div>
                        <span
                          className="text-white/20 text-[10px]"
                          style={{ fontFamily: "monospace" }}
                        >
                          Direct owner &amp; agent listings
                        </span>
                        <div
                          className="flex-1 h-px"
                          style={{ background: "rgba(37,99,235,0.15)" }}
                        />
                      </div>
                      <div className={gridClass}>
                        {regProps
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
                          .map((p, idx) => (
                            <PropertyCard
                              key={`regular-${p.id}`}
                              property={p}
                              priority={idx < 3}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Pagination */}
                  {lastPage > 1 && (
                    <div className="flex items-center justify-center gap-2 flex-wrap pt-8 border-t border-red-900/20 mt-8">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-25 disabled:cursor-not-allowed transition border border-red-900/40 hover:border-red-700/60"
                        style={{
                          background: "rgba(80,10,10,0.4)",
                          fontFamily: "monospace",
                        }}
                      >
                        ← Prev
                      </button>

                      {Array.from({ length: lastPage }, (_, i) => i + 1)
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === lastPage ||
                            Math.abs(p - currentPage) <= 2,
                        )
                        .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                          if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                            acc.push("ellipsis");
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p, idx) =>
                          p === "ellipsis" ? (
                            <span
                              key={`e-${idx}`}
                              className="px-2 text-white/20"
                              style={{ fontFamily: "monospace" }}
                            >
                              …
                            </span>
                          ) : (
                            <button
                              key={p}
                              onClick={() => handlePageChange(p as number)}
                              className="w-9 h-9 rounded-xl text-sm font-bold transition border"
                              style={
                                currentPage === p
                                  ? {
                                      background:
                                        "linear-gradient(135deg,#c0392b,#96281b)",
                                      borderColor: "rgba(192,57,43,0.5)",
                                      color: "white",
                                      fontFamily: "monospace",
                                    }
                                  : {
                                      background: "rgba(80,10,10,0.35)",
                                      borderColor: "rgba(180,30,30,0.25)",
                                      color: "rgba(255,255,255,0.5)",
                                      fontFamily: "monospace",
                                    }
                              }
                            >
                              {p}
                            </button>
                          ),
                        )}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === lastPage}
                        className="px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-25 disabled:cursor-not-allowed transition border border-red-900/40 hover:border-red-700/60"
                        style={{
                          background: "rgba(80,10,10,0.4)",
                          fontFamily: "monospace",
                        }}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div
              className="rounded-2xl p-16 text-center border border-red-900/30"
              style={{
                background: "linear-gradient(135deg, #1e0808 0%, #110404 100%)",
              }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{
                  background: "rgba(192,57,43,0.12)",
                  border: "1px solid rgba(192,57,43,0.25)",
                }}
              >
                <Home className="w-8 h-8 text-red-500/50" />
              </div>
              <p
                className="text-2xl text-white font-black mb-2"
                style={{ fontFamily: "Georgia, serif" }}
              >
                No properties found
              </p>
              <p className="text-white/30 text-sm mb-6">
                Try adjusting your filters or clearing the active filter
              </p>
              {(developerFilter || activeFilters) && (
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-2 text-white font-bold px-6 py-2.5 rounded-full border border-red-600/40 hover:border-red-400 transition text-sm"
                  style={{
                    background: "linear-gradient(135deg,#c0392b,#96281b)",
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense
      fallback={
        <div
          className="w-full min-h-screen flex items-center justify-center"
          style={{ background: "#150808" }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
            <p
              className="text-white/30 text-xs tracking-widest uppercase"
              style={{ fontFamily: "monospace" }}
            >
              Loading properties
            </p>
          </div>
        </div>
      }
    >
      <PropertiesPageInner />
    </Suspense>
  );
}
