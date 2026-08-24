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
    <div className="flex flex-col items-center gap-2 w-[170px] shrink-0">
      <div className="w-[170px] h-[120px] bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
        {logo_url ? (
          <img
            src={logo_url}
            alt={name}
            draggable={false}
            className="w-full h-full object-contain p-3"
          />
        ) : (
          <span className="text-gray-400 text-lg font-semibold text-center px-2">
            {initials}
          </span>
        )}
      </div>
      <p className="text-rose-100 text-sm text-center leading-tight max-w-[160px]">
        {name}
      </p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col items-center gap-2 w-[170px] shrink-0 animate-pulse">
      <div className="w-[170px] h-[120px] bg-white/20 rounded-xl" />
      <div className="h-3 w-24 rounded bg-white/20" />
    </div>
  );
}

export function PartnerDevelopers() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/partners")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setPartners(
            (data.data as Partner[]).filter(
              (p) => p.is_active && p.category?.toLowerCase() === "developer",
            ),
          );
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const track = [...partners, ...partners];
  const duration = Math.max(partners.length * 4, 20);

  return (
    <section className="py-2 sm:py-5">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        <h2 className="text-1xl sm:text-5xl font-bold text-white mb-4">
          Our Partner Developers
        </h2>

        <p className="text-rose-100 text-xl max-w-1xl">
          Trusted developers we work with to bring you premium listings
        </p>
      </div>
      <div className="max-w-1xl mx-auto my-12 px-4 sm:px-6 lg:px-8">
        {error && (
          <p className="text-rose-100/70 text-sm mb-6">
            Could not load partners at this time.
          </p>
        )}

        {loading ? (
          <div className="flex gap-8 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : partners.length === 0 ? (
          <p className="text-rose-100/70 text-sm">No partners to display.</p>
        ) : (
          <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div
              className="flex gap-8 w-max animate-marquee-rtl"
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
                animation: marquee-rtl var(--marquee-duration, 30s) linear
                  infinite;
                will-change: transform;
              }
            `}</style>
          </div>
        )}
      </div>
    </section>
  );
}
