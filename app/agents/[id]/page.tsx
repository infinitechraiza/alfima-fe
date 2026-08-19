"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Star,
  ArrowLeft,
  MapPin,
  Award,
  Bed,
  Bath,
  Ruler,
  Image as ImageIcon,
  Users,
  Video,
  Facebook,
  Instagram,
  Youtube,
  Globe,
  Shield,
  Zap,
  TrendingUp,
  BadgeCheck,
  Trophy,
  Target,
  Heart,
  ThumbsUp,
  Sparkles,
  Building2,
  Home,
  Key,
  GraduationCap,
  Handshake,
  Medal,
} from "lucide-react";

import Image from "next/image";

// ─── Achievement Catalog (single source of truth — same as dashboard) ─────────
export const ACHIEVEMENT_CATALOG = [
  {
    key: "prc_licensed",
    label: "PRC Licensed",
    icon: Shield,
    color: "from-blue-500 to-blue-700",
    category: "Credentials",
  },
  {
    key: "reb_licensed",
    label: "REB Licensed",
    icon: BadgeCheck,
    color: "from-sky-500 to-sky-700",
    category: "Credentials",
  },
  {
    key: "hlurb_accredited",
    label: "HLURB Accredited",
    icon: Award,
    color: "from-indigo-500 to-indigo-700",
    category: "Credentials",
  },
  {
    key: "top_performer",
    label: "Top Performer",
    icon: Trophy,
    color: "from-amber-500 to-amber-700",
    category: "Performance",
  },
  {
    key: "500_deals",
    label: "500+ Deals Closed",
    icon: TrendingUp,
    color: "from-violet-500 to-violet-700",
    category: "Performance",
  },
  {
    key: "100_deals",
    label: "100+ Deals Closed",
    icon: TrendingUp,
    color: "from-purple-500 to-purple-700",
    category: "Performance",
  },
  {
    key: "million_seller",
    label: "₱1M+ Sales/Month",
    icon: Target,
    color: "from-emerald-500 to-emerald-700",
    category: "Performance",
  },
  {
    key: "fast_responder",
    label: "Fast Responder",
    icon: Zap,
    color: "from-rose-500 to-rose-700",
    category: "Service",
  },
  {
    key: "5_star_rated",
    label: "5-Star Rated",
    icon: Star,
    color: "from-yellow-400 to-yellow-600",
    category: "Service",
  },
  {
    key: "client_favorite",
    label: "Client Favorite",
    icon: Heart,
    color: "from-pink-500 to-pink-700",
    category: "Service",
  },
  {
    key: "highly_recommended",
    label: "Highly Recommended",
    icon: ThumbsUp,
    color: "from-teal-500 to-teal-700",
    category: "Service",
  },
  {
    key: "luxury_specialist",
    label: "Luxury Specialist",
    icon: Sparkles,
    color: "from-amber-400 to-orange-600",
    category: "Specialty",
  },
  {
    key: "condo_specialist",
    label: "Condo Specialist",
    icon: Building2,
    color: "from-cyan-500 to-cyan-700",
    category: "Specialty",
  },
  {
    key: "house_lot_expert",
    label: "House & Lot Expert",
    icon: Home,
    color: "from-green-500 to-green-700",
    category: "Specialty",
  },
  {
    key: "commercial_expert",
    label: "Commercial Expert",
    icon: Building2,
    color: "from-slate-500 to-slate-700",
    category: "Specialty",
  },
  {
    key: "rental_expert",
    label: "Rental Expert",
    icon: Key,
    color: "from-orange-500 to-orange-700",
    category: "Specialty",
  },
  {
    key: "ncr_specialist",
    label: "NCR Specialist",
    icon: MapPin,
    color: "from-red-500 to-red-700",
    category: "Location",
  },
  {
    key: "provincial_expert",
    label: "Provincial Expert",
    icon: Globe,
    color: "from-lime-500 to-lime-700",
    category: "Location",
  },
  {
    key: "developer_partner",
    label: "Developer Partner",
    icon: Handshake,
    color: "from-fuchsia-500 to-fuchsia-700",
    category: "Network",
  },
  {
    key: "team_leader",
    label: "Team Leader",
    icon: Users,
    color: "from-blue-400 to-indigo-600",
    category: "Network",
  },
  {
    key: "certified_trainer",
    label: "Certified Trainer",
    icon: GraduationCap,
    color: "from-violet-400 to-purple-600",
    category: "Network",
  },
  {
    key: "verified_agent",
    label: "Verified Agent",
    icon: Medal,
    color: "from-emerald-400 to-teal-600",
    category: "Credentials",
  },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Agent {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  role?: string;
  rating?: number;
  review_count?: number;
  listings?: number;
  location?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  website?: string;
  viber?: string;
  whatsapp?: string;
}

interface GalleryItem {
  id: number;
  url: string;
  caption?: string;
}
interface CertItem {
  id: number;
  url: string;
  title?: string;
}
interface VideoItem {
  id: number;
  url: string;
  title?: string;
}

interface Review {
  id: number;
  rating: number;
  comment?: string;
  created_at: string;
  user?: { name: string; avatar?: string };
  reviewer_name?: string;
}

type Tab =
  | "certificates"
  | "gallery"
  | "videos"
  | "testimonials"
  | "properties";

function toArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  return [];
}

// ─── Theme ────────────────────────────────────────────────────────────────────
const BG_PAGE = "linear-gradient(145deg,#3d1818 0%,#4a1f1f 50%,#2d1212 100%)";
const BG_LOAD = "linear-gradient(145deg,#3d1818 0%,#4a1f1f 50%,#2d1212 100%)";
const CARD_BG = "rgba(255,255,255,0.10)";
const CARD_STYLE = {
  background: CARD_BG,
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.16)",
  boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
};

// ─── Message Modal ────────────────────────────────────────────────────────────
function MessageModal({
  agent,
  onClose,
}: {
  agent: Agent;
  onClose: () => void;
}) {
  const raw = agent.phone?.replace(/\D/g, "") ?? "";
  const intl = raw.startsWith("0") ? `63${raw.slice(1)}` : raw;

  const options = [
    {
      label: "Viber",
      icon: "📱",
      href: `viber://chat?number=+${intl}`,
      bg: "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100",
    },
    {
      label: "WhatsApp",
      icon: "💬",
      href: `https://wa.me/${intl}`,
      bg: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
    },
    {
      label: "SMS",
      icon: "✉️",
      href: `sms:${agent.phone}`,
      bg: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
    },
    {
      label: "Email",
      icon: "📧",
      href: `mailto:${agent.email}`,
      bg: "bg-red-50 border-red-200 text-red-800 hover:bg-red-100",
    },
  ];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="rounded-3xl shadow-2xl w-full max-w-sm p-6"
          style={{
            background: "rgba(250,245,245,0.98)",
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <img
                src={agent.avatar ?? "/placeholder-avatar.png"}
                alt={agent.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-rose-200 shadow"
              />
              <div>
                <p className="font-black text-gray-900 text-sm">{agent.name}</p>
                <p className="text-xs text-gray-400">Choose how to reach out</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{
                background: "#2a2020",
                border: "2px solid rgba(255,255,255,0.15)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
              }}
            >
              <span className="text-white font-black text-lg leading-none">
                ✕
              </span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {options.map((opt) => (
              <a
                key={opt.label}
                href={opt.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all font-semibold text-sm ${opt.bg}`}
              >
                <span className="text-xl">{opt.icon}</span>
                <span>{opt.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const s = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${s} ${i <= Math.round(rating) ? "fill-yellow-400 stroke-yellow-400" : "stroke-gray-400 fill-gray-500"}`}
        />
      ))}
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-5 right-5 w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all hover:scale-110 active:scale-95"
        style={{
          background: "rgba(255,255,255,0.25)",
          border: "2px solid rgba(255,255,255,0.7)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
      >
        <span className="text-white font-black text-xl leading-none">✕</span>
      </button>
      <img
        src={src}
        alt=""
        className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ─── Empty ────────────────────────────────────────────────────────────────────
function Empty({ label }: { label: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-center">
      <div
        className="w-14 h-14 rounded-2xl border-2 border-dashed border-white/25 flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        <Award className="w-6 h-6 text-white/25" />
      </div>
      <p className="text-white/40 text-sm font-medium">{label}</p>
    </div>
  );
}

// ─── Property Card (copied from the standalone PropertyCard, not the developer one) ──
const BLUR_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8'%3ENo Image%3C/text%3E%3C/svg%3E";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_IMG ?? "http://localhost:8000"
).replace(/\/$/, "");

function toAbsoluteUrl(url: string | null | undefined): string {
  if (!url) return FALLBACK_IMG;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const cleanPath = url.replace(/^\//, "");
  return `${API_BASE}/${cleanPath}`;
}

function formatPropertyPrice(amount: number): string {
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

function PropertyCard({
  property,
  priority = false,
}: {
  property: any;
  priority?: boolean;
}) {
  const [imageError, setImageError] = useState(false);

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
    ? `${formatPropertyPrice(rawPrice)}/mo`
    : formatPropertyPrice(rawPrice);
  const fullPrice = isRent
    ? `₱${rawPrice.toLocaleString("en-PH")}/mo`
    : `₱${rawPrice.toLocaleString("en-PH")}`;

  return (
    <Link href={`/properties/${property.id}`} className="h-full">
      <div className="flex flex-col h-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.03] group cursor-pointer hover:bg-white/15">
        <div className="relative h-28 flex-shrink-0 overflow-hidden bg-muted">
          <Image
            src={rawImageUrl}
            alt={property.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
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
          <div className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-2 py-0.5 rounded-full text-[10px] font-bold z-10">
            {isRent ? "For Rent" : "For Sale"}
          </div>
        </div>

        <div className="flex flex-col flex-1 p-2.5">
          <p
            className="text-sm font-bold text-white leading-tight"
            title={fullPrice}
          >
            {priceDisplay}
          </p>

          <h3 className="font-medium text-xs mt-1 mb-1.5 line-clamp-1 text-white/90 group-hover:text-white transition">
            {property.title}
          </h3>

          <div className="flex items-start gap-1 text-[11px] text-white/60 mb-2">
            <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <p className="line-clamp-1">
              {[property.address, property.city, property.state]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>

          <div className="flex gap-2.5 mt-auto text-[10px] text-white/55 border-t border-white/15 pt-2">
            {(property.bedrooms ?? 0) > 0 && (
              <div className="flex items-center gap-0.5">
                <Bed className="w-3 h-3" />
                <span>{property.bedrooms}</span>
              </div>
            )}
            {(property.bathrooms ?? 0) > 0 && (
              <div className="flex items-center gap-0.5">
                <Bath className="w-3 h-3" />
                <span>{property.bathrooms}</span>
              </div>
            )}
            {property.area && (
              <div className="flex items-center gap-0.5">
                <Ruler className="w-3 h-3" />
                <span>{property.area}sqm</span>
              </div>
            )}
          </div>

          {property.agent && (
            <div className="mt-2 flex items-center gap-1.5 pt-2 border-t border-white/15">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={agentAvatarUrl}
                alt={property.agent.name}
                width={20}
                height={20}
                className="rounded-full object-cover flex-shrink-0 ring-1 ring-white/30 w-5 h-5"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(property.agent!.name)}&size=20&background=random`;
                }}
              />
              <p className="text-[10px] font-medium text-white/75 line-clamp-1">
                {property.agent.name}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AgentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [certs, setCerts] = useState<CertItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]); // ← string keys only
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("certificates");
  const [showMsg, setShowMsg] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [heroIn, setHeroIn] = useState(false);

  const [properties, setProperties] = useState<any[]>([]);
  useEffect(() => {
    setTimeout(() => setHeroIn(true), 80);
  }, []);
  useEffect(() => {
    if (properties.length > 0) {
      console.log("property sample:", properties[0]);
    }
  }, [properties]);
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const parseJsonSafe = async (res: Response) => {
          if (!res.ok) return null;
          try {
            return await res.json();
          } catch {
            return null;
          }
        };
        const [
          agentRes,
          reviewsRes,
          galleryRes,
          certsRes,
          videosRes,
          achievementsRes,
          propertiesRes,
        ] = await Promise.all([
          fetch(`/api/agents/${id}`),
          fetch(`/api/agents/${id}/reviews`),
          fetch(`/api/agents/${id}/gallery`),
          fetch(`/api/agents/${id}/certificates`),
          fetch(`/api/agents/${id}/videos`),
          fetch(`/api/agents/${id}/achievements`),
          fetch(`/api/properties?agent_id=${id}&per_page=50`),
        ]);

        const [
          agentData,
          reviewsData,
          galleryData,
          certsData,
          videosData,
          achievementsData,
          propertiesData,
        ] = await Promise.all([
          agentRes.json(),
          reviewsRes.json(),
          galleryRes.json(),
          certsRes.json(),
          videosRes.json(),
          achievementsRes.json(),
          parseJsonSafe(propertiesRes),
        ]);
        setAgent(agentData.data ?? agentData);
        setReviews(toArray<Review>(reviewsData.data ?? reviewsData));
        setGallery(toArray<GalleryItem>(galleryData.data ?? galleryData));
        setCerts(toArray<CertItem>(certsData.data ?? certsData));
        setVideos(toArray<VideoItem>(videosData.data ?? videosData));
        // achievements is string[] keys e.g. ["top_performer", "fast_responder"]
        setAchievements(
          toArray<string>(achievementsData.data ?? achievementsData),
        );
        setProperties(toArray<any>(propertiesData?.data ?? propertiesData));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: BG_LOAD }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          <p className="text-white/70 text-sm font-medium">Loading profile…</p>
        </div>
      </div>
    );

  if (!agent)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: BG_LOAD }}
      >
        <div className="text-center">
          <p className="text-2xl font-black text-white mb-2">Agent not found</p>
          <Link
            href="/agents"
            className="text-rose-300 hover:underline text-sm"
          >
            ← Back to agents
          </Link>
        </div>
      </div>
    );

  const avgRating = reviews.length
    ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
    : (agent.rating ?? 0);

  const tabs: {
    key: Tab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
    {
      key: "certificates",
      label: "Certificates",
      icon: <Award className="w-4 h-4" />,
      count: certs.length,
    },
    {
      key: "gallery",
      label: "Gallery",
      icon: <ImageIcon className="w-4 h-4" />,
      count: gallery.length,
    },
    {
      key: "videos",
      label: "Videos",
      icon: <Video className="w-4 h-4" />,
      count: videos.length,
    },
    {
      key: "testimonials",
      label: "Testimonials",
      icon: <Users className="w-4 h-4" />,
      count: reviews.length,
    },
    {
      key: "properties",
      label: "Properties",
      icon: <Home className="w-4 h-4" />,
      count: properties.length,
    },
  ];

  // Resolve achievement keys → full catalog entries
  const resolvedAchievements = achievements
    .map((key) => ACHIEVEMENT_CATALOG.find((a) => a.key === key))
    .filter(Boolean) as (typeof ACHIEVEMENT_CATALOG)[number][];

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-800/30 from-[40%] via-[#8b1a1a]/80 via-[70%] to-red-500/60 to-[100%] backdrop-blur-sm">
      <style>{`
        @keyframes float-slow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
        @keyframes float-med  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.35} 70%{transform:scale(1.45);opacity:0} 100%{transform:scale(1.45);opacity:0} }
        .float-slow { animation: float-slow 9s ease-in-out infinite; }
        .float-med  { animation: float-med  7s ease-in-out infinite; }
        .pulse-ring { animation: pulse-ring 2.5s ease-out infinite; }
      `}</style>

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="float-slow absolute -top-20 -left-20 w-80 h-80 rounded-full"
          style={{
            background:
              "radial-gradient(circle,rgba(180,80,80,0.18),transparent 70%)",
          }}
        />
        <div
          className="float-med absolute top-1/2 -right-16 w-64 h-64 rounded-full"
          style={{
            background:
              "radial-gradient(circle,rgba(160,70,70,0.14),transparent 70%)",
          }}
        />
        <div
          className="float-slow absolute -bottom-16 left-1/4 w-60 h-60 rounded-full"
          style={{
            background:
              "radial-gradient(circle,rgba(180,80,80,0.12),transparent 70%)",
            animationDelay: "3s",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px,rgba(255,255,255,0.06) 1px,transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        {/* Back */}
        <button
          onClick={() => router.back()}
          style={{
            opacity: heroIn ? 1 : 0,
            transform: heroIn ? "none" : "translateX(-16px)",
            transition: "opacity .55s ease, transform .55s ease",
          }}
          className="flex items-center gap-2 text-white/65 hover:text-white transition-colors text-sm font-semibold mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Agents
        </button>

        {/* Two-column grid */}
        <div
          style={{
            opacity: heroIn ? 1 : 0,
            transform: heroIn ? "none" : "translateY(28px)",
            transition: "opacity .75s ease 80ms, transform .75s ease 80ms",
          }}
          className="grid grid-cols-1 lg:grid-cols-[310px_1fr] gap-6 items-start"
        >
          {/* ══════════ LEFT ══════════ */}
          <div className="space-y-4">
            {/* Profile card */}
            <div className="rounded-3xl overflow-hidden" style={CARD_STYLE}>
              <div
                className="h-[3px] w-full"
                style={{
                  background:
                    "linear-gradient(90deg,transparent,rgba(220,120,120,0.6),transparent)",
                }}
              />

              <div className="p-6 flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative mb-4">
                  <div className="pulse-ring absolute inset-0 rounded-full border-2 border-rose-400/30" />
                  <img
                    src={agent.avatar ?? "/placeholder-avatar.png"}
                    alt={agent.name}
                    className="relative w-32 h-32 rounded-full object-cover"
                    style={{
                      border: "3px solid rgba(220,120,120,0.5)",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                    }}
                  />
                  <div
                    className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full bg-green-400"
                    style={{ border: "2.5px solid rgba(255,255,255,0.9)" }}
                  />
                </div>

                {/* Badge */}
                <div
                  className="inline-flex items-center gap-1.5 mb-2 px-3 py-1 rounded-full text-xs font-bold text-rose-200"
                  style={{
                    background: "rgba(200,80,80,0.22)",
                    border: "1px solid rgba(200,80,80,0.35)",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                  Agent Profile
                </div>

                <h1 className="text-xl font-black text-white leading-tight mb-0.5">
                  {agent.name}
                </h1>
                <p className="text-rose-300 font-semibold text-sm mb-3">
                  {agent.role ?? "Property Specialist"}
                </p>

                <div className="flex items-center gap-2 justify-center mb-2">
                  <Stars rating={avgRating} size="md" />
                  <span className="font-black text-white text-sm">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-white/50 text-xs">
                    · {reviews.length} reviews
                  </span>
                </div>

                {agent.location && (
                  <div className="flex items-center gap-1.5 text-xs text-white/55 mb-4 justify-center">
                    <MapPin className="w-3 h-3 text-rose-400" />
                    <span>{agent.location}</span>
                  </div>
                )}

                {agent.bio && (
                  <p className="text-white/60 text-xs leading-relaxed mb-5 px-1">
                    {agent.bio}
                  </p>
                )}

                {/* CTA */}
                {/* <div className="flex gap-2 w-full">
                  <a href={`tel:${agent.phone}`} className="flex-1">
                    <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-black transition-all hover:scale-105 active:scale-95"
                      style={{ background: 'linear-gradient(135deg,#a03040,#c04050)', boxShadow: '0 5px 18px rgba(160,48,64,0.4)' }}>
                      <Phone className="w-3.5 h-3.5" /> Call Now
                    </button>
                  </a>
                  <button onClick={() => setShowMsg(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-black transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)' }}>
                    <MessageSquare className="w-3.5 h-3.5" /> Message
                  </button>
                </div> */}
              </div>

              {/* Stats 2×2 */}
              <div className="grid grid-cols-2 border-t border-white/12">
                {[
                  { label: "Properties", value: agent.listings ?? 0 },
                  { label: "Rating", value: avgRating.toFixed(1) },
                  { label: "Reviews", value: reviews.length },
                  { label: "Videos", value: videos.length },
                ].map((s, i) => (
                  <div
                    key={s.label}
                    className={`py-4 text-center hover:bg-white/6 transition-colors ${i >= 2 ? "border-t border-white/12" : ""} ${i % 2 === 0 ? "border-r border-white/12" : ""}`}
                  >
                    <p className="text-2xl font-black text-white mb-0.5">
                      {s.value}
                    </p>
                    <p className="text-xs text-white/45 font-semibold tracking-wide">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Social links */}
            {(agent.facebook ||
              agent.instagram ||
              agent.youtube ||
              agent.website) && (
              <div className="rounded-2xl p-5" style={CARD_STYLE}>
                <h2 className="text-[11px] font-black text-white/50 uppercase tracking-widest mb-4">
                  Social Links
                </h2>
                <div className="space-y-3">
                  {agent.facebook && (
                    <a
                      href={agent.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: "rgba(59,130,246,0.18)",
                          border: "1px solid rgba(59,130,246,0.32)",
                        }}
                      >
                        <Facebook className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <span className="font-medium text-xs">Facebook</span>
                    </a>
                  )}

                  {agent.instagram && (
                    <a
                      href={agent.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: "rgba(236,72,153,0.18)",
                          border: "1px solid rgba(236,72,153,0.3)",
                        }}
                      >
                        <Instagram className="w-3.5 h-3.5 text-pink-400" />
                      </div>
                      <span className="font-medium text-xs">Instagram</span>
                    </a>
                  )}
                  {agent.youtube && (
                    <a
                      href={agent.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: "rgba(200,80,80,0.18)",
                          border: "1px solid rgba(200,80,80,0.32)",
                        }}
                      >
                        <Youtube className="w-3.5 h-3.5 text-rose-400" />
                      </div>
                      <span className="font-medium text-xs">YouTube</span>
                    </a>
                  )}
                  {agent.website && (
                    <a
                      href={agent.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: "rgba(255,255,255,0.1)",
                          border: "1px solid rgba(255,255,255,0.18)",
                        }}
                      >
                        <Globe className="w-3.5 h-3.5 text-white/70" />
                      </div>
                      <span className="font-medium text-xs">Website</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* ─── Achievements — resolved from ACHIEVEMENT_CATALOG by key ── */}
            {resolvedAchievements.length > 0 && (
              <div className="rounded-2xl p-5" style={CARD_STYLE}>
                <h2 className="text-[11px] font-black text-white/50 uppercase tracking-widest mb-4">
                  Achievements
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {resolvedAchievements.map((a) => {
                    const Icon = a.icon;
                    return (
                      <div
                        key={a.key}
                        className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-white/12 hover:border-white/25 hover:bg-white/8 transition-all duration-300 cursor-default group"
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${a.color} shadow-md group-hover:scale-110 transition-transform`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-white/65 text-center leading-tight group-hover:text-white transition-colors">
                          {a.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {/* end LEFT */}

          {/* ══════════ RIGHT — Tabs ══════════ */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ ...CARD_STYLE, minHeight: "500px" }}
          >
            {/* Tab bar */}
            <div
              className="flex border-b overflow-x-auto"
              style={{ borderColor: "rgba(255,255,255,0.14)" }}
            >
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap px-3 ${
                    activeTab === t.key
                      ? "text-white border-rose-400 bg-rose-800/40"
                      : "text-white/45 border-transparent hover:text-white/75 hover:bg-white/6"
                  }`}
                >
                  {t.icon}
                  <span className="hidden sm:inline">{t.label}</span>
                  {t.count !== undefined && t.count > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
                        activeTab === t.key
                          ? "bg-rose-500/55 text-white"
                          : "bg-white/12 text-white/45"
                      }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Certificates */}
              {activeTab === "certificates" &&
                (certs.length === 0 ? (
                  <Empty label="No certificates uploaded yet" />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {certs.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setLightbox(c.url)}
                        className="group relative rounded-2xl overflow-hidden border border-white/12 hover:border-rose-400/55 hover:shadow-xl transition-all aspect-[3/4]"
                      >
                        <img
                          src={c.url}
                          alt={c.title ?? "Certificate"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {c.title && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent px-3 py-2">
                            <p className="text-white text-xs font-bold truncate">
                              {c.title}
                            </p>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ))}

              {/* Gallery */}
              {activeTab === "gallery" &&
                (gallery.length === 0 ? (
                  <Empty label="No gallery images yet" />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {gallery.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setLightbox(g.url)}
                        className="group relative rounded-2xl overflow-hidden border border-white/12 hover:border-rose-400/55 hover:shadow-xl transition-all aspect-square"
                      >
                        <img
                          src={g.url}
                          alt={g.caption ?? "Gallery"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {g.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent px-3 py-2">
                            <p className="text-white text-xs font-bold truncate">
                              {g.caption}
                            </p>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ))}

              {/* Videos */}
              {activeTab === "videos" &&
                (videos.length === 0 ? (
                  <Empty label="No videos uploaded yet" />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {videos.map((v) => (
                      <div
                        key={v.id}
                        className="rounded-2xl overflow-hidden border border-white/12 hover:border-rose-400/35 transition-all"
                        style={{ background: "rgba(0,0,0,0.3)" }}
                      >
                        <video
                          src={v.url}
                          controls
                          className="w-full"
                          style={{
                            aspectRatio: "16/9",
                            display: "block",
                            background: "#000",
                          }}
                        />
                        {v.title && (
                          <div className="px-3 py-2.5">
                            <p className="text-white text-sm font-bold truncate">
                              {v.title}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}

              {/* Testimonials */}
              {activeTab === "testimonials" &&
                (reviews.length === 0 ? (
                  <Empty label="No reviews yet" />
                ) : (
                  <div className="space-y-4">
                    {reviews.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-2xl border border-white/12 p-4 hover:border-rose-400/30 hover:bg-white/5 transition-all"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                            style={{
                              background:
                                "linear-gradient(135deg,#a03040,#c04050)",
                              boxShadow: "0 4px 12px rgba(160,48,64,0.35)",
                            }}
                          >
                            {(r.user?.name ?? r.reviewer_name ?? "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                              <p className="font-black text-white text-sm">
                                {r.user?.name ?? r.reviewer_name ?? "Anonymous"}
                              </p>
                              <p className="text-xs text-white/35">
                                {new Date(r.created_at).toLocaleDateString(
                                  "en-PH",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <Stars rating={r.rating} />
                              <span className="text-xs font-bold text-yellow-400">
                                {r.rating}.0
                              </span>
                            </div>
                            {r.comment && (
                              <p className="text-sm text-white/65 leading-relaxed">
                                {r.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

              {/* Properties */}
              {activeTab === "properties" &&
                (properties.length === 0 ? (
                  <Empty label="No properties listed yet" />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {properties.map((p, idx) => (
                      <PropertyCard
                        key={p.id}
                        property={p}
                        priority={idx < 3}
                      />
                    ))}
                  </div>
                ))}
            </div>
          </div>
          {/* end RIGHT */}
        </div>
      </div>

      {showMsg && (
        <MessageModal agent={agent} onClose={() => setShowMsg(false)} />
      )}
      {lightbox && (
        <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
