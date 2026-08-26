// components/property/property-card.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Property } from "@/lib/types";
import { Heart, MapPin, Bed, Bath, Ruler } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/store";
import { normalizeSource } from "@/components/developer-property-card";

interface PropertyCardProps {
  property: Property;
  priority?: boolean;
  // When a parent list already knows favorite state (e.g. because it fetched
  // /api/favorites once to sort favorited items first), pass it here so this
  // card seeds from it instead of doing its own redundant fetch. Leave
  // undefined for standalone usage — the card will fetch for itself.
  initialIsFavorite?: boolean;
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

const API_BASE = (
  process.env.NEXT_PUBLIC_API_IMG ?? "http://localhost:8000"
).replace(/\/$/, "");

// ── Tag colors — mirrors developer-property-card.tsx / the admin
// PropertyFormModal's TAG_COLOR_OPTIONS, so developer listings and regular
// listings render tags identically instead of developer cards silently
// dropping them.
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

function toAbsoluteUrl(url: string | null | undefined): string {
  if (!url) return FALLBACK_IMG;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const cleanPath = url.replace(/^\//, "");
  return `${API_BASE}/${cleanPath}`;
}

function formatPrice(amount: number): string {
  if (amount >= 1_000_000_000) {
    const val = amount / 1_000_000_000;
    return `₱${val % 1 === 0 ? val.toFixed(0) : val.toFixed(2)}B`;
  }
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000;
    return `₱${val % 1 === 0 ? val.toFixed(0) : val.toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    const val = amount / 1_000;
    return `₱${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}K`;
  }
  return `₱${amount.toLocaleString("en-PH")}`;
}

export function PropertyCard({
  property,
  priority = false,
  initialIsFavorite,
}: PropertyCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite ?? false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteLoaded, setFavoriteLoaded] = useState(
    initialIsFavorite !== undefined,
  );
  const { user } = useAuth();

  const source: FavoriteSource = normalizeSource(
    (property as any)._source ?? (property as any).source ?? "property",
  );

  const favoritePropertyId =
    source === "developer_property"
      ? ((property as any).raw_id ?? property.id)
      : property.id;

  const rawImageUrl = imageError
    ? FALLBACK_IMG
    : toAbsoluteUrl(property.thumbnail ?? property.images?.[0]?.url);

  const agentAvatarUrl = toAbsoluteUrl(property.agent?.avatar);

  const listingType = property.listing_type ?? property.listingType;
  const isRent = listingType === "rent";

  const rawPrice = Number(
    isRent
      ? (property.price_per_month ??
          property.pricePerMonth ??
          property.price ??
          0)
      : (property.price ??
          property.price_per_month ??
          property.pricePerMonth ??
          0),
  );

  const priceDisplay = isRent
    ? `${formatPrice(rawPrice)}/mo`
    : formatPrice(rawPrice);
  const fullPrice = isRent
    ? `₱${rawPrice.toLocaleString("en-PH")}/mo`
    : `₱${rawPrice.toLocaleString("en-PH")}`;

  // Tags (e.g. "Promo")
  const activeTags: PropertyTag[] = normalizeTags(
    (property as { tags?: unknown }).tags,
  ).filter((t) => t.active ?? true);

  // Detail page route. property.id from the merged listings endpoint is a
  // composite string like "developer-518" (see
  // PropertyController::transformMergedCollection), which is only meant to
  // be a unique React key — not a URL segment. Using it directly produced
  // /properties/developer-518 instead of /developer/518. Developer-sourced
  // cards route to /developer/{raw_id}; everything else keeps the existing
  // /properties/{id} route.
  const detailHref =
    source === "developer_property"
      ? `/developer/${(property as any).raw_id ?? property.id}`
      : `/properties/${property.id}`;

  // ───────────────────────────────────────────
  // LOAD FAVORITE STATE
  // (skipped entirely when a parent list already supplied initialIsFavorite —
  // e.g. properties-client.tsx fetches /api/favorites once for the whole
  // grid so it can sort favorited items first, and passes the result down)
  // ───────────────────────────────────────────
  useEffect(() => {
    if (initialIsFavorite !== undefined) {
      setIsFavorite(initialIsFavorite);
      setFavoriteLoaded(true);
      return;
    }

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
  }, [favoritePropertyId, source, user, initialIsFavorite]);

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
    <Link href={detailHref} className="h-full">
      <div className="flex flex-col h-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 group cursor-pointer hover:bg-white/15">
        {/* Property image */}
        <div className="relative h-48 flex-shrink-0 overflow-hidden bg-muted">
          <Image
            src={rawImageUrl}
            alt={property.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            className="object-cover group-hover:scale-110 transition duration-300"
            onError={() => setImageError(true)}
            unoptimized={
              rawImageUrl.includes("localhost") ||
              rawImageUrl.includes("data:image")
            }
          />

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

        {/* Card body */}
        <div className="flex flex-col flex-1 p-4">
          {/* Badge row: listing type + tags */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <div className="flex w-fit items-center rounded-full bg-gradient-to-r from-red-600 to-red-700 px-3 py-1 text-xs font-bold text-white">
              {isRent ? "For Rent" : "For Sale"}
            </div>
            {activeTags.map((tag, i) => (
              <div
                key={tag.id ?? i}
                className={`flex w-fit items-center rounded-full px-3 py-1 text-xs font-bold ${getTagColorClasses(tag.color)}`}
              >
                {tag.label}
              </div>
            ))}
          </div>

          {/* Price */}
          {/* <div className="mb-2">
            <p className="text-xl font-bold text-white" title={fullPrice}>
              {priceDisplay}
            </p>
            {rawPrice >= 1_000 && (
              <p className="text-[11px] text-white/60 -mt-0.5">{fullPrice}</p>
            )}
          </div> */}

          {/* Title */}
          <h3 className="font-semibold text-base mb-2 line-clamp-2 text-white group-hover:text-white/90 transition">
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-start gap-1 text-sm text-white/70 mb-3">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-white/70" />
            <p className="line-clamp-1 text-white/70">
              {[property.address, property.city, property.state]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>

          {/* Features */}
          <div className="flex gap-4 mb-4 text-xs text-white/60 border-t border-white/20 pt-3">
            {(property.bedrooms ?? 0) > 0 && (
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                <span>{property.bedrooms} Bed</span>
              </div>
            )}
            {(property.bathrooms ?? 0) > 0 && (
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                <span>{property.bathrooms} Bath</span>
              </div>
            )}
            {property.area && (
              <div className="flex items-center gap-1">
                <Ruler className="w-4 h-4" />
                <span>{property.area} sqm</span>
              </div>
            )}
          </div>

          {/* Agent */}
          {property.agent && (
            <div className="mt-auto flex items-center gap-2 pt-3 border-t border-white/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={agentAvatarUrl}
                alt={property.agent.name}
                width={32}
                height={32}
                className="rounded-full object-cover flex-shrink-0 ring-1 ring-white/30 w-8 h-8"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(property.agent!.name)}&size=32&background=random`;
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white/90 line-clamp-1">
                  Agent: {property.agent.name}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
