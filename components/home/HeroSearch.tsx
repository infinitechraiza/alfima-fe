"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  MapPin,
  Home,
  Banknote,
  BedDouble,
  ChevronDown,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";

interface HeroSearchProps {
  onSearch: (filters: any) => void;
}

const PROPERTY_TYPES = ["Residential", "Commercial", "Office Space"];

const BUDGETS = [
  { label: "Under ₱500K", value: "0-500000" },
  { label: "₱500K – ₱1M", value: "500000-1000000" },
  { label: "₱1M – ₱3M", value: "1000000-3000000" },
  { label: "₱3M – ₱5M", value: "3000000-5000000" },
  { label: "₱5M – ₱10M", value: "5000000-10000000" },
  { label: "₱10M – ₱20M", value: "10000000-20000000" },
  { label: "Above ₱20M", value: "20000000-999999999" },
];

const BEDROOMS = [
  "Studio",
  "1 Bedroom",
  "2 Bedrooms",
  "3 Bedrooms",
  "4 Bedrooms",
  "5+ Bedrooms",
];

const TABS = ["Buy", "Rent"] as const;
type Tab = (typeof TABS)[number];

/* ── Dropdown — renders panel via Portal into document.body ─── */
function FieldDropdown({
  label,
  icon,
  placeholder,
  options,
  value,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  options: string[] | { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure portal only runs client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 220),
      });
    }
    setOpen((o) => !o);
  };

  const displayLabel = (opt: string | { label: string; value: string }) =>
    typeof opt === "string" ? opt : opt.label;
  const optionValue = (opt: string | { label: string; value: string }) =>
    typeof opt === "string" ? opt : opt.value;

  const selectedLabel = value
    ? displayLabel(
        (options as any[]).find((o) => optionValue(o) === value) ?? value,
      )
    : null;

  const panel =
    open && mounted
      ? createPortal(
          <div
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              width: coords.width,
              background: "#fff",
              borderRadius: 14,
              boxShadow:
                "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
              border: "1px solid rgba(0,0,0,0.06)",
              zIndex: 99999,
              overflow: "hidden",
              maxHeight: 320,
              overflowY: "auto",
              animation: "hs2-dropIn 0.18s ease",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "11px 16px",
                fontSize: 13,
                color: "#9ca3af",
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                borderBottom: "1px solid #f3f4f6",
                cursor: "pointer",
              }}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              {placeholder}
            </div>
            {(options as any[]).map((opt) => {
              const val = optionValue(opt);
              const label2 = displayLabel(opt);
              const isActive = value === val;
              return (
                <div
                  key={val}
                  style={{
                    padding: "11px 16px",
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: "'DM Sans', sans-serif",
                    color: isActive ? "#c41e3a" : "#374151",
                    background: isActive ? "#fce4e7" : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "background 0.12s",
                  }}
                  onClick={() => {
                    onChange(val);
                    setOpen(false);
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLElement).style.background =
                        "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = isActive
                      ? "#fef2f2"
                      : "transparent";
                  }}
                >
                  {label2}
                  {isActive && (
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#c41e3a",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={ref} className="hs2-dropdown" onClick={handleToggle}>
      <div className="hs2-dropdown-inner">
        <span className="hs2-dropdown-icon">{icon}</span>
        <div className="hs2-dropdown-text">
          <span className="hs2-dropdown-label">{label}</span>
          <span
            className={`hs2-dropdown-value${selectedLabel ? " selected" : ""}`}
          >
            {selectedLabel ?? placeholder}
          </span>
        </div>
        <ChevronDown
          size={13}
          color="#9ca3af"
          style={{
            flexShrink: 0,
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </div>
      {panel}
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────── */
export function HeroSearch({ onSearch }: HeroSearchProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Buy");
  const [location, setLocation] = useState("");
  const [propType, setPropType] = useState("");
  const [budget, setBudget] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [focused, setFocused] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleSearch = () => {
    const [minPrice, maxPrice] = budget ? budget.split("-") : ["", ""];
    const listingType = activeTab === "Buy" ? "sale" : "rent"; // was "For Sale" / "For Rent"

    onSearch({
      search: location,
      listingType,
      type: propType,
      minPrice,
      maxPrice,
      bedrooms,
    });

    const params = new URLSearchParams();
    if (location) params.set("search", location);
    params.set("listingType", listingType);
    params.set("scope", "all"); // ← tells the API to include developer inventory
    // NOTE: backend reads "property_type" / "propertyType" — NOT "type".
    // Sending "type" made this filter a silent no-op.
    if (propType) params.set("propertyType", propType);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (bedrooms) params.set("bedrooms", bedrooms);

    window.location.href = `/properties?${params.toString()}`;
  };

  const activeCount = [propType, budget, bedrooms].filter(Boolean).length;

  return (
    <>
      <style>{`
        
          @keyframes hs2-dropIn {
            from { opacity: 0; transform: translateY(-6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes hs2-drawerIn {
            from { opacity: 0; transform: translateY(-6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes hs2-tabIn {
            from { opacity: 0; transform: translateX(-4px); }
            to   { opacity: 1; transform: translateX(0); }
          }

        .hs2-section {
          position: absolute;
          z-index: 10;

          width: 100%;
          max-width: 1320px;
          margin-top: -105px;

          left: 50%;
          transform: translateX(-50%);

          background: transparent;
          padding: 0 54px 64px;
          box-sizing: border-box;
        }

        @media (max-width: 1024px) {
          .hs2-section {
            padding-left: 32px;
            padding-right: 32px;
          }
        }

        @media (max-width: 768px) {
          .hs2-section {
            padding-left: 16px;
            padding-right: 16px;
          }
        }

        @media (max-width: 480px) {
          .hs2-section {
            padding-left: 12px;
            padding-right: 12px;
          }
        }

          /* ── Wrapper ───────────────────────── */
          .hs2-wrapper {
          position: relative;
          width: 100%;
          background: transparent;
          z-index: 10;

          /* Creates actual space between hero and featured properties */
          padding: 0 0 20px;
        }

          /* ── Tabs ──────────────────────────── */
          .hs2-tabs {
            display: flex;
            align-items: center;
            gap: 2px;
          }
          .hs2-tab {
            position: relative;
            padding: 10px 26px;
            border-radius: 12px 12px 0 0;
            border: none;
            cursor: pointer;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            font-family: 'DM Sans', sans-serif;
            transition: all 0.2s;
            white-space: nowrap;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
          }
          .hs2-tab.active {
            background: rgba(255,255,255,0.97);
            color: #c41e3a;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
          }
          .hs2-tab.inactive {
            background: rgba(255,255,255,0.14);
            color: rgba(255,255,255,0.7);
          }
          .hs2-tab-bar {
            position: absolute; bottom: 0; left: 0; right: 0;
            height: 2px; background: #c41e3a;
            border-radius: 2px 2px 0 0;
            animation: hs2-tabIn 0.2s ease;
          }
          .hs2-filter-badge {
            margin-left: auto;
            display: flex;
            align-items: center;
            gap: 6px;
            background: rgba(196,30,58,0.15);
            border: 1px solid rgba(196,30,58,0.35);
            border-radius: 100px;
            padding: 4px 12px;
            flex-shrink: 0;
          }

          /* ── Card ──────────────────────────── */
          .hs2-card {
            background: rgba(255,255,255,0.97);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 0 16px 16px 16px;
            box-shadow: 0 20px 64px rgba(0,0,0,0.38);
            transition: box-shadow 0.25s ease;
            /* MUST be visible so dropdown panels escape the card */
            overflow: visible !important;
            position: relative;
          }

          .hs2-card:focus-within {
            box-shadow: 0 24px 80px rgba(0,0,0,0.45), 0 0 0 2px rgba(196,30,58,0.22);
          }

          /* ── Top row ───────────────────────── */
          .hs2-top-row {
            display: flex;
            align-items: center;
            padding: 8px 8px 8px 20px;
            min-height: 68px;
            gap: 0;
            background: rgba(255,255,255,0.97);
            border-radius: 0 16px 0 0;
            position: relative;
            z-index: 5;
          }

          .hs2-location {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
          }
          .hs2-location input {
            flex: 1;
            border: none;
            outline: none;
            background: transparent;
            font-size: 15px;
            font-weight: 500;
            color: #111827;
            font-family: 'DM Sans', sans-serif;
            min-width: 0;
          }
          .hs2-location input::placeholder { color: #c4c9d4; }
          .hs2-clear-btn {
            width: 20px; height: 20px;
            border-radius: 50%;
            background: #f3f4f6;
            border: none; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            font-size: 10px; color: #9ca3af; flex-shrink: 0;
          }
          .hs2-sep {
            width: 1px; height: 32px;
            background: rgba(0,0,0,0.1);
            margin: 0 12px; flex-shrink: 0;
          }

          /* Mobile-only filters toggle — hidden on desktop */
          .hs2-filters-toggle {
            display: none;
            align-items: center;
            gap: 6px;
            background: #f9fafb;
            border: 1px solid rgba(0,0,0,0.08);
            border-radius: 10px;
            padding: 8px 12px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 700;
            color: #374151;
            font-family: 'DM Sans', sans-serif;
            flex-shrink: 0;
            transition: background 0.15s;
            margin-right: 8px;
          }
          .hs2-filters-toggle:hover { background: #f3f4f6; }
          .hs2-toggle-badge {
            width: 18px; height: 18px;
            background: #a52a2a; color: #fff;
            border-radius: 50%;
            font-size: 10px; font-weight: 800;
            display: flex; align-items: center; justify-content: center;
          }

          /* ── Search button ─────────────────── */
          .hs2-search-btn {
            background: linear-gradient(135deg, #0f1b4d 0%, #5a2d5f 50%, #c41e3a 100%);
            color: #fff;
            border: none; cursor: pointer;
            padding: 0 28px;
            border-radius: 12px;
            font-size: 14px; font-weight: 800;
            letter-spacing: 0.04em;
            font-family: 'DM Sans', sans-serif;
            display: flex; align-items: center; gap: 8px;
            white-space: nowrap;
            box-shadow: 0 6px 20px rgba(12,27,77,0.4);
            transition: all 0.22s ease;
            flex-shrink: 0;
            height: 52px;
          }
          .hs2-search-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 32px rgba(12,27,77,0.5);
          }
          .hs2-search-btn:active { transform: translateY(0); }

          /* ── Desktop filter row ────────────── */
          .hs2-filters-row {
            display: flex;
            align-items: stretch;
            border-top: 1px solid rgba(0,0,0,0.07);
            /* clip the row visually but let dropdowns escape via z-index */
            overflow: visible;
            position: relative;
            z-index: 10;
            background: rgba(255,255,255,0.97);
            border-radius: 0 0 16px 16px;
          }

          /* ── Dropdown shared ───────────────── */
          .hs2-dropdown {
            flex: 1;
            padding: 10px 16px;
            border-right: 1px solid rgba(0,0,0,0.07);
            cursor: pointer;
            position: relative;
            min-width: 0;
          }
          .hs2-dropdown:last-child { border-right: none; }
          .hs2-dropdown-inner {
            display: flex; align-items: center; gap: 8px;
          }
          .hs2-dropdown-icon { flex-shrink: 0; display: flex; }
          .hs2-dropdown-text {
            flex: 1; display: flex; flex-direction: column;
            gap: 2px; min-width: 0; overflow: hidden;
          }
          .hs2-dropdown-label {
            font-size: 9px; font-weight: 800; color: #9ca3af;
            text-transform: uppercase; letter-spacing: 0.1em;
            font-family: 'DM Sans', sans-serif;
          }
          .hs2-dropdown-value {
            font-size: 12px; font-weight: 400; color: #9ca3af;
            font-family: 'DM Sans', sans-serif;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .hs2-dropdown-value.selected { color: #111827; font-weight: 600; }

          /* ── Dropdown panel ────────────────── */
          .hs2-panel {
            background: #fff;
            border-radius: 14px;
            box-shadow: 0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08);
            border: 1px solid rgba(0,0,0,0.06);
            overflow-y: auto;
            max-height: 320px;
            animation: hs2-dropIn 0.18s ease;
          }
          .hs2-option {
            padding: 11px 16px;
            font-size: 13px; font-weight: 500;
            font-family: 'DM Sans', sans-serif;
            color: #374151; cursor: pointer;
            transition: background 0.12s;
            display: flex; align-items: center; justify-content: space-between;
          }
          .hs2-option.active { color: #c41e3a; background: #fce4e7; }
          .hs2-option-clear {
            color: #9ca3af;
            border-bottom: 1px solid #f3f4f6;
            font-size: 12px;
          }
          .hs2-option-dot {
            width: 7px; height: 7px;
            border-radius: 50%; background: #c41e3a; flex-shrink: 0;
          }

          /* ── Mobile drawer ─────────────────── */
          .hs2-drawer {
            border-top: 1px solid rgba(0,0,0,0.07);
            animation: hs2-drawerIn 0.22s ease;
          }
          .hs2-drawer-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }
          .hs2-drawer-grid .hs2-dropdown {
            border-right: none;
            border-bottom: 1px solid rgba(0,0,0,0.07);
            padding: 14px 16px;
            flex: unset;
          }
          .hs2-drawer-grid .hs2-dropdown:nth-child(odd) {
            border-right: 1px solid rgba(0,0,0,0.07);
          }
          .hs2-drawer-grid .hs2-dropdown:nth-last-child(-n+2) {
            border-bottom: none;
          }

          /* ══ RESPONSIVE ═══════════════════════════════ */

          @media (max-width: 1024px) {
            .hs2-wrapper { padding: 0 32px; }
          }

          @media (max-width: 768px) {
            .hs2-wrapper { padding: 0 16px; }

            /* Hide desktop filters row, show toggle button */
            .hs2-filters-row { display: none; }
            .hs2-filters-toggle { display: flex; }

            /* On mobile, top-row is the only visible part of the card — round all corners */
            .hs2-top-row {
              padding: 8px 8px 8px 14px;
              min-height: 58px;
              border-radius: 0 16px 16px 16px;
            }
            .hs2-location input { font-size: 14px; }
            .hs2-search-btn {
              height: 46px;
              padding: 0 18px;
              font-size: 13px;
              border-radius: 10px;
            }
            .hs2-tab { padding: 9px 18px; font-size: 11px; }
          }

          @media (max-width: 480px) {
            .hs2-wrapper { padding: 0 12px; }
            .hs2-sep { display: none; }
            .hs2-top-row { padding: 8px; }
            .hs2-search-btn { padding: 0 14px; gap: 6px; }
            .hs2-search-btn span { display: none; }

            /* Show icon-only button on very small screens */
            .hs2-search-btn::after { content: 'Go'; font-size: 13px; font-weight: 800; }
          }
        `}</style>

      <section
        className="hs2-section absolute w-full bg-transparent z-10 box-border
  px-3 pb-10 -mt-8
  sm:px-4 sm:-mt-10
  md:px-[124px] md:pt-[45px] md:pb-[330px] md:-mt-[60px]
  lg:px-[144px] lg:pt-0 lg:pb-[60px] lg:-mt-[75px]
  flex flex-row"
      >
        <div className="hs2-wrapper">
          {/* Tabs */}
          <div className="hs2-tabs">
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`hs2-tab ${isActive ? "active" : "inactive"}`}
                >
                  {tab}
                  {isActive && <div className="hs2-tab-bar" />}
                </button>
              );
            })}

            {activeCount > 0 && (
              <div className="hs2-filter-badge">
                <Sparkles size={10} color="#f1948a" />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#f1948a",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {activeCount} filter{activeCount > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Card */}
          <div className="hs2-card">
            {/* Top row: location + (mobile: filters toggle) + search btn */}
            <div className="hs2-top-row">
              <div className="hs2-location">
                <MapPin
                  size={16}
                  color={focused ? "#c41e3a" : "#c4c9d4"}
                  style={{ flexShrink: 0, transition: "color 0.2s" }}
                />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="City, neighborhood, or address…"
                />
                {location && (
                  <button
                    className="hs2-clear-btn"
                    onClick={() => setLocation("")}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="hs2-sep" />

              {/* Mobile-only filters toggle */}
              <button
                className="hs2-filters-toggle"
                onClick={() => setFiltersOpen((o) => !o)}
              >
                <SlidersHorizontal size={13} />
                Filters
                {activeCount > 0 && (
                  <span className="hs2-toggle-badge">{activeCount}</span>
                )}
              </button>

              <button className="hs2-search-btn" onClick={handleSearch}>
                <Search size={15} strokeWidth={2.5} />
                <span>Search</span>
              </button>
            </div>

            {/* Desktop: filter row always visible below */}
            <div className="hs2-filters-row">
              <FieldDropdown
                label="Property Type"
                icon={<Home size={14} color="#c0392b" />}
                placeholder="Any type"
                options={PROPERTY_TYPES}
                value={propType}
                onChange={setPropType}
              />
              <FieldDropdown
                label="Budget"
                icon={<Banknote size={14} color="#c0392b" />}
                placeholder="Any price"
                options={BUDGETS}
                value={budget}
                onChange={setBudget}
              />
              <FieldDropdown
                label="Bedrooms"
                icon={<BedDouble size={14} color="#c0392b" />}
                placeholder="Any"
                options={BEDROOMS}
                value={bedrooms}
                onChange={setBedrooms}
              />
            </div>

            {/* Mobile: collapsible drawer */}
            {filtersOpen && (
              <div className="hs2-drawer">
                <div className="hs2-drawer-grid">
                  <FieldDropdown
                    label="Property Type"
                    icon={<Home size={14} color="#c0392b" />}
                    placeholder="Any type"
                    options={PROPERTY_TYPES}
                    value={propType}
                    onChange={setPropType}
                  />
                  <FieldDropdown
                    label="Budget"
                    icon={<Banknote size={14} color="#c0392b" />}
                    placeholder="Any price"
                    options={BUDGETS}
                    value={budget}
                    onChange={setBudget}
                  />
                  <FieldDropdown
                    label="Bedrooms"
                    icon={<BedDouble size={14} color="#c0392b" />}
                    placeholder="Any"
                    options={BEDROOMS}
                    value={bedrooms}
                    onChange={setBedrooms}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
