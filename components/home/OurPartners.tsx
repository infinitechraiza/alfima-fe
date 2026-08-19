"use client";

import { useEffect, useState } from "react";

interface Partner {
  id: number;
  name: string;
  logo_url: string | null;
  is_active: boolean;
  category?: string;
}

function PartnerCard({
  name,
  logo_url,
}: {
  name: string;
  logo_url: string | null;
}) {
  const initials = name
    .split(" ")
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col items-center gap-1.5 w-[150px]">
      <div className="w-[150px] h-[110px] bg-white rounded-sm flex items-center justify-center overflow-hidden">
        {logo_url ? (
          <img
            src={logo_url}
            alt={name}
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
    <div className="flex flex-col items-center gap-1.5 w-[150px] animate-pulse">
      <div className="w-[150px] h-[110px] bg-white/20 rounded-sm" />
      <div className="h-3 w-20 rounded bg-white/20" />
    </div>
  );
}

interface PartnerSectionProps {
  title: string;
  partners: Partner[];
  loading: boolean;
  skeletonCount?: number;
}

function PartnerSection({
  title,
  partners,
  loading,
  skeletonCount = 6,
}: PartnerSectionProps) {
  const skeletons = Array.from({ length: skeletonCount });

  return (
    <div className="mb-14 last:mb-0">
      {/* Section Header */}
      <h3 className="text-2xl sm:text-3xl text-center font-bold text-white mb-8 tracking-wide">
        {title}
      </h3>

      {/* Divider */}
      <div className="flex items-center justify-center mb-8">
        <div className="h-px w-24 bg-white/30" />
        <div className="mx-3 w-1.5 h-1.5 rounded-full bg-white/50" />
        <div className="h-px w-24 bg-white/30" />
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="flex flex-wrap justify-center gap-2.5">
          {skeletons.map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Partner grid */}
      {!loading && partners.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2.5">
          {partners.map((p) => (
            <PartnerCard key={p.id} {...p} />
          ))}
        </div>
      )}

      {!loading && partners.length === 0 && (
        <p className="text-center text-white/40 text-sm">
          No partners to display.
        </p>
      )}
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
        {/* Main Header */}

        {error && (
          <p className="text-center text-white/50 text-sm mb-6">
            Could not load partners at this time.
          </p>
        )}

        {/* Partner Developers Section */}
        <PartnerSection
          title="OUR PARTNER DEVELOPERS"
          partners={developers}
          loading={loading}
          skeletonCount={6}
        />

        {/* Separator between sections */}
        {!loading && (
          <div className="my-12 flex items-center justify-center">
            <div className="h-px flex-1 bg-white/20" />
          </div>
        )}
        {loading && <div className="my-12" />}

        {/* Partner Banks Section */}
        <PartnerSection
          title="OUR PARTNER BANKS"
          partners={banks}
          loading={loading}
          skeletonCount={6}
        />
      </div>
    </section>
  );
}
