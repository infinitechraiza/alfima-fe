"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Property } from "@/lib/types";
import {
  PropertyCard,
  getFavoriteKey,
  normalizeSource,
} from "@/components/developer-property-card";
import { Button } from "@/components/ui/button";
import { PartnerDevelopers } from "@/components/partner-developers-section";

interface FeaturedPropertiesProps {
  properties: Property[];
  loading: boolean;
}

export function FeaturedProperties({
  properties,
  loading,
}: FeaturedPropertiesProps) {
  // null = not loaded yet, so we fall back to priority-only order until it resolves
  const [favoriteKeys, setFavoriteKeys] = useState<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFavorites() {
      try {
        const res = await fetch("/api/favorites", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled) setFavoriteKeys(new Set());
          return;
        }

        const favorites: unknown = await res.json();
        if (!Array.isArray(favorites)) {
          if (!cancelled) setFavoriteKeys(new Set());
          return;
        }

        const keys = new Set(
          favorites.map((f: any) => {
            const source = normalizeSource(f.source);
            return `${source}:${f.property_id}`;
          }),
        );

        if (!cancelled) setFavoriteKeys(keys);
      } catch {
        if (!cancelled) setFavoriteKeys(new Set());
      }
    }

    loadFavorites();
    return () => {
      cancelled = true;
    };
  }, []);

  function priorityRank(p: Property): number {
    const val = Number(p.priority);
    return !isNaN(val) && val >= 1 ? val : Number.POSITIVE_INFINITY;
  }

  // Favorited properties first (row 1), then everyone else ordered by
  // the existing `priority` field, unprioritized items keeping their
  // original relative order (stable sort).
  const sortedProperties = [...properties].sort((a, b) => {
    const aFav = favoriteKeys?.has(getFavoriteKey(a)) ?? false;
    const bFav = favoriteKeys?.has(getFavoriteKey(b)) ?? false;

    if (aFav !== bFav) return aFav ? -1 : 1;
    return priorityRank(a) - priorityRank(b);
  });

  // Top-10 slots (favorited-first, then priority order) get a slightly
  // elevated card treatment (see `featured` prop on PropertyCard) so
  // they stand out from the rest of the grid — separate from `priority`,
  // which only controls eager image loading and should stay narrow
  // (first 3) to avoid loading too many images at once.
  const FEATURED_COUNT = 10;

  return (
    <section className="py-32 sm:py-44 bg-gradient-to-b from-[#8b1a1a] from-[20%] to-red-800/30 to-[100%]">
      <PartnerDevelopers />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        <div className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Featured Properties
          </h2>
          <p className="text-rose-100 text-xl">
            Explore our handpicked selection of premium listings
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-md h-96 rounded-2xl animate-pulse border border-rose-300/30"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 items-stretch">
            {sortedProperties.slice(0, 9).map((property, i) => (
              <PropertyCard
                key={property.id}
                property={property}
                priority={i < 3}
                featured={i < FEATURED_COUNT}
                initialFavorite={
                  favoriteKeys
                    ? favoriteKeys.has(getFavoriteKey(property))
                    : undefined
                }
              />
            ))}
          </div>
        )}

        <div className="text-center">
          <Link href="/developer">
            <Button className="bg-gradient-to-r from-rose-400 to-red-500 hover:from-rose-500 hover:to-red-600 text-red-950 font-bold gap-2 text-lg px-8 py-6">
              View All Properties <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
