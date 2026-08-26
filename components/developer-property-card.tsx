// components/developer-property-card.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Property } from "@/lib/types";
import { MapPin, Bed, Bath, Heart, Ruler } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/store";

interface PropertyCardProps {
  property: Property;
  priority?: boolean;
  initialFavorite?: boolean;
  // Top-slot cards (favorited-first / high-priority order — see
  // FeaturedProperties' FEATURED_COUNT) get a slightly elevated visual
  // treatment: gold ring + glow + a small "Top Pick" badge. Separate from
  // `priority`, which only controls Next/Image eager loading.
  featured?: boolean;
}
type FavoriteSource = "property" | "developer_property";

interface FavoriteRecord {
  property_id: number | string;
  source: FavoriteSource;
}

const BLUR_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8'%3ENo Image%3C/text%3E%3C/svg%3E";

// NOTE: was NEXT_PUBLIC_API_IMG — switched to NEXT_PUBLIC_API_URL to match
// every other file in the app (property-details-page.tsx, app/developer/page.tsx).
// A mismatched env var here meant this fell back to localhost:8000 in prod.
const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

// ── Tag colors — mirrors the admin PropertyFormModal's TAG_COLOR_OPTIONS ──
interface PropertyTag {
  id?: number;
  label: string;
  color: string;
  active?: boolean;
}

const TAG_COLOR_OPTIONS: { value: string; classes: string }[] = [
  { value: "red", classes: "bg-red-100 text-red-700 border-red-300" },
  { value: "blue", classes: "bg-blue-100 text-blue-700 border-blue-300" },
  {
    value: "emerald",
    classes: "bg-emerald-100 text-emerald-700 border-emerald-300",
  },
  { value: "amber", classes: "bg-amber-100 text-amber-700 border-amber-300" },
  {
    value: "violet",
    classes: "bg-violet-100 text-violet-700 border-violet-300",
  },
  { value: "pink", classes: "bg-pink-100 text-pink-700 border-pink-300" },
  {
    value: "orange",
    classes: "bg-orange-100 text-orange-700 border-orange-300",
  },
  { value: "slate", classes: "bg-slate-200 text-slate-700 border-slate-300" },
];

function getTagColorClasses(color?: string): string {
  return (
    TAG_COLOR_OPTIONS.find((c) => c.value === color)?.classes ??
    "bg-slate-100 text-slate-600 border-slate-300"
  );
}

/**
 * Guarantees a usable, browser-reachable image URL.
 * - Absolute localhost:8000 URLs → rewritten through the Next.js /img-proxy
 *   rewrite (same pattern as cdnUrl() in property-details-page.tsx), since
 *   a raw localhost:8000 link only resolves on the machine running the
 *   backend — not in a real user's browser.
 * - Other absolute (http/https) URLs → returned as-is.
 * - Relative path ("agents/avatars/abc.jpg" or "/agents/avatars/abc.jpg")
 *   → prepended with NEXT_PUBLIC_API_URL.
 * - null / undefined / empty → FALLBACK_IMG
 */
function toAbsoluteUrl(url: string | null | undefined): string {
  if (!url) return FALLBACK_IMG;

  let resolved = url;

  if (resolved.includes("localhost:8000")) {
    resolved = resolved.replace("http://localhost:8000", "/img-proxy");
  }

  if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
    return resolved;
  }

  const cleanPath = resolved.replace(/^\//, "");
  return `${API_BASE}/${cleanPath}`;
}

function parsePrice(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    if (value.includes("-")) {
      const [min] = value.split("-");
      return parseFloat(min.replace(/[^\d.]/g, "")) || 0;
    }
    return parseFloat(value.replace(/[^\d.]/g, "")) || 0;
  }
  return 0;
}

function formatPrice(amount: number): string {
  if (!amount || isNaN(amount)) return "₱0";
  if (amount >= 1_000_000_000) {
    const v = amount / 1_000_000_000;
    return `₱${v % 1 === 0 ? v.toFixed(0) : v.toFixed(2)}B`;
  }
  if (amount >= 1_000_000) {
    const v = amount / 1_000_000;
    return `₱${v % 1 === 0 ? v.toFixed(0) : v.toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    const v = amount / 1_000;
    return `₱${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}K`;
  }
  return `₱${amount.toLocaleString("en-PH")}`;
}

function normalizeTags(val: unknown): PropertyTag[] {
  let arr: unknown[] = [];

  if (Array.isArray(val)) {
    arr = val;
  } else if (typeof val === "string" && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      arr = Array.isArray(parsed) ? parsed : [];
    } catch {
      arr = [];
    }
  }

  return arr.filter(
    (t): t is PropertyTag =>
      !!t &&
      typeof t === "object" &&
      typeof (t as PropertyTag).label === "string" &&
      (t as PropertyTag).label.trim().length > 0,
  );
}

// Normalize whatever the backend/property object sends (_source / source)
// into exactly the two values FavoriteSource allows. Upstream data has been
// observed as "developer", "developer-property", and "developer_property"
// for the same concept — collapse all of those to "developer_property" so
// the href, the favorites lookup, and the toggle payload never disagree.
export function normalizeSource(raw: unknown): FavoriteSource {
  const value = String(raw ?? "property")
    .replace(/-/g, "_")
    .toLowerCase();
  return value.startsWith("developer") ? "developer_property" : "property";
}

export function getFavoriteKey(property: Property): string {
  const source = normalizeSource(
    (property as any)._source ?? (property as any).source ?? "developer",
  );
  const id =
    source === "developer_property"
      ? (property.raw_id ?? property.id)
      : property.id;
  return `${source}:${id}`;
}

export function PropertyCard({
  property,
  priority = false,
  featured = false,
}: PropertyCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteLoaded, setFavoriteLoaded] = useState(false);
  const { user } = useAuth();

  const source: FavoriteSource = normalizeSource(
    (property as any)._source ?? (property as any).source ?? "developer",
  );

  const propertyHref =
    source === "developer_property"
      ? `/developer/${property.raw_id ?? property.id}`
      : `/property/${property.id}`;

  const resolvedImageUrl = toAbsoluteUrl(
    property.thumbnail ?? property.images?.[0]?.url,
  );

  const rawImageUrl = imageError ? FALLBACK_IMG : resolvedImageUrl;

  // Reset the broken-image fallback whenever the underlying image source
  // actually changes (e.g. this card instance gets reused for a different
  // property in a filtered/re-sorted list). Without this, once a card hits
  // an error it stays on FALLBACK_IMG forever even after `property` changes.
  useEffect(() => {
    setImageError(false);
  }, [resolvedImageUrl]);

  const agentAvatarUrl = toAbsoluteUrl(property.agent?.avatar);

  const listingType = property.listing_type ?? property.listingType;
  const isRent = listingType === "rent";

  const rawValue: string | number | null | undefined = isRent
    ? (property.price_per_month ?? property.pricePerMonth ?? property.price)
    : (property.price ?? property.price_per_month ?? property.pricePerMonth);

  let priceDisplay = "";

  const stringValue = String(rawValue ?? "");

  if (stringValue.includes("-")) {
    const parts = stringValue.split("-");
    const min = parsePrice(parts[0]);
    const max = parsePrice(parts[1]);
    priceDisplay = isRent
      ? `${formatPrice(min)}–${formatPrice(max)}/mo`
      : `${formatPrice(min)}–${formatPrice(max)}`;
  } else {
    const parsed = parsePrice(rawValue);
    priceDisplay = isRent ? `${formatPrice(parsed)}/mo` : formatPrice(parsed);
  }

  const activeTags: PropertyTag[] = normalizeTags(
    (property as { tags?: unknown }).tags,
  ).filter((t) => t.active ?? true);

  const favoritePropertyId =
    source === "developer_property"
      ? (property.raw_id ?? property.id)
      : property.id;

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

    loadFavorite();
    return () => {
      cancelled = true;
    };
  }, [favoritePropertyId, source]);

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

  return (
    <Link href={propertyHref} className="block h-full">
      <div
        className={`flex flex-col h-full backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 group cursor-pointer ${
          featured
            ? "bg-amber-400/10 border-[3px] border-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.25),0_8px_28px_rgba(251,191,36,0.35)] hover:bg-amber-400/15"
            : "bg-white/10 border border-white/20 hover:shadow-2xl hover:bg-white/15"
        }`}
      >
        {/* Image */}
        <div className="relative h-54 overflow-hidden flex-shrink-0">
          <Image
            src={rawImageUrl}
            unoptimized
            alt={property.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            className="object-cover group-hover:scale-110 transition duration-300"
            onError={() => setImageError(true)}
          />

          {/* Top Pick badge — only for featured (top-slot) cards */}
          {/* {featured && (
            <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-amber-400/95 px-2.5 py-1 text-[11px] font-bold text-amber-950 shadow-md backdrop-blur-sm">
              ⭐ Top Pick
            </div>
          )} */}

          {/* Favorite — scoped inside the image's relative container so it
              anchors to the photo, not the whole card */}
          {user && (
            <button
              type="button"
              onClick={handleFavorite}
              disabled={favoriteLoading || !favoriteLoaded}
              aria-label={
                isFavorite ? "Remove from favorites" : "Add to favorites"
              }
              aria-pressed={isFavorite}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-md backdrop-blur-sm transition hover:bg-white z-10 disabled:opacity-60"
            >
              <Heart
                className={`h-4 w-4 ${
                  isFavorite ? "fill-red-600 text-red-600" : ""
                }`}
              />
            </button>
          )}
        </div>

        {/* Body */}
        <div
          className="flex flex-col flex-1 gap-3 p-4"
          style={{
            background: "rgb(161, 46, 46)",
          }}
        >
          {/* Badge row: listing type + tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex w-fit items-center rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
              {isRent ? "For Rent" : "For Sale"}
            </div>
            {activeTags.map((tag, i) => (
              <div
                key={tag.id ?? i}
                className={`flex w-fit items-center rounded-full px-3 py-1 text-xs font-bold  ${getTagColorClasses(tag.color)}`}
              >
                {tag.label}
              </div>
            ))}
          </div>

          {/* Title */}
          <h3
            className="font-bold text-lg leading-snug line-clamp-2 text-white min-h-[50px]"
            title={property.title}
          >
            {property.title}
          </h3>

          {/* Price */}
          <p className="text-white font-semibold">{priceDisplay}</p>

          {/* Location */}
          <div className="flex items-start gap-1.5 text-sm text-white">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-white/80" />
            <p className="line-clamp-1 font-medium text-white/80">
              {property.city ?? property.address ?? property.state}
            </p>
          </div>

          {/* Features */}
          <div className="flex items-center gap-4 text-xs font-semibold text-white border-t border-white/20 pt-3">
            {(property.bedrooms ?? 0) > 0 && (
              <div className="flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-white/80" />
                <span>
                  {property.bedrooms} Bed{property.bedrooms === 1 ? "" : "s"}
                </span>
              </div>
            )}
            {(property.bathrooms ?? 0) > 0 && (
              <div className="flex items-center gap-1.5">
                <Bath className="w-4 h-4 text-white/80" />
                <span>
                  {property.bathrooms} Bath{property.bathrooms === 1 ? "" : "s"}
                </span>
              </div>
            )}

            {property.area && (
              <div className="flex items-center gap-1.5">
                <Ruler className="w-4 h-4" />
                <span>{property.area} sqm</span>
              </div>
            )}
          </div>

          {/* Agent */}
          {property.agent && (
            <div className="mt-auto flex items-center gap-2.5 pt-3 border-t border-white/20">
              <img
                src={agentAvatarUrl}
                alt={property.agent.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-white/30 flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(property.agent!.name)}`;
                }}
              />
              <p className="text-xs font-semibold truncate text-white">
                Agent: {property.agent.name}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
