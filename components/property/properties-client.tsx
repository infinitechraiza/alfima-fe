// app/property/properties-client.tsx

"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PropertyCard } from "@/components/property/property-card";
import { PropertySearch } from "@/components/property/property-search";
import { useAuth } from "@/lib/store";
import { normalizeSource } from "@/components/developer-property-card";
import {
  Home,
  ArrowUpDown,
  MapPin,
  ArrowRight,
  Grid3x3,
  LayoutList,
  Heart,
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

function thumbUrl(url: string, w = 400, h = 300): string {
  if (!url) return url;
  if (url.includes("cloudinary.com")) {
    return url.replace(
      "/upload/",
      `/upload/w_${w},h_${h},c_fill,f_auto,q_auto:good/`,
    );
  }
  return url;
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
  raw_id?: number | string;
  title: string;
  listing_type?: string;
  listingType?: string;
  price?: number;
  price_per_month?: number;
  pricePerMonth?: number;
  city?: string;
  state?: string;
  images?: { url: string }[];
  thumbnail?: string;
  blur_hash?: string;
  priority?: number | null;
  address?: string;
  _source?: string;
  source?: string;
}

interface FavoriteRecord {
  property_id: number | string;
  source: "property" | "developer_property";
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
  const API_BASE = (
    process.env.NEXT_PUBLIC_API_IMG ?? "http://localhost:8000"
  ).replace(/\/$/, "");

  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteLoaded, setFavoriteLoaded] = useState(false);

  const source = normalizeSource(p._source ?? p.source ?? "property");
  const favoritePropertyId =
    source === "developer_property" ? (p.raw_id ?? p.id) : p.id;

  // ───────────────────────────────────────────
  // LOAD FAVORITE STATE
  // ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadFavorite() {
      setFavoriteLoaded(false);

      try {
        const res = await fetch("/api/favorites", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        // Not logged in
        if (res.status === 401) {
          if (!cancelled) {
            setIsFavorite(false);
            setFavoriteLoaded(true);
          }
          return;
        }

        // Other API error
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          console.error("Failed to load favorites:", {
            status: res.status,
            error: errorData,
          });

          if (!cancelled) {
            setIsFavorite(false);
            setFavoriteLoaded(true);
          }
          return;
        }

        // Successfully authenticated
        const favorites: unknown = await res.json();

        if (!Array.isArray(favorites)) {
          console.error("Unexpected favorites response:", favorites);
          if (!cancelled) {
            setIsFavorite(false);
            setFavoriteLoaded(true);
          }
          return;
        }

        const exists = favorites.some((favorite: FavoriteRecord) => {
          return (
            String(favorite.property_id) === String(favoritePropertyId) &&
            normalizeSource(favorite.source) === source
          );
        });

        if (!cancelled) {
          setIsFavorite(exists);
          setFavoriteLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load favorites:", error);
        if (!cancelled) {
          setIsFavorite(false);
          setFavoriteLoaded(true);
        }
      }
    }

    if (user) {
      loadFavorite();
    } else {
      setIsFavorite(false);
      setFavoriteLoaded(true);
    }

    return () => {
      cancelled = true;
    };
  }, [favoritePropertyId, source, user]);

  // ───────────────────────────────────────────
  // TOGGLE FAVORITE
  // ───────────────────────────────────────────
  async function handleFavorite(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (favoriteLoading || !favoriteLoaded) {
      return;
    }

    const previousValue = isFavorite;

    // Optimistic UI update
    setIsFavorite(!previousValue);
    setFavoriteLoading(true);

    try {
      const payload = {
        property_id: Number(favoritePropertyId),
        source: source,
      };

      const res = await fetch("/api/favorites/toggle", {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        // Revert optimistic update.
        setIsFavorite(previousValue);
        if (res.status === 401) {
          console.error("User is not authenticated.");
        } else {
          console.error("Failed to toggle favorite:", data);
        }
        return;
      }
    } catch (error) {
      // Revert optimistic update on network/unexpected error.
      setIsFavorite(previousValue);
      console.error("Failed to toggle favorite:", error);
    } finally {
      setFavoriteLoading(false);
    }
  }

  const isRent = (p.listing_type ?? "").toLowerCase().includes("rent");
  const rawPrice = Number(
    isRent ? (p.price_per_month ?? p.price ?? 0) : (p.price ?? 0),
  );

  const rawImageUrl = p.images?.[0]?.url ?? p.thumbnail ?? "";
  const absoluteImageUrl = rawImageUrl.startsWith("http")
    ? rawImageUrl
    : rawImageUrl
      ? `${API_BASE}/${rawImageUrl.replace(/^\//, "")}`
      : "";
  const imageUrl = thumbUrl(absoluteImageUrl, 96, 96);

  return (
    <Link
      href={`/property/${p.id}`}
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
            className="object-cover"
            unoptimized={imageUrl.includes("localhost")}
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
        </div>

        <p className="text-white/70 text-xs line-clamp-1 mt-0.5">{p.title}</p>
        {p.address && (
          <p className="text-white/35 text-[10px] mt-0.5 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 shrink-0 text-red-400/60" />
            {p.address}
          </p>
        )}
      </div>

      {user && (
        <button
          type="button"
          onClick={handleFavorite}
          disabled={favoriteLoading || !favoriteLoaded}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={isFavorite}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/70 shrink-0 transition hover:bg-white/20 disabled:opacity-60"
        >
          <Heart
            className={`h-3.5 w-3.5 ${
              isFavorite ? "fill-red-500 text-red-500" : ""
            }`}
          />
        </button>
      )}

      <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-red-400 transition-colors shrink-0" />
    </Link>
  );
}

// ── Inner page ────────────────────────────────────────────────────────────────
function PropertiesPageInner() {
  const searchParams = useSearchParams();

  const [properties, setProperties] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<any>(null);
  const [sortBy, setSortBy] = useState("priority");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const fetchProperties = async (filters?: any, page = 1, sort = sortBy) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("per_page", "12");
      params.append("status", "active");

      if (filters?.search) params.append("search", filters.search);
      if (filters?.name) params.append("name", filters.name);
      if (filters?.listingType)
        params.append(
          "listing_type",
          normalizeListingType(filters.listingType),
        );
      if (filters?.type) params.append("property_type", filters.type);
      if (filters?.minPrice != null)
        params.append("min_price", String(filters.minPrice));
      if (filters?.maxPrice != null)
        params.append("max_price", String(filters.maxPrice));

      // NOTE: "bedrooms" can arrive as either a label string from HeroSearch
      // ("3 Bedrooms" / "Studio" / "5+ Bedrooms") or a plain number from the
      // in-page PropertySearch filter panel (0 = Studio, 1-5 = "N+"). Do NOT
      // coerce it with Number()/String() truthiness checks:
      //  - Number("3 Bedrooms") is NaN, which serializes to the literal
      //    string "NaN" and silently disables the developer-table bedroom
      //    filter server-side (see PropertyController::indexMerged).
      //  - `if (filters?.bedrooms)` treats the number 0 (Studio) as falsy
      //    and drops the filter entirely, so selecting "Studio" showed
      //    every property instead of just studios.
      // A plain undefined/null/empty-string check avoids both problems.
      if (
        filters?.bedrooms !== undefined &&
        filters?.bedrooms !== null &&
        filters?.bedrooms !== ""
      )
        params.append("bedrooms", String(filters.bedrooms));

      if (filters?.city) params.append("city", filters.city);
      // Forward scope=all so results include developer_properties too —
      // previously dropped here even though it was present in the URL,
      // because this function rebuilds params from `filters` rather than
      // passing the URL query string straight through.
      if (filters?.scope) params.append("scope", filters.scope);
      if (sort && sort !== "priority") params.set("sort", sort);

      const res = await fetch(`/api/properties?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      // FIX: this used to map every row to `_source: "regular"`,
      // unconditionally overwriting the real value the backend sent
      // (source: "agent" | "developer" — see
      // PropertyController::transformMergedCollection). PropertyCard reads
      // `_source` first when deciding the detail-page route, so every card
      // — including developer-sourced ones — was being treated as a plain
      // "property" and linked to /properties/developer-523 instead of
      // /developer/523. Pass the real source through unchanged.
      setProperties(
        (data.data ?? []).map((p: any) => ({ ...p, _source: p.source })),
      );
      setPagination({
        current_page: data.current_page,
        last_page: data.last_page,
        per_page: data.per_page,
        total: data.total,
      });
    } catch (error) {
      console.error("Failed to fetch properties:", error);
      setProperties([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const searchParamsString = searchParams.toString();
  useEffect(() => {
    const urlParams = new URLSearchParams(searchParamsString);
    const initialFilters: any = {};

    const listingType = urlParams.get("listingType");
    const search = urlParams.get("search");
    const name = urlParams.get("name");
    const type = urlParams.get("type");
    const minPrice = urlParams.get("minPrice");
    const maxPrice = urlParams.get("maxPrice");
    const bedrooms = urlParams.get("bedrooms");
    const city = urlParams.get("city");
    // Was previously never read from the URL, so a Hero search that
    // navigated here with ?scope=all lost the flag at this step.
    const scope = urlParams.get("scope");

    if (listingType) initialFilters.listingType = listingType;
    if (search) initialFilters.search = search;
    if (name) initialFilters.name = name;
    if (type) initialFilters.type = type;
    if (minPrice) initialFilters.minPrice = Number(minPrice);
    if (maxPrice) initialFilters.maxPrice = Number(maxPrice);
    // FIX: keep the raw label string ("3 Bedrooms", "Studio", "5+ Bedrooms").
    // This used to be Number(bedrooms), which is NaN for every valid value
    // this field can hold, and caused the developer-inventory bedroom
    // filter to be silently skipped server-side (see note in
    // fetchProperties above for the full mechanism).
    if (bedrooms) initialFilters.bedrooms = bedrooms;
    if (city) initialFilters.city = city;
    if (scope) initialFilters.scope = scope;

    const hasFilters = Object.keys(initialFilters).length > 0;

    setCurrentPage(1);
    setActiveFilters(hasFilters ? initialFilters : null);
    setSortBy("priority");
    fetchProperties(hasFilters ? initialFilters : null, 1, "priority");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsString]);

  const total = pagination?.total ?? 0;
  const lastPage = pagination?.last_page ?? 1;
  const isFiltered = !!activeFilters;

  const handleSearch = (f: any) => {
    setActiveFilters(f);
    setCurrentPage(1);
    fetchProperties(f, 1, sortBy);
  };

  const handleSort = (v: string) => {
    setSortBy(v);
    setCurrentPage(1);
    fetchProperties(activeFilters, 1, v);
  };

  const handlePageChange = (p: number) => {
    setCurrentPage(p);
    fetchProperties(activeFilters, p, sortBy);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => {
    setActiveFilters(null);
    setCurrentPage(1);
    fetchProperties(null, 1, sortBy);
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
      <section className="relative pt-28 overflow-hidden bg-gradient-to-bl from-red-800/40 from-[10%] via-[#3d0012]/90 via-[70%] to-red-800/60 to-[100%]">
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 relative z-10">
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
                <span className="block">Next Home.</span>
              </h1>

              <div className="mb-8 max-w-xl">
                <PropertySearch onSearch={handleSearch} />
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
                          {loading ? "…" : total.toLocaleString()}
                          <span className="text-white/40 text-xs font-normal ml-1">
                            {total === 1 ? "property" : "properties"}
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
                              key={p.id}
                              p={p}
                              idx={idx}
                              isLast={
                                idx === Math.min(3, properties.length - 1)
                              }
                            />
                          ))}

                    {!loading && total > 4 && (
                      <div className="px-4 py-3 mt-auto text-center">
                        <p
                          className="text-white/30 text-[11px]"
                          style={{ fontFamily: "monospace" }}
                        >
                          + {(total - 4).toLocaleString()} more below ↓
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <HeroPanel total={total} loading={loading} />
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
      <StatTicker total={total} />

      {/* ── Results ── */}
      <section className="py-10 bg-gradient-to-t from-[#8b1a1a]/90 from-[20%] to-red-800/30 to-[100%]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                      {total.toLocaleString()}
                    </span>
                    <span className="text-white ml-1.5">
                      {total === 1 ? "property" : "properties"}
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
              {/* Sort */}
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

              {/* View toggle */}
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
            <>
              <div
                className={`grid gap-5 mb-12 ${
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-1"
                }`}
              >
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
                  .map((p, idx) => (
                    <PropertyCard key={p.id} property={p} priority={idx < 3} />
                  ))}
              </div>

              {/* Pagination */}
              {lastPage > 1 && (
                <div className="flex items-center justify-center gap-2 flex-wrap pt-4 border-t border-red-900/20">
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
            </>
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
                Try adjusting your filters or search terms
              </p>
              {activeFilters && (
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
