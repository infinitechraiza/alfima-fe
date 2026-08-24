"use client";

import { useEffect, useState } from "react";

interface Partner {
  id: number;
  name: string;
  logo_url: string | null;
  is_active: boolean;
  category?: string;
}

function PartnerCard({ name, logo_url }: { name: string; logo_url: string | null }) {
  const initials = name
    .split(" ")
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col items-center gap-1.5 w-[150px] shrink-0">
      <div className="w-[150px] h-[110px] bg-white rounded-sm flex items-center justify-center overflow-hidden">
        {logo_url ? (
          <img
            src={logo_url}
            alt={name}
            draggable={false}
            className="w-full h-full object-contain p-2.5"
          />
        ) : (
          <span className="text-gray-400 text-lg font-semibold text-center px-2">
            {initials}
          </span>
        )}
      </div>
      <p className="text-[#dce4e9] text-xs text-center leading-tight max-w-[140px]">
        {name}
      </p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col items-center gap-1.5 w-[150px] shrink-0 animate-pulse">
      <div className="w-[150px] h-[110px] bg-white/20 rounded-sm" />
      <div className="h-3 w-20 rounded bg-white/20" />
    </div>
  );
}

/** Infinite right-to-left marquee. Never pauses, never visibly resets. */
function PartnerMarquee({
  partners,
  loading,
  skeletonCount = 8,
}: {
  partners: Partner[];
  loading: boolean;
  skeletonCount?: number;
}) {
  if (loading) {
    return (
      <div className="flex gap-6 overflow-hidden justify-center">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (partners.length === 0) {
    return (
      <p className="text-center text-white/40 text-sm">
        No partners to display.
      </p>
    );
  }

  // Duplicate the track so translateX(-50%) loops seamlessly.
  const track = [...partners, ...partners];
  const duration = Math.max(partners.length * 4, 20);

  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div
        className="flex gap-6 w-max animate-marquee-rtl"
        style={{ ["--marquee-duration" as string]: `${duration}s` }}
      >
        {track.map((p, i) => (
          <PartnerCard key={`${p.id}-${i}`} {...p} />
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee-rtl {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .animate-marquee-rtl {
          animation: marquee-rtl var(--marquee-duration, 30s) linear infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  );
}

interface PartnerSectionProps {
  title: string;
  partners: Partner[];
  loading: boolean;
}

function PartnerSection({ title, partners, loading }: PartnerSectionProps) {
  return (
    <div className="mb-14 last:mb-0">
      <h3 className="text-2xl sm:text-3xl text-center font-bold text-white mb-8 tracking-wide">
        {title}
      </h3>

      <div className="flex items-center justify-center mb-8">
        <div className="h-px w-24 bg-white/30" />
        <div className="mx-3 w-1.5 h-1.5 rounded-full bg-white/50" />
        <div className="h-px w-24 bg-white/30" />
      </div>

      <PartnerMarquee partners={partners} loading={loading} skeletonCount={6} />
    </div>
  );
}

export function OurPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/partners")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setPartners((data.data as Partner[]).filter((p) => p.is_active));
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const developers = partners.filter(
    (p) => p.category?.toLowerCase() === "developer",
  );
  const banks = partners.filter((p) => p.category?.toLowerCase() === "bank");

  return (
    <section className="py-16 sm:py-20" style={{ backgroundColor: "#8B1A1A" }}>
      <div className="max-w-5xl mx-auto px-6">
        {error && (
          <p className="text-center text-white/50 text-sm mb-6">
            Could not load partners at this time.
          </p>
        )}

        {/* Developers on top — infinite right-to-left marquee */}
        <PartnerSection
          title="OUR PARTNER DEVELOPERS"
          partners={developers}
          loading={loading}
        />

        {!loading && (
          <div className="my-12 flex items-center justify-center">
            <div className="h-px flex-1 bg-white/20" />
          </div>
        )}
        {loading && <div className="my-12" />}

        {/* Banks below */}
        <PartnerSection
          title="OUR PARTNER BANKS"
          partners={banks}
          loading={loading}
        />
      </div>
    </section>
  );
}