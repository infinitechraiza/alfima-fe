"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

function normalizeListingTypeParam(v: string): string {
  const s = v.trim().toLowerCase();
  if (s === "buy") return "sale";
  if (s === "rent") return "rent";
  return "";
}

// Inverse of normalizeListingTypeParam — turns the URL's stored value
// ("sale" / "rent") back into this component's internal Buy/Rent state
// ("buy" / "rent"), so a URL built by HeroSearch (?listingType=sale)
// pre-selects "Buy" here instead of silently landing on "All Types".
function listingTypeFromUrl(v: string | null): string {
  const s = (v ?? "").trim().toLowerCase();
  if (s === "sale") return "buy";
  if (s === "rent") return "rent";
  return "";
}

// Matches a row's raw listing_type value against the selected filter
// ("" = all, "buy" = sale-type rows, "rent" = rent-type rows). Used as a
// client-side safety net in case the backend doesn't honor listing_type
// on this endpoint or returns a broader set than requested.
function rowMatchesListingType(
  rawListingType: unknown,
  filter: string,
): boolean {
  if (!filter) return true;
  const v = (rawListingType ?? "").toString().trim().toLowerCase();
  if (filter === "buy") return v === "for sale" || v === "sale" || v === "buy";
  if (filter === "rent") return v === "for rent" || v === "rent";
  return true;
}

interface PropertySearchProps {
  onSearch: (filters: {
    search?: string;
    type?: string;
    listingType?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    city?: string;
    scope?: string;
  }) => void;
  minPriceRange?: number;
  maxPriceRange?: number;
}

export function PropertySearch({
  onSearch,
  minPriceRange = 0,
  maxPriceRange = 10000000,
}: PropertySearchProps) {
  // BUG FIX: this panel used to always initialize its filter state to
  // empty strings, regardless of what was already active in the URL
  // (e.g. ?search=manila&listingType=sale&scope=all from the Hero
  // search bar). That meant opening this panel and applying just one
  // extra filter (like "Studio") silently wiped out search/listingType,
  // producing a much broader — and confusing — result set. We now seed
  // every field from the current URL's query params on first render, so
  // this panel is additive to whatever filters are already applied.
  const searchParams = useSearchParams();

  const initialListingType = listingTypeFromUrl(
    searchParams.get("listingType"),
  );
  const initialMinPrice = searchParams.get("minPrice");
  const initialMaxPrice = searchParams.get("maxPrice");
  const hasInitialFilters = Boolean(
    searchParams.get("propertyType") ||
    initialMinPrice ||
    initialMaxPrice ||
    searchParams.get("bedrooms") ||
    searchParams.get("city"),
  );

  const [isExpanded, setIsExpanded] = useState(hasInitialFilters);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [listingType, setListingType] = useState<string>(initialListingType);
  const [type, setType] = useState<string>(
    () => searchParams.get("propertyType") ?? "",
  );
  // Min/Max Price default to the actual min/max price found among the
  // properties currently in the catalog (derived below from the same
  // fetch used for the city list), not a fixed prop — so e.g. a catalog
  // ranging ₱4.50M–₱21.32M shows that range, not a generic 0–10M.
  // priceBounds is null until that fetch resolves; the minPriceRange/
  // maxPriceRange props are only a fallback if it never does.
  const [priceBounds, setPriceBounds] = useState<{
    min: number;
    max: number;
  } | null>(null);
  const [minPrice, setMinPrice] = useState<string>(
    initialMinPrice ?? String(minPriceRange),
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    initialMaxPrice ?? String(maxPriceRange),
  );
  // Track manual edits so an async update to the derived/prop price
  // bounds doesn't clobber a value the user already typed — this also
  // covers the value we just seeded from the URL above.
  const minPriceTouched = useRef(Boolean(initialMinPrice));
  const maxPriceTouched = useRef(Boolean(initialMaxPrice));
  const [bedrooms, setBedrooms] = useState<string>(
    () => searchParams.get("bedrooms") ?? "",
  );
  const [city, setCity] = useState<string>(
    () => searchParams.get("city") ?? "",
  );

  // Cities fetched dynamically from all properties (sale + rent), reusing
  // the same /api/properties endpoint the results page already calls —
  // no dedicated /api/properties/cities route required.
  const [cities, setCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citiesError, setCitiesError] = useState(false);

  // Custom combobox state — native <datalist> can't be restyled to match
  // the app's theme, so the dropdown list below is built by hand.
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const cityFieldRef = useRef<HTMLDivElement>(null);
  const cityInputWrapRef = useRef<HTMLDivElement>(null);

  // The dropdown panel is rendered in a portal (see below), so it needs its
  // own position computed from the input's bounding box. Any ancestor with
  // overflow-hidden (e.g. the hero section's decorative clipping) would
  // otherwise chop the panel off no matter what z-index it has.
  const [menuRect, setMenuRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Re-sync default price fields whenever the derived catalog range
  // (or, failing that, the prop fallback) arrives/changes, as long as
  // the user hasn't already edited that field themselves (or it wasn't
  // already seeded from the URL).
  useEffect(() => {
    if (minPriceTouched.current) return;
    setMinPrice(String(priceBounds?.min ?? minPriceRange));
  }, [priceBounds, minPriceRange]);

  useEffect(() => {
    if (maxPriceTouched.current) return;
    setMaxPrice(String(priceBounds?.max ?? maxPriceRange));
  }, [priceBounds, maxPriceRange]);

  const updateMenuRect = () => {
    const el = cityInputWrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setMenuRect({ top: r.bottom + 4, left: r.left, width: r.width });
  };

  useLayoutEffect(() => {
    if (!cityMenuOpen) return;
    updateMenuRect();

    const handle = () => updateMenuRect();
    window.addEventListener("scroll", handle, true);
    window.addEventListener("resize", handle);
    return () => {
      window.removeEventListener("scroll", handle, true);
      window.removeEventListener("resize", handle);
    };
  }, [cityMenuOpen]);

  useEffect(() => {
    let cancelled = false;

    const loadCatalogData = async () => {
      setCitiesLoading(true);
      setCitiesError(false);
      try {
        const params = new URLSearchParams();
        params.append("page", "1");
        // Pull a large page so the derived city/price data covers the
        // catalog for the selected type. If your backend caps per_page
        // lower than this, it'll just clamp to that cap — still fine for
        // building a distinct city list and price range.
        params.append("per_page", "1000");
        params.append("status", "active");
        // scope=all so developer_properties are included too, matching
        // how the results page can include both sources.
        params.append("scope", "all");

        // Scope the city list and price bounds to the selected listing
        // type (Buy/Rent), same as the results page's own query — so
        // picking "Rent" derives its 5 properties' price range and
        // cities, not the whole catalog's.
        const listingTypeParam = normalizeListingTypeParam(listingType);
        if (listingTypeParam) params.append("listing_type", listingTypeParam);

        const res = await fetch(`/api/properties?${params}`);
        if (!res.ok) throw new Error("Failed to fetch properties");
        const data = await res.json();
        if (cancelled) return;

        const allRows: any[] = Array.isArray(data?.data) ? data.data : [];
        // Client-side filter as a safety net in case the backend doesn't
        // honor listing_type on this endpoint.
        const rows = allRows.filter((p) =>
          rowMatchesListingType(p?.listing_type, listingType),
        );

        const extracted = rows
          .map((p) => p?.city ?? p?.City ?? "")
          .filter((c): c is string => typeof c === "string" && c.trim() !== "");

        const cleaned = Array.from(new Set(extracted)).sort((a, b) =>
          a.localeCompare(b),
        );

        setCities(cleaned);

        // Derive the min/max price from this same, type-filtered batch.
        // Rent listings are priced per month (price_per_month), sale
        // listings by price — same logic PreviewRow uses to display.
        const prices = rows
          .map((p) => {
            const isRent = (p?.listing_type ?? "")
              .toString()
              .toLowerCase()
              .includes("rent");
            const raw = isRent
              ? (p?.price_per_month ?? p?.price)
              : (p?.price ?? p?.price_per_month);
            const num = Number(raw);
            return Number.isFinite(num) && num > 0 ? num : null;
          })
          .filter((n): n is number => n !== null);

        setPriceBounds(
          prices.length > 0
            ? { min: Math.min(...prices), max: Math.max(...prices) }
            : null,
        );
      } catch (err) {
        console.error("Failed to fetch catalog data:", err);
        if (!cancelled) {
          setCitiesError(true);
          setPriceBounds(null);
        }
      } finally {
        if (!cancelled) setCitiesLoading(false);
      }
    };

    loadCatalogData();
    return () => {
      cancelled = true;
    };
  }, [listingType]);

  // Close the city dropdown on outside click or Escape. Since the menu is
  // now portaled to document.body, we can't rely on cityFieldRef alone to
  // contain clicks on the menu itself — the menu has its own ref too.
  const cityMenuPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cityMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideField = cityFieldRef.current?.contains(target);
      const insideMenu = cityMenuPanelRef.current?.contains(target);
      if (!insideField && !insideMenu) {
        setCityMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCityMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [cityMenuOpen]);

  const filteredCities =
    city.trim() === ""
      ? cities
      : cities.filter((c) =>
          c.toLowerCase().includes(city.trim().toLowerCase()),
        );

  const handleSearch = () => {
    onSearch({
      search: search || undefined,
      listingType: listingType || undefined,
      type: type || undefined,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      // bedrooms "0" (Studio) must still be sent — compare to "" not
      // falsiness, since 0 is falsy as a number but a legit selection here.
      bedrooms: bedrooms !== "" ? parseInt(bedrooms) : undefined,
      city: city || undefined,
      // this panel must always send scope=all, matching the Hero search
      // bar — otherwise applying any filter here silently switches the
      // backend from the merged agent+developer query to an agent-only
      // query (see PropertyController::index — scope=all is what selects
      // indexMerged over indexAgentOnly).
      scope: "all",
    });
  };

  const handleReset = () => {
    setSearch("");
    setListingType("");
    setType("");
    // Reset back to the real catalog min/max, not empty — and allow
    // future updates to sync again since the user is explicitly resetting.
    minPriceTouched.current = false;
    maxPriceTouched.current = false;
    setMinPrice(String(priceBounds?.min ?? minPriceRange));
    setMaxPrice(String(priceBounds?.max ?? maxPriceRange));
    setBedrooms("");
    setCity("");
    // keep scope=all on reset too, so clearing filters still shows the
    // full merged catalog instead of quietly narrowing to agent-only.
    onSearch({ scope: "all" });
  };

  const cityPlaceholder = citiesLoading
    ? "Loading cities…"
    : citiesError || cities.length === 0
      ? "Enter city..."
      : "Enter or select city...";

  const cityMenu =
    cityMenuOpen && !citiesLoading && menuRect
      ? createPortal(
          <div
            ref={cityMenuPanelRef}
            style={{
              position: "fixed",
              top: menuRect.top,
              left: menuRect.left,
              width: menuRect.width,
              zIndex: 9999,
            }}
            className="max-h-56 overflow-y-auto rounded-lg border border-blue-700 bg-blue-950/95 backdrop-blur-md shadow-xl
      [&::-webkit-scrollbar]:w-2
      [&::-webkit-scrollbar-track]:bg-transparent
      [&::-webkit-scrollbar-thumb]:bg-blue-600/60
      [&::-webkit-scrollbar-thumb]:rounded-full
      [&::-webkit-scrollbar-thumb:hover]:bg-blue-500/70"
          >
            <div
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgb(37 99 235 / 0.6) transparent",
              }}
            >
              {!citiesError && filteredCities.length > 0 ? (
                <>
                  {city.trim() !== "" && (
                    <button
                      type="button"
                      onClick={() => {
                        setCityMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-blue-300 hover:bg-blue-900/60 transition border-b border-blue-800"
                    >
                      Use "{city.trim()}"
                    </button>
                  )}
                  {filteredCities.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => {
                        setCity(c);
                        setCityMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition ${
                        c === city
                          ? "bg-blue-700/50 text-white"
                          : "text-white/90 hover:bg-blue-900/60"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </>
              ) : (
                <p className="px-3 py-2 text-sm text-blue-300/70">
                  {citiesError
                    ? "Couldn't load cities — you can still type one."
                    : "No matching cities."}
                </p>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-8">
      {/* Main Search Bar */}
      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
          <input
            type="text"
            placeholder="Search by address, city, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-blue-950/50 border border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/80 transition text-sm text-white placeholder-blue-300"
          />
        </div>
        <Button
          onClick={handleSearch}
          className="bg-gradient-to-r from-blue-400/80 to-blue-500 hover:from-blue-500/60 hover:to-blue-600/60 text-blue-950 font-bold whitespace-nowrap"
        >
          Search
        </Button>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-3 border border-blue-700 rounded-lg hover:bg-blue-900/50 transition flex items-center gap-2 justify-center sm:w-auto text-white"
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-medium">Filters</span>
        </button>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-blue-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-down">
          {/* Listing Type */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Type
            </label>
            <select
              value={listingType}
              onChange={(e) => setListingType(e.target.value)}
              className="w-full px-3 py-2 bg-blue-950/50 border border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-white"
            >
              <option value="">All Types</option>
              <option value="buy">Buy</option>
              <option value="rent">Rent</option>
            </select>
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Property Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-blue-950/50 border border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-white"
            >
              <option value="">All Types</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="office_space">Office Space</option>
            </select>
          </div>

          {/* Min Price */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Min Price
            </label>
            <input
              type="number"
              min={priceBounds?.min ?? minPriceRange}
              max={priceBounds?.max ?? maxPriceRange}
              value={minPrice}
              onChange={(e) => {
                minPriceTouched.current = true;
                setMinPrice(e.target.value);
              }}
              className="w-full px-3 py-2 bg-blue-950/50 border border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-white placeholder-blue-300"
            />
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Max Price
            </label>
            <input
              type="number"
              min={priceBounds?.min ?? minPriceRange}
              max={priceBounds?.max ?? maxPriceRange}
              value={maxPrice}
              onChange={(e) => {
                maxPriceTouched.current = true;
                setMaxPrice(e.target.value);
              }}
              className="w-full px-3 py-2 bg-blue-950/50 border border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-white placeholder-blue-300"
            />
          </div>

          {/* Bedrooms */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Bedrooms
            </label>
            <select
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className="w-full px-3 py-2 bg-blue-950/50 border border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-white"
            >
              <option value="">Any</option>
              <option value="0">Studio</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
            </select>
          </div>

          {/* City — custom combobox: typed search + a dropdown styled like the other selects.
              The panel itself is portaled to document.body (see cityMenu above) so an
              ancestor's overflow-hidden (e.g. the hero section's decorative clipping)
              can never chop it off. */}
          <div ref={cityFieldRef} className="relative">
            <label className="block text-sm font-medium mb-2 text-white">
              City
            </label>
            <div ref={cityInputWrapRef} className="relative">
              <input
                type="text"
                placeholder={cityPlaceholder}
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  if (!citiesLoading) setCityMenuOpen(true);
                }}
                onFocus={() => {
                  if (!citiesLoading) setCityMenuOpen(true);
                }}
                disabled={citiesLoading}
                className="w-full px-3 py-2 pr-8 bg-blue-950/50 border border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-white placeholder-blue-300 disabled:opacity-60"
              />
              <ChevronDown
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300 pointer-events-none transition-transform ${
                  cityMenuOpen ? "rotate-180" : ""
                }`}
              />
            </div>

            {mounted && cityMenu}
          </div>

          {/* Actions */}
          <div className="sm:col-span-2 lg:col-span-4 flex gap-2 justify-end">
            <Button
              onClick={handleReset}
              variant="outline"
              className="border border-blue-700 hover:bg-blue-900/50 text-white"
            >
              Reset
            </Button>
            <Button
              onClick={handleSearch}
              className="bg-gradient-to-r from-blue-400/80 to-blue-500 hover:from-blue-500/50 hover:to-blue-600/80 text-blue-950  font-bold"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
