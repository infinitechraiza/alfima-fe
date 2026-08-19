"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Scale,
  Building2,
  TrendingUp,
  Landmark,
  Paintbrush,
  HardHat,
  Home,
  Key,
  MapPin,
  Hammer,
  Wrench,
  Shield,
  Star,
  Heart,
  Briefcase,
  ArrowRight,
  Phone,
  Mail,
  CheckCircle2,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ServiceImage {
  id: number;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

interface Service {
  id: number;
  label: string;
  tagline: string | null;
  description: string | null;
  highlights: string[];
  icon_name: string | null;
  accent: string | null;
  sort_order: number;
  is_active: boolean;
  thumbnail: string | null;
  images: ServiceImage[];
}

const ICON_MAP: Record<string, React.ReactNode> = {
  FileText: <FileText className="w-6 h-6" />,
  Scale: <Scale className="w-6 h-6" />,
  Building2: <Building2 className="w-6 h-6" />,
  TrendingUp: <TrendingUp className="w-6 h-6" />,
  Landmark: <Landmark className="w-6 h-6" />,
  Paintbrush: <Paintbrush className="w-6 h-6" />,
  HardHat: <HardHat className="w-6 h-6" />,
  Home: <Home className="w-6 h-6" />,
  Key: <Key className="w-6 h-6" />,
  MapPin: <MapPin className="w-6 h-6" />,
  Hammer: <Hammer className="w-6 h-6" />,
  Wrench: <Wrench className="w-6 h-6" />,
  Shield: <Shield className="w-6 h-6" />,
  Star: <Star className="w-6 h-6" />,
  Heart: <Heart className="w-6 h-6" />,
  Briefcase: <Briefcase className="w-6 h-6" />,
};

function resolveIcon(name: string | null | undefined): React.ReactNode {
  if (!name) return <Briefcase className="w-6 h-6" />;
  return ICON_MAP[name] ?? <Briefcase className="w-6 h-6" />;
}

function toSlug(label: string) {
  return label.toLowerCase().replace(/\s+/g, "-");
}

function usePropertyCities() {
  const [cities, setCities] = useState<string[]>([]);
  useEffect(() => {
    fetch("/api/properties?per_page=100")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const raw: string[] = (data.data ?? [])
          .map(
            (p: { city?: string; address?: string }) =>
              p.city?.trim() || p.address?.split(",").pop()?.trim() || "",
          )
          .filter(Boolean);
        setCities([...new Set(raw)].sort() as string[]);
      })
      .catch(() => {});
  }, []);
  return cities;
}

function CityPills({ cities }: { cities: string[] }) {
  const [showAll, setShowAll] = useState(false);
  const MAX = 5;
  const visible = showAll ? cities : cities.slice(0, MAX);
  const overflow = cities.length - MAX;

  if (cities.length === 0) {
    return (
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {[...Array(4)].map((_, i) => (
          <span
            key={i}
            className="rounded-full border animate-pulse inline-block"
            style={{
              width: `${55 + i * 18}px`,
              height: "24px",
              background: "rgba(255,255,255,0.04)",
              borderColor: "rgba(232,168,160,0.1)",
            }}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((city) => (
        <span
          key={city}
          className="px-2.5 py-1 rounded-full text-[9px] font-bold border text-white/50"
          style={{
            background: "rgba(0,0,0,0.2)",
            borderColor: "rgba(232,168,160,0.15)",
            fontFamily: "monospace",
          }}
        >
          {city}
        </span>
      ))}
      {!showAll && overflow > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="px-2.5 py-1 rounded-full text-[9px] font-bold border"
          style={{
            background: "rgba(232,168,160,0.08)",
            borderColor: "rgba(232,168,160,0.3)",
            color: "rgba(232,168,160,0.6)",
            fontFamily: "monospace",
          }}
        >
          +{overflow} more
        </button>
      )}
      {showAll && overflow > 0 && (
        <button
          onClick={() => setShowAll(false)}
          className="px-2.5 py-1 rounded-full text-[9px] font-bold border"
          style={{
            background: "rgba(232,168,160,0.08)",
            borderColor: "rgba(232,168,160,0.3)",
            color: "rgba(232,168,160,0.6)",
            fontFamily: "monospace",
          }}
        >
          show less
        </button>
      )}
    </div>
  );
}

function StatTicker({ count }: { count: number }) {
  const items = [
    `${count > 0 ? count : "7"} Core Services`,
    "Alfima Realty Inc.",
    "Licensed & Trusted",
  ];
  return (
    <div
      className="overflow-hidden whitespace-nowrap border-y py-2.5"
      style={{ background: "rgba(0,0,0,0.2)", borderColor: "transparent" }}
    >
      <div className="inline-flex animate-marquee gap-16 text-xs font-bold tracking-[0.2em] uppercase text-white">
        {[...Array(6)].map((_, i) => (
          <span key={i} className="flex items-center gap-8">
            {items.map((item, j) => (
              <span key={j} className="flex items-center gap-8">
                <span>{item}</span>
                {j < items.length - 1 && (
                  <span className="text-red-800">◆</span>
                )}
              </span>
            ))}
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}.animate-marquee{animation:marquee 30s linear infinite}`}</style>
    </div>
  );
}

function HeroPanel({
  services,
  cities,
}: {
  services: Service[];
  cities: string[];
}) {
  const items = services.slice(0, 7).map((svc, i) => ({
    id: String(svc.id),
    num: String(i + 1).padStart(2, "0"),
    label: svc.label,
    tag: i >= 4 ? (svc.tagline ?? "") : "",
    photo:
      svc.thumbnail ??
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=300&q=80",
    span: i === 6 ? 4 : i >= 4 ? 2 : 1,
  }));
  return (
    <div className="flex flex-col gap-3 select-none">
      <p
        className="text-[10px] font-bold tracking-[0.35em] uppercase"
        style={{ fontFamily: "monospace", color: "rgba(232,168,160,0.5)" }}
      >
        Our {services.length} service{services.length !== 1 ? "s" : ""}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {items.map((svc) => (
          <div
            key={svc.id}
            className={`relative rounded-2xl overflow-hidden border ${svc.span === 4 ? "col-span-4 h-[90px]" : svc.span === 2 ? "col-span-2 h-[100px]" : "col-span-1 aspect-square"}`}
            style={{ borderColor: "rgba(232,168,160,0.2)" }}
          >
            <img
              src={svc.photo}
              alt={svc.label}
              className="w-full h-full object-cover"
            />
            <div
              className={`absolute inset-0 flex ${svc.span > 1 ? "flex-row items-center gap-3 px-4" : "flex-col justify-end p-2.5"}`}
              style={{
                background:
                  svc.span > 1
                    ? "linear-gradient(to right,rgba(90,61,71,0.88),rgba(70,45,55,0.55) 60%,rgba(0,0,0,0.1))"
                    : "linear-gradient(to top,rgba(90,61,71,0.88),rgba(70,45,55,0.45) 55%,transparent)",
              }}
            >
              {svc.span === 4 && (
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: "rgba(232,168,160,0.7)" }}
                />
              )}
              <div>
                <p
                  className="text-[9px] tracking-[0.2em] mb-0.5"
                  style={{
                    fontFamily: "monospace",
                    color: "rgba(232,168,160,0.5)",
                  }}
                >
                  {svc.num}
                </p>
                <p
                  className="text-[11px] font-bold text-white leading-tight"
                  style={{ fontFamily: "monospace" }}
                >
                  {svc.label}
                </p>
                {svc.tag && (
                  <p
                    className="text-[9px] mt-0.5"
                    style={{
                      fontFamily: "monospace",
                      color: "rgba(232,168,160,0.4)",
                    }}
                  >
                    {svc.tag}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div
          className="h-px flex-1"
          style={{ background: "rgba(232,168,160,0.15)" }}
        />
        <span
          className="text-white/70 text-[9px] tracking-widest uppercase"
          style={{ fontFamily: "monospace" }}
        >
          Trusted · Proven · Local
        </span>
        <div
          className="h-px flex-1"
          style={{ background: "rgba(232,168,160,0.15)" }}
        />
      </div>
      <CityPills cities={cities} />
    </div>
  );
}

// ── Service Detail Modal ──────────────────────────────────────────────────────

function ServiceDetailModal({
  svc,
  idx,
  onClose,
}: {
  svc: Service;
  idx: number;
  onClose: () => void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const accent = "#e8a8a0";
  const images = svc.images ?? [];
  const displayImage = images[imgIdx]?.url ?? svc.thumbnail;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  const prev = () => setImgIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setImgIdx((i) => (i + 1) % images.length);

  return (
    <>
      <style>{`@keyframes svcModalIn{from{opacity:0;transform:scale(0.94) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100]"
        style={{
          background: "rgba(15,5,5,0.88)",
          backdropFilter: "blur(10px)",
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 lg:p-10 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col"
          style={{
            background: "linear-gradient(160deg,#4a1f1f 0%,#2d1212 100%)",
            border: "1px solid rgba(232,168,160,0.25)",
            animation: "svcModalIn 0.32s cubic-bezier(0.34,1.4,0.64,1)",
          }}
        >
          {/* ── Image section ── */}
          <div className="relative flex-shrink-0" style={{ height: "260px" }}>
            {displayImage ? (
              <img
                src={displayImage}
                alt={svc.label}
                className="w-full h-full object-cover"
                style={{ opacity: 0.88 }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.3)" }}
              >
                <Briefcase
                  className="w-16 h-16"
                  style={{ color: "rgba(232,168,160,0.1)" }}
                />
              </div>
            )}

            {/* Bottom gradient */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top,rgba(45,18,18,1) 0%,rgba(45,18,18,0.5) 40%,transparent 100%)",
              }}
            />

            {/* Image nav arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{
                    background: "rgba(0,0,0,0.55)",
                    border: "1px solid rgba(232,168,160,0.2)",
                  }}
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{
                    background: "rgba(0,0,0,0.55)",
                    border: "1px solid rgba(232,168,160,0.2)",
                  }}
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>

                {/* Dot indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className="rounded-full transition-all"
                      style={{
                        width: i === imgIdx ? "20px" : "6px",
                        height: "6px",
                        background:
                          i === imgIdx ? accent : "rgba(255,255,255,0.35)",
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Image count badge */}
            {images.length > 1 && (
              <div
                className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-[10px] font-bold"
                style={{
                  background: "rgba(0,0,0,0.6)",
                  border: "1px solid rgba(232,168,160,0.2)",
                  color: "rgba(232,168,160,0.8)",
                  fontFamily: "monospace",
                }}
              >
                {imgIdx + 1} / {images.length}
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{
                background: "rgba(0,0,0,0.6)",
                border: "1px solid rgba(232,168,160,0.2)",
              }}
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Title overlay on image */}
            <div className="absolute bottom-5 left-6 right-16">
              <p
                className="text-[9px] font-bold tracking-[0.35em] uppercase mb-1"
                style={{ fontFamily: "monospace", color: `${accent}80` }}
              >
                Service {String(idx + 1).padStart(2, "0")}
              </p>
              <h2
                className="text-white font-black leading-tight"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "clamp(1.4rem,3vw,2rem)",
                }}
              >
                {svc.label}
              </h2>
              {svc.tagline && (
                <p
                  className="text-sm mt-1"
                  style={{
                    fontFamily: "monospace",
                    color: "rgba(232,168,160,0.6)",
                  }}
                >
                  {svc.tagline}
                </p>
              )}
            </div>
          </div>

          {/* ── Scrollable content ── */}
          <div
            className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-5"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(232,168,160,0.2) transparent",
            }}
          >
            {/* Icon + status row */}
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  borderColor: `${accent}40`,
                }}
              >
                <span style={{ color: accent }}>
                  {resolveIcon(svc.icon_name)}
                </span>
              </div>
              <div
                className="h-px flex-1"
                style={{ background: "rgba(232,168,160,0.12)" }}
              />
              <span
                className="text-[10px] font-bold px-3 py-1 rounded-full border"
                style={{
                  fontFamily: "monospace",
                  background: svc.is_active
                    ? "rgba(34,197,94,0.1)"
                    : "rgba(255,255,255,0.05)",
                  borderColor: svc.is_active
                    ? "rgba(34,197,94,0.3)"
                    : "rgba(255,255,255,0.1)",
                  color: svc.is_active
                    ? "rgba(134,239,172,0.9)"
                    : "rgba(255,255,255,0.3)",
                }}
              >
                {svc.is_active ? "● Active" : "○ Inactive"}
              </span>
            </div>

            {/* Description */}
            {svc.description && (
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid rgba(232,168,160,0.1)",
                }}
              >
                <p
                  className="text-[10px] font-bold tracking-[0.25em] uppercase mb-2"
               style={{ fontFamily: "monospace", color: `${accent}90` }}
                >
                  About
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{
  color: "rgba(255,255,255,1)",
  fontFamily: "monospace",
}}
                >
                  {svc.description}
                </p>
              </div>
            )}

            {/* Highlights */}
            {svc.highlights?.length > 0 && (
              <div>
                <p
                  className="text-[10px] font-bold tracking-[0.25em] uppercase mb-3"
                  style={{ fontFamily: "monospace", color: `${accent}60` }}
                >
                  What's Included
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {svc.highlights.map((h, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
                      style={{
                        background: "rgba(232,168,160,0.06)",
                        border: "1px solid rgba(232,168,160,0.1)",
                      }}
                    >
                      <CheckCircle2
                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                        style={{ color: `${accent}cc` }}
                      />
                      <span
                        className="text-sm"
                        style={{
  color: "rgba(255,255,255,1)",
  fontFamily: "monospace",
  lineHeight: "1.4",
}}
                      >
                        {h}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Thumbnail gallery strip */}
            {images.length > 1 && (
              <div>
                <p
                  className="text-[10px] font-bold tracking-[0.25em] uppercase mb-3"
                  style={{ fontFamily: "monospace", color: `${accent}60` }}
                >
                  Gallery
                </p>
                <div
                  className="flex gap-2 overflow-x-auto pb-1"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(232,168,160,0.15) transparent",
                  }}
                >
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setImgIdx(i)}
                      className="flex-shrink-0 rounded-xl overflow-hidden transition-all"
                      style={{
                        width: "80px",
                        height: "60px",
                        border:
                          i === imgIdx
                            ? `2px solid ${accent}`
                            : "2px solid transparent",
                        opacity: i === imgIdx ? 1 : 0.55,
                      }}
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="flex items-center gap-3 pt-1 pb-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold text-sm flex-1 justify-center"
                style={{
                  background: `linear-gradient(135deg,${accent},#d49890)`,
                  fontFamily: "monospace",
                }}
                onClick={onClose}
              >
                <Mail className="w-4 h-4" /> Send Inquiry
              </Link>
              <a
                href="tel:+639050840075"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold text-sm border"
                style={{
                  borderColor: "rgba(232,168,160,0.3)",
                  fontFamily: "monospace",
                  background: "rgba(255,255,255,0.05)",
                }}
              >
                <Phone className="w-4 h-4" style={{ color: accent }} /> Call Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Service Card ──────────────────────────────────────────────────────────────

function ServiceCard({
  svc,
  idx,
  onClick,
}: {
  svc: Service;
  idx: number;
  onClick: () => void;
}) {
  const accent = "#e8a8a0";
  return (
    <div
      onClick={onClick}
      className="rounded-2xl border overflow-hidden flex flex-col cursor-pointer group transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl"
      style={{
        background:
          "linear-gradient(160deg,rgba(110,70,80,0.7),rgba(80,50,60,0.7))",
        borderColor: "rgba(232,168,160,0.2)",
      }}
    >
      {/* Full-width banner image */}
      <div
        className="w-full overflow-hidden flex-shrink-0 relative"
        style={{ height: "200px" }}
      >
        {svc.thumbnail ? (
          <img
            src={svc.thumbnail}
            alt={svc.label}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ opacity: 0.9 }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.2)" }}
          >
            <Briefcase
              className="w-10 h-10"
              style={{ color: "rgba(232,168,160,0.15)" }}
            />
          </div>
        )}
        {/* Image count badge */}
        {svc.images?.length > 1 && (
          <div
            className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold"
            style={{
              background: "rgba(0,0,0,0.6)",
              color: "rgba(232,168,160,0.8)",
              fontFamily: "monospace",
              border: "1px solid rgba(232,168,160,0.2)",
            }}
          >
            +{svc.images.length} photos
          </div>
        )}
        {/* View details hint */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: "rgba(45,18,18,0.5)" }}
        >
          <span
            className="px-4 py-2 rounded-full text-xs font-bold text-white"
            style={{
              background: "rgba(232,168,160,0.25)",
              border: "1px solid rgba(232,168,160,0.4)",
              fontFamily: "monospace",
            }}
          >
            View Details
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-5 flex-1">
        {/* Icon + title row */}
        <div className="flex items-start gap-3">
          <div
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border"
            style={{
              background: "rgba(0,0,0,0.3)",
              borderColor: `${accent}40`,
            }}
          >
            <span style={{ color: accent }}>{resolveIcon(svc.icon_name)}</span>
          </div>
          <div>
            <p
              className="text-[9px] font-bold tracking-[0.3em] uppercase"
              style={{ fontFamily: "monospace", color: `${accent}70` }}
            >
              Service {String(idx + 1).padStart(2, "0")}
            </p>
            <h3
              className="text-white font-black text-[17px] leading-tight"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {svc.label}
            </h3>
            {svc.tagline && (
              <p
                className="text-xs mt-0.5"
                style={{
                  fontFamily: "monospace",
                  color: "rgba(232,168,160,0.55)",
                }}
              >
                {svc.tagline}
              </p>
            )}
          </div>
        </div>

        <div
          className="h-px"
          style={{ background: "rgba(255,255,255,0.07)" }}
        />

        {svc.description && (
          <p
            className="text-sm leading-relaxed line-clamp-2"
            style={{ color: "rgba(255,255,255,0.68)", fontFamily: "monospace" }}
          >
            {svc.description}
          </p>
        )}

        {svc.highlights?.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {svc.highlights.slice(0, 3).map((h) => (
              <li
                key={h}
                className="flex items-start gap-2 text-xs"
                style={{
                  color: "rgba(255,255,255,0.78)",
                  fontFamily: "monospace",
                  lineHeight: "1.4",
                }}
              >
                <CheckCircle2
                  className="w-3.5 h-3.5 shrink-0 mt-0.5"
                  style={{ color: `${accent}b3` }}
                />
                <span>{h}</span>
              </li>
            ))}
            {svc.highlights.length > 3 && (
              <li
                className="text-[10px] pl-5"
                style={{ color: `${accent}70`, fontFamily: "monospace" }}
              >
                +{svc.highlights.length - 3} more included
              </li>
            )}
          </ul>
        )}

        <div className="flex-1" />

        <div
          className="inline-flex items-center gap-2 text-white font-bold text-xs px-4 py-2.5 rounded-full self-start transition-all group-hover:gap-3"
          style={{
            background: `linear-gradient(135deg, #003366, #003366)`,
            fontFamily: "monospace",
          }}
        >
          View Details <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}

function ServiceSkeleton() {
  return (
    <div
      className="rounded-2xl border overflow-hidden animate-pulse flex flex-col h-full"
      style={{
        background:
          "linear-gradient(135deg,rgba(120,80,90,0.4),rgba(90,60,70,0.4))",
        borderColor: "rgba(232,168,160,0.1)",
      }}
    >
      <div className="h-[200px] bg-white/5 flex-shrink-0" />
      <div className="px-5 pt-5 pb-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-2.5 w-20 rounded bg-white/10" />
          <div className="h-5 w-32 rounded bg-white/15" />
          <div className="h-2.5 w-24 rounded bg-white/10" />
        </div>
      </div>
      <div className="px-5 pb-6 flex flex-col gap-2 flex-1">
        <div className="h-3 w-full rounded bg-white/10" />
        <div className="h-3 w-5/6 rounded bg-white/10" />
        <div className="flex-1" />
        <div className="h-9 w-32 rounded-full bg-white/10" />
      </div>
    </div>
  );
}

function ContactStrip() {
  return (
    <div className="rounded-2xl border p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-bl from-red-800 from-[10%] via-[#3d0012]/90 via-[80%] to-red-800 to-[100%]">
      <div>
        <p
          className="text-[10px] font-bold tracking-[0.3em] uppercase mb-1"
          style={{ fontFamily: "monospace", color: "#da5454" }}
        >
          Get in Touch
        </p>
        <h2
          className="text-white font-black text-2xl"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Ready to work with us?
        </h2>
        <p
          className="text-white/50 text-sm mt-1"
          style={{ fontFamily: "monospace" }}
        >
          10th Floor IBP Tower, Jade Drive, Pasig, Philippines
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href="tel:09171742419"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-white font-bold text-sm hover:bg-white/10 transition-all"
          style={{
            borderColor: "rgba(232,168,160,0.3)",
            fontFamily: "monospace",
          }}
        >
          <Phone
            className="w-4 h-4"
            style={{ color: "rgba(232,168,160,0.7)" }}
          />
          09171742419
        </a>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-sm"
          style={{ background: "linear-gradient(135deg,#003366,#003366)" }}
        >
          <Mail className="w-4 h-4" />
          Send Inquiry
        </Link>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuick, setActiveQuick] = useState("");
  const [selectedService, setSelectedService] = useState<{
    svc: Service;
    idx: number;
  } | null>(null);
  const cities = usePropertyCities();

  // ── Load services, then sync hash ─────────────────────────────────────────
  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        const list: Service[] = Array.isArray(data) ? data : (data.data ?? []);
        setServices(list);

        // After services load, check if there's a hash in the URL and match it
        const hash = window.location.hash.replace("#", "").trim();
        if (hash) {
          const matched = list.find(
            (s) => toSlug(s.label) === hash || String(s.id) === hash,
          );
          if (matched) setActiveQuick(String(matched.id));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Listen for hash changes while on the page (nav clicks) ───────────────
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "").trim();
      if (!hash) {
        setActiveQuick("");
        return;
      }
      setServices((current) => {
        const matched = current.find(
          (s) => toSlug(s.label) === hash || String(s.id) === hash,
        );
        if (matched) setActiveQuick(String(matched.id));
        return current;
      });
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const visibleServices = activeQuick
    ? services.filter((s) => String(s.id) === String(activeQuick))
    : services;

  return (
    <div
      className="w-full min-h-screen"
      style={{
        background:
          "linear-gradient(145deg,#3d1818 0%,#4a1f1f 50%,#2d1212 100%)",
        fontFamily: "'Georgia', serif",
      }}
    >
      {/* Hero */}
      <section className="relative pt-28 overflow-hidden bg-gradient-to-bl from-red-800/80 from-[10%] via-[#3d0012]/90 via-[70%] to-red-800/60 to-[100%]">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg,#fff 0px,#fff 1px,transparent 1px,transparent 12px)",
          }}
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20"
          style={{
            background: "radial-gradient(ellipse,#e8a8a0 0%,transparent 70%)",
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div
              className="h-px flex-1 max-w-[40px]"
              style={{ background: "rgba(232,168,160,0.4)" }}
            />
            <span
              className="text-[10px] font-bold tracking-[0.35em] uppercase"
              style={{
                fontFamily: "monospace",
                color: "rgba(232,168,160,0.6)",
              }}
            >
              Alfima Realty Inc. · What We Offer
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">
            <div>
              <h1
                className="font-black leading-none mb-6 text-white"
                style={{
                  fontSize: "clamp(3.5rem,8vw,7rem)",
                  letterSpacing: "-0.03em",
                  lineHeight: 0.9,
                }}
              >
                <span className="block">Our</span>
                <span
                  className="block"
                  style={{
                    WebkitTextStroke: "2px #e46363",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Services.
                </span>
              </h1>
              <p
                className="text-white/65 text-base mb-8 max-w-lg leading-relaxed"
                style={{ fontFamily: "monospace" }}
              >
                End-to-end real estate solutions — from finding and financing
                your property to designing, building, and managing it.
              </p>
              <div className="flex items-center gap-2 flex-wrap pb-8">
                {/* All Services button */}
                <button
                  onClick={() => {
                    setActiveQuick("");
                    history.replaceState(null, "", window.location.pathname);
                  }}
                  className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide border transition-all ${activeQuick === "" ? "text-white" : "text-white/70 hover:text-white"}`}
                  style={
                    activeQuick === ""
                      ? {
                          background: "linear-gradient(135deg,#003366,#3547e8)",
                          borderColor: "rgba(232,168,160,0.5)",
                          boxShadow: "0 0 20px rgba(232,168,160,0.3)",
                        }
                      : {
                          background: "rgba(255,255,255,0.06)",
                          borderColor: "rgba(255,255,255,0.15)",
                        }
                  }
                >
                  All Services
                </button>

                {/* Individual service filter buttons */}
                {services.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => {
                      setActiveQuick(String(svc.id));
                      history.replaceState(null, "", `#${toSlug(svc.label)}`);
                    }}
                    className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide border transition-all ${String(activeQuick) === String(svc.id) ? "text-white" : "text-white/70 hover:text-white"}`}
                    style={
                      String(activeQuick) === String(svc.id)
                        ? {
                            background:
                              "linear-gradient(135deg,#003366,#3547e8)",
                            borderColor: "rgba(232,168,160,0.5)",
                            boxShadow: "0 0 20px rgba(232,168,160,0.3)",
                          }
                        : {
                            background: "rgba(255,255,255,0.06)",
                            borderColor: "rgba(255,255,255,0.15)",
                          }
                    }
                  >
                    {svc.label}
                  </button>
                ))}
              </div>
            </div>
            {!loading && services.length > 0 && (
              <div className="hidden lg:block">
                <HeroPanel services={services} cities={cities} />
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg
            viewBox="0 0 1440 48"
            preserveAspectRatio="none"
            className="w-full h-12"
            fill="#ffffff"
          >
            <path d="M0,48 C480,0 960,48 1440,16 L1440,48 Z" />
          </svg>
        </div>
      </section>

      <StatTicker count={services.length} />

      {/* Services grid */}
      <section className="py-10 bg-gradient-to-t from-[#8b1a1a] from-[20%] to-red-800/30 to-[100%]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-1 h-6 rounded-full"
              style={{
                background: "linear-gradient(to bottom,#e8a8a0,#d4a5a0)",
              }}
            />
            <p
              className="text-white/60 text-sm"
              style={{ fontFamily: "monospace" }}
            >
              <span
                style={{ color: "rgba(232,168,160,0.8)", fontWeight: "bold" }}
              >
                {visibleServices.length}
              </span>{" "}
              Service{visibleServices.length !== 1 ? "s" : ""}
            </p>
          </div>

          {loading ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              style={{ gridAutoRows: "1fr" }}
            >
              {[...Array(3)].map((_, i) => (
                <ServiceSkeleton key={i} />
              ))}
            </div>
          ) : visibleServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
              <p
                className="text-white/40 text-sm"
                style={{ fontFamily: "monospace" }}
              >
                No services available at the moment.
              </p>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              style={{ gridAutoRows: "1fr" }}
            >
              {visibleServices.map((svc, idx) => (
                <ServiceCard
                  key={svc.id}
                  svc={svc}
                  idx={idx}
                  onClick={() => setSelectedService({ svc, idx })}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact */}
      <section
        className="relative py-16 inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://i.pinimg.com/736x/03/0f/2c/030f2c6f7e7f5d1e898bbdafc10400b6.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-white opacity-70" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ContactStrip />
        </div>
      </section>

      {/* Detail Modal */}
      {selectedService && (
        <ServiceDetailModal
          svc={selectedService.svc}
          idx={selectedService.idx}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  );
}
