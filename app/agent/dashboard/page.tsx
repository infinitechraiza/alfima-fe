"use client";

import { useAuth } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Settings,
  MessageSquare,
  Calendar,
  Building2,
  LogOut,
  ArrowRight,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Home,
  Clock,
  CheckCircle2,
  Eye,
  Search,
  RefreshCw,
  User,
  Bed,
  Bath,
  Ruler,
  Trash2,
  Edit2,
  TriangleAlert,
  Plus,
  Video,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Camera,
  Save,
  AlertCircle,
  Star,
  Image as ImageIcon,
  Shield,
  Zap,
  TrendingUp,
  BadgeCheck,
  Award,
  Trophy,
  Users,
  Globe,
  Key,
  Handshake,
  GraduationCap,
  Heart,
  ThumbsUp,
  Target,
  Medal,
  Sparkles,
} from "lucide-react";
import MediaPanel from "./media/MediaPanel";
import { usePushNotification } from "@/hooks/usePushNotification";

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

export type AchievementKey = (typeof ACHIEVEMENT_CATALOG)[number]["key"];

const CATEGORIES = Array.from(
  new Set(ACHIEVEMENT_CATALOG.map((a) => a.category)),
);

type ActivePanel =
  | "overview"
  | "inquiries"
  | "tours"
  | "listings"
  | "reviews"
  | "profile"
  | "media"
  | "achievements";

interface DashboardStats {
  inquiries: { total: number; new: number };
  tours: { total: number; pending: number };
  properties: number;
  reviews: { total: number; avg: number };
}

function imgUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = (process.env.NEXT_PUBLIC_API_IMG ?? "").replace(/\/$/, "");
  return `${base}/${path.replace(/^\//, "")}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StarRow({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "xs" | "lg";
}) {
  const cls = size === "xs" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${cls} ${s <= Math.round(rating) ? "fill-yellow-400 stroke-yellow-400" : "stroke-white/20"}`}
        />
      ))}
    </div>
  );
}

const INQ_STATUS = {
  new: {
    label: "New",
    dot: "bg-blue-400",
    pill: "bg-blue-500/10 border-blue-500/40 text-blue-400",
    icon: <Clock className="w-3 h-3" />,
  },
  contacted: {
    label: "Contacted",
    dot: "bg-amber-400",
    pill: "bg-amber-500/10 border-amber-500/40 text-amber-400",
    icon: <Phone className="w-3 h-3" />,
  },
  viewing_scheduled: {
    label: "Viewing Set",
    dot: "bg-violet-400",
    pill: "bg-violet-500/10 border-violet-500/40 text-violet-400",
    icon: <Calendar className="w-3 h-3" />,
  },
  closed: {
    label: "Closed",
    dot: "bg-emerald-400",
    pill: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
} as const;

const TOUR_STATUS = {
  pending: {
    label: "Pending",
    dot: "bg-amber-400",
    pill: "bg-amber-500/10 border-amber-500/40 text-amber-400",
    bar: "bg-amber-400",
  },
  confirmed: {
    label: "Confirmed",
    dot: "bg-blue-400",
    pill: "bg-blue-500/10 border-blue-500/40 text-blue-400",
    bar: "bg-blue-400",
  },
  completed: {
    label: "Completed",
    dot: "bg-emerald-400",
    pill: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400",
    bar: "bg-emerald-400",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-white/20",
    pill: "bg-white/5 border-white/10 text-white/40",
    bar: "bg-white/20",
  },
} as const;

const PROP_STATUS = {
  active: {
    label: "Active",
    dot: "bg-emerald-400",
    pill: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400",
  },
  sold: {
    label: "Sold",
    dot: "bg-blue-400",
    pill: "bg-blue-500/10 border-blue-500/40 text-blue-400",
  },
  rented: {
    label: "Rented",
    dot: "bg-violet-400",
    pill: "bg-violet-500/10 border-violet-500/40 text-violet-400",
  },
  inactive: {
    label: "Inactive",
    dot: "bg-white/30",
    pill: "bg-white/5 border-white/10 text-white/40",
  },
} as const;

const DEFAULT_PROP_STATUS = {
  label: "Unknown",
  dot: "bg-white/20",
  pill: "bg-white/5 border-white/10 text-white/40",
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function clearBadge() {
  if ("clearAppBadge" in navigator) {
    (navigator as any).clearAppBadge().catch(() => {});
  }
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: "CLEAR_BADGE" });
  }
}

// ── Achievements Panel ─────────────────────────────────────────────────────────
function AchievementsPanel({ userId }: { userId: number }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [activeTab, setActiveTab] = useState<string>("All");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/agents/${userId}/achievements`, {
          credentials: "include",
        });
        const json = await res.json();
        const keys: string[] = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
            ? json
            : [];
        setSelected(new Set(keys));
      } catch {
        /**/
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    setStatus("idle");
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/agents/achievements/sync", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: userId,
          achievement_keys: Array.from(selected),
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const displayedAchievements =
    activeTab === "All"
      ? ACHIEVEMENT_CATALOG
      : ACHIEVEMENT_CATALOG.filter((a) => a.category === activeTab);

  const tabs = ["All", ...CATEGORIES];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Achievements</h2>
          <p className="text-white/40 text-xs mt-0.5">
            {selected.size} of {ACHIEVEMENT_CATALOG.length} earned · shown on
            your public profile
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-red-600/30"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {status === "success" && (
        <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-300 text-sm font-medium">
            Achievements saved and live on your profile!
          </p>
        </div>
      )}
      {status === "error" && (
        <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">
            Failed to save. Please try again.
          </p>
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-5">
        {tabs.map((tab) => {
          const count =
            tab === "All"
              ? selected.size
              : ACHIEVEMENT_CATALOG.filter(
                  (a) => a.category === tab && selected.has(a.key),
                ).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                activeTab === tab
                  ? "bg-red-600/20 border-red-500/40 text-white"
                  : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
              }`}
            >
              {tab}
              {count > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-white/10 text-white/60">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
          <p className="text-white/30 text-sm">Loading achievements…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayedAchievements.map((achievement) => {
            const Icon = achievement.icon;
            const isChecked = selected.has(achievement.key);
            return (
              <button
                key={achievement.key}
                onClick={() => toggle(achievement.key)}
                className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                  isChecked
                    ? "border-white/25 bg-white/8 shadow-lg"
                    : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br flex-shrink-0 transition-all ${achievement.color} ${
                    isChecked
                      ? "shadow-lg scale-100"
                      : "opacity-40 grayscale group-hover:opacity-70 group-hover:grayscale-0"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-bold transition-colors ${isChecked ? "text-white" : "text-white/45 group-hover:text-white/70"}`}
                  >
                    {achievement.label}
                  </p>
                  <p
                    className={`text-[11px] transition-colors ${isChecked ? "text-white/40" : "text-white/20"}`}
                  >
                    {achievement.category}
                  </p>
                </div>
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isChecked
                      ? "bg-red-600 border-red-500 shadow-md shadow-red-600/30"
                      : "border-white/20 bg-white/5 group-hover:border-white/30"
                  }`}
                >
                  {isChecked && (
                    <svg
                      className="w-3.5 h-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                {isChecked && (
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20 pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {!loading && selected.size > 0 && status === "idle" && (
        <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
          <p className="text-white/30 text-xs">
            <span className="font-bold text-white/50">{selected.size}</span>{" "}
            achievements selected
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Overview Panel ─────────────────────────────────────────────────────────────
function OverviewPanel({
  stats,
  statsLoading,
  user,
  setPanel,
}: {
  stats: DashboardStats | null;
  statsLoading: boolean;
  user: any;
  setPanel: (p: ActivePanel) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-white/10 p-6 flex items-center gap-4">
        {user.avatar ? (
          <img
            src={imgUrl(user.avatar)}
            alt={user.name}
            className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20 flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-bold text-xl text-white truncate">{user.name}</h3>
          <p className="text-white/50 text-sm">{user.email}</p>
          <p className="text-white/40 text-sm">
            {user.phone ?? "No phone added"}
          </p>
          {!statsLoading && stats && stats.reviews.total > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <StarRow rating={stats.reviews.avg} size="xs" />
              <span className="text-xs text-yellow-400 font-bold">
                {stats.reviews.avg.toFixed(1)}
              </span>
              <span className="text-xs text-white/30">
                ({stats.reviews.total}{" "}
                {stats.reviews.total === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
          <span className="inline-block mt-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 capitalize">
            {user.role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          {
            label: "Inquiries",
            value: stats?.inquiries.total,
            sub: stats?.inquiries.new ? `${stats.inquiries.new} new` : null,
            subColor: "text-blue-400",
            icon: <MessageSquare className="w-5 h-5 text-red-400" />,
            panel: "inquiries" as ActivePanel,
          },
          {
            label: "Tours",
            value: stats?.tours.total,
            sub: stats?.tours.pending ? `${stats.tours.pending} pending` : null,
            subColor: "text-amber-400",
            icon: <Calendar className="w-5 h-5 text-red-400" />,
            panel: "tours" as ActivePanel,
          },
          {
            label: "Listings",
            value: stats?.properties,
            sub: null,
            subColor: "",
            icon: <Building2 className="w-5 h-5 text-red-400" />,
            panel: "listings" as ActivePanel,
          },
          {
            label: "Reviews",
            value: stats?.reviews.total,
            sub: stats?.reviews.avg
              ? `${stats.reviews.avg.toFixed(1)} avg`
              : null,
            subColor: "text-yellow-400",
            icon: <Star className="w-5 h-5 text-red-400" />,
            panel: "reviews" as ActivePanel,
          },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setPanel(s.panel)}
            className="glass rounded-2xl border border-white/10 p-5 text-left hover:border-white/20 transition-all group"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                {s.icon}
              </div>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-white/40 text-xs mb-1">{s.label}</p>
            <p className="text-2xl font-black text-white">
              {statsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-red-400 inline" />
              ) : (
                (s.value ?? "—")
              )}
            </p>
            {s.sub && (
              <p className={`text-xs font-semibold mt-0.5 ${s.subColor}`}>
                {s.sub}
              </p>
            )}
          </button>
        ))}
      </div>

      {!statsLoading && stats && stats.inquiries.new > 0 && (
        <button
          onClick={() => setPanel("inquiries")}
          className="w-full glass rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 flex items-center gap-4 hover:bg-blue-500/10 transition-all text-left"
        >
          <div className="w-10 h-10 bg-blue-500/20 border border-blue-500/40 rounded-xl flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-blue-300 text-sm">
              {stats.inquiries.new} new{" "}
              {stats.inquiries.new === 1 ? "inquiry" : "inquiries"} waiting
            </p>
            <p className="text-blue-400/60 text-xs">Tap to view and respond</p>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0" />
        </button>
      )}
      {!statsLoading && stats && stats.tours.pending > 0 && (
        <button
          onClick={() => setPanel("tours")}
          className="w-full glass rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center gap-4 hover:bg-amber-500/10 transition-all text-left"
        >
          <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/40 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-300 text-sm">
              {stats.tours.pending} tour{stats.tours.pending === 1 ? "" : "s"}{" "}
              pending confirmation
            </p>
            <p className="text-amber-400/60 text-xs">
              Tap to confirm or reschedule
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
        </button>
      )}

      <div className="glass rounded-2xl border border-white/10 p-5">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPanel("inquiries")}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all"
          >
            <MessageSquare className="w-4 h-4" /> Inquiries
          </button>
          <button
            onClick={() => setPanel("tours")}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold transition-all"
          >
            <Calendar className="w-4 h-4" /> Tours
          </button>
          <button
            onClick={() => setPanel("listings")}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold transition-all"
          >
            <Building2 className="w-4 h-4" /> My Listings
          </button>
          <button
            onClick={() => setPanel("achievements")}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold transition-all"
          >
            <Trophy className="w-4 h-4" /> Achievements
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inquiries Panel ────────────────────────────────────────────────────────────
function InquiriesPanel({ onViewed }: { onViewed: () => void }) {
  type InqStatus = "new" | "contacted" | "viewing_scheduled" | "closed";
  interface Inquiry {
    id: number;
    property_id: number;
    lead_name: string;
    lead_phone: string;
    lead_email: string | null;
    message: string | null;
    preferred_contact: string;
    viewing_date: string | null;
    status: InqStatus;
    created_at: string;
    property?: {
      id: number;
      title: string;
      thumbnail: string | null;
      address: string;
      city: string;
    };
  }
  interface Paginated {
    data: Inquiry[];
    current_page: number;
    last_page: number;
    total: number;
  }

  const [data, setData] = useState<Paginated | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  // ── Mark seen + clear badge when panel first mounts ───────────────────────
  useEffect(() => {
    fetch("/api/inquiries/mark-viewed", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    clearBadge();
    onViewed(); // tell parent to refresh nav badge count
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), per_page: "10" });
      if (statusFilter) p.set("status", statusFilter);
      const res = await fetch(`/api/inquiries?${p}`, {
        credentials: "include",
      });
      setData(await res.json());
    } catch {
      /**/
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const changeStatus = async (id: number, status: InqStatus) => {
    setUpdatingId(id);
    try {
      await fetch(`/api/inquiries/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setData((prev) =>
        prev
          ? {
              ...prev,
              data: prev.data.map((i) => (i.id === id ? { ...i, status } : i)),
            }
          : prev,
      );
    } catch {
      /**/
    } finally {
      setUpdatingId(null);
    }
  };

  const displayed = (data?.data ?? []).filter((i) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      i.lead_name.toLowerCase().includes(q) ||
      i.lead_phone.includes(q) ||
      (i.lead_email ?? "").toLowerCase().includes(q) ||
      (i.property?.title ?? "").toLowerCase().includes(q)
    );
  });

  const totalNew = data?.data.filter((i) => i.status === "new").length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white">Inquiries</h2>
            {totalNew > 0 && (
              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 animate-pulse">
                {totalNew} new
              </span>
            )}
          </div>
          <p className="text-white/40 text-xs mt-0.5">
            {data?.total ?? 0} total from buyers
          </p>
        </div>
        <button
          onClick={() => fetch_()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white text-xs font-semibold transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="glass rounded-xl border border-white/10 p-4 mb-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, property…"
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder-white/25 focus:outline-none focus:border-red-500/50 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(
            ["", "new", "contacted", "viewing_scheduled", "closed"] as const
          ).map((s) => {
            const cfg = s ? INQ_STATUS[s as InqStatus] : null;
            return (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                  statusFilter === s
                    ? cfg
                      ? cfg.pill
                      : "bg-white/10 border-white/20 text-white"
                    : "border-white/10 text-white/40 hover:text-white/70"
                }`}
              >
                {cfg && (
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                )}
                {cfg ? cfg.label : "All"}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          <p className="text-white/30 text-sm">Loading…</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <Inbox className="w-8 h-8 text-white/20" />
          <p className="text-white/40 text-sm">No inquiries found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((inq) => {
            const cfg = INQ_STATUS[inq.status];
            const isNew = inq.status === "new";
            const isExp = expanded === inq.id;
            const nexts = (
              ["new", "contacted", "viewing_scheduled", "closed"] as InqStatus[]
            ).filter((s) => s !== inq.status);
            return (
              <div
                key={inq.id}
                className={`glass rounded-xl border overflow-hidden transition-all ${isNew ? "border-blue-500/30" : "border-white/10"}`}
              >
                <div className={`h-0.5 w-full ${cfg.dot}`} />
                <div className="p-4">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
                      {inq.property?.thumbnail ? (
                        <img
                          src={imgUrl(inq.property.thumbnail)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-4 h-4 text-white/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.pill}`}
                          >
                            {cfg.icon}
                            {cfg.label}
                          </span>
                          {isNew && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 uppercase animate-pulse">
                              Unread
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-white/25 flex-shrink-0">
                          {timeAgo(inq.created_at)}
                        </span>
                      </div>
                      <p className="text-white text-sm font-bold truncate">
                        {inq.property?.title ?? `Property #${inq.property_id}`}
                      </p>
                      {inq.property && (
                        <p className="text-white/35 text-[11px] flex items-center gap-1 mb-2">
                          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                          {inq.property.city}
                        </p>
                      )}
                      <div className="bg-white/5 border border-white/8 rounded-lg px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-white/40" />
                          <span className="text-xs font-bold text-white">
                            {inq.lead_name}
                          </span>
                        </div>
                        <a
                          href={`tel:${inq.lead_phone}`}
                          className="flex items-center gap-1 text-[11px] text-white/50 hover:text-emerald-400 transition-colors"
                        >
                          <Phone className="w-2.5 h-2.5" />
                          {inq.lead_phone}
                        </a>
                        {inq.lead_email && (
                          <a
                            href={`mailto:${inq.lead_email}`}
                            className="flex items-center gap-1 text-[11px] text-white/50 hover:text-blue-400 transition-colors truncate max-w-[150px]"
                          >
                            <Mail className="w-2.5 h-2.5 flex-shrink-0" />
                            {inq.lead_email}
                          </a>
                        )}
                      </div>
                      {inq.message && (
                        <div className="mt-2">
                          <p
                            className={`text-[11px] text-white/40 italic leading-relaxed ${isExp ? "" : "line-clamp-1"}`}
                          >
                            "{inq.message}"
                          </p>
                          <button
                            onClick={() => setExpanded(isExp ? null : inq.id)}
                            className="text-[10px] text-white/30 hover:text-white/60 flex items-center gap-1 mt-0.5"
                          >
                            <Eye className="w-2.5 h-2.5" />
                            {isExp ? "Less" : "Read more"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2.5 bg-white/3 border-t border-white/8 flex items-center gap-2 flex-wrap">
                  <a
                    href={`tel:${inq.lead_phone}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                  >
                    <Phone className="w-3 h-3" /> Call
                  </a>
                  {inq.lead_email && (
                    <a
                      href={`mailto:${inq.lead_email}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-blue-400 hover:border-blue-500/30 transition-all"
                    >
                      <Mail className="w-3 h-3" /> Email
                    </a>
                  )}
                  <div className="ml-auto flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-white/25">Move to:</span>
                    {nexts.map((ns) => {
                      const nc = INQ_STATUS[ns];
                      return (
                        <button
                          key={ns}
                          disabled={updatingId === inq.id}
                          onClick={() => changeStatus(inq.id, ns)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-white/80 transition-all disabled:opacity-40"
                        >
                          {updatingId === inq.id ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${nc.dot}`}
                            />
                          )}
                          {nc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
          <p className="text-white/30 text-xs">
            Page {data.current_page} of {data.last_page}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white text-xs transition-all disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.last_page, p + 1))}
              disabled={page === data.last_page}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white text-xs transition-all disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tours Panel ────────────────────────────────────────────────────────────────
function ToursPanel() {
  type TourStatus = "pending" | "confirmed" | "completed" | "cancelled";
  interface Tour {
    id: number;
    property_id: number;
    lead_name: string;
    lead_phone: string;
    lead_email: string | null;
    tour_type: "in-person" | "video";
    tour_date: string;
    tour_time: string;
    status: TourStatus;
    created_at: string;
    property?: {
      id: number;
      title: string;
      thumbnail: string | null;
      city: string;
    };
  }
  interface Paginated {
    data: Tour[];
    current_page: number;
    last_page: number;
    total: number;
  }

  const [data, setData] = useState<Paginated | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), per_page: "10" });
      if (statusFilter) p.set("status", statusFilter);
      const res = await fetch(`/api/tours?${p}`, { credentials: "include" });
      setData(await res.json());
    } catch {
      /**/
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const changeStatus = async (id: number, status: TourStatus) => {
    setUpdatingId(id);
    try {
      await fetch(`/api/tours/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setData((prev) =>
        prev
          ? {
              ...prev,
              data: prev.data.map((t) => (t.id === id ? { ...t, status } : t)),
            }
          : prev,
      );
    } catch {
      /**/
    } finally {
      setUpdatingId(null);
    }
  };

  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  };
  const totalPending =
    data?.data.filter((t) => t.status === "pending").length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white">Tours</h2>
            {totalPending > 0 && (
              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 animate-pulse">
                {totalPending} pending
              </span>
            )}
          </div>
          <p className="text-white/40 text-xs mt-0.5">
            {data?.total ?? 0} total booked
          </p>
        </div>
        <button
          onClick={() => fetch_()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white text-xs font-semibold transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {(["", "pending", "confirmed", "completed", "cancelled"] as const).map(
          (s) => {
            const cfg = s ? TOUR_STATUS[s as TourStatus] : null;
            return (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                  statusFilter === s
                    ? cfg
                      ? cfg.pill
                      : "bg-white/10 border-white/20 text-white"
                    : "border-white/10 text-white/40 hover:text-white/70"
                }`}
              >
                {cfg && (
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                )}
                {cfg ? cfg.label : "All"}
              </button>
            );
          },
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
          <p className="text-white/30 text-sm">Loading…</p>
        </div>
      ) : (data?.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <Inbox className="w-8 h-8 text-white/20" />
          <p className="text-white/40 text-sm">No tours found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(data?.data ?? []).map((tour) => {
            const cfg = TOUR_STATUS[tour.status];
            const nexts = (
              ["pending", "confirmed", "completed", "cancelled"] as TourStatus[]
            ).filter((s) => s !== tour.status);
            return (
              <div
                key={tour.id}
                className="glass rounded-xl border border-white/10 overflow-hidden"
              >
                <div className={`h-0.5 w-full ${cfg.bar}`} />
                <div className="p-4">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
                      {tour.property?.thumbnail ? (
                        <img
                          src={imgUrl(tour.property.thumbnail)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-4 h-4 text-white/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.pill}`}
                        >
                          {cfg.label}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            tour.tour_type === "video"
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          }`}
                        >
                          {tour.tour_type === "video" ? (
                            <>
                              <Video className="w-2.5 h-2.5" /> Video
                            </>
                          ) : (
                            <>
                              <Home className="w-2.5 h-2.5" /> In-Person
                            </>
                          )}
                        </span>
                        <span className="text-[11px] text-white/25 ml-auto">
                          {timeAgo(tour.created_at)}
                        </span>
                      </div>
                      <p className="text-white text-sm font-bold truncate">
                        {tour.property?.title ??
                          `Property #${tour.property_id}`}
                      </p>
                      {tour.property && (
                        <p className="text-white/35 text-[11px] flex items-center gap-1 mb-2">
                          <MapPin className="w-2.5 h-2.5" />
                          {tour.property.city}
                        </p>
                      )}
                      <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 mb-2">
                        <Calendar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-amber-300">
                            {new Date(tour.tour_date).toLocaleDateString(
                              "en-PH",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </p>
                          <p className="text-[11px] text-amber-400/70">
                            {fmt(tour.tour_time)}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/8 rounded-lg px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-white/40" />
                          <span className="text-xs font-bold text-white">
                            {tour.lead_name}
                          </span>
                        </div>
                        <a
                          href={`tel:${tour.lead_phone}`}
                          className="flex items-center gap-1 text-[11px] text-white/50 hover:text-emerald-400 transition-colors"
                        >
                          <Phone className="w-2.5 h-2.5" />
                          {tour.lead_phone}
                        </a>
                        {tour.lead_email && (
                          <a
                            href={`mailto:${tour.lead_email}`}
                            className="flex items-center gap-1 text-[11px] text-white/50 hover:text-blue-400 transition-colors truncate max-w-[150px]"
                          >
                            <Mail className="w-2.5 h-2.5 flex-shrink-0" />
                            {tour.lead_email}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2.5 bg-white/3 border-t border-white/8 flex items-center gap-2 flex-wrap">
                  <a
                    href={`tel:${tour.lead_phone}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                  >
                    <Phone className="w-3 h-3" /> Call
                  </a>
                  <div className="ml-auto flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-white/25">Move to:</span>
                    {nexts.map((ns) => {
                      const nc = TOUR_STATUS[ns];
                      return (
                        <button
                          key={ns}
                          disabled={updatingId === tour.id}
                          onClick={() => changeStatus(tour.id, ns)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-white/80 transition-all disabled:opacity-40"
                        >
                          {updatingId === tour.id ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${nc.dot}`}
                            />
                          )}
                          {nc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data && data.last_page > 1 && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
          <p className="text-white/30 text-xs">
            Page {data.current_page} of {data.last_page}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white text-xs transition-all disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.last_page, p + 1))}
              disabled={page === data.last_page}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white text-xs transition-all disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Listings Panel ─────────────────────────────────────────────────────────────
function ListingsPanel() {
  type PropStatus = "active" | "sold" | "rented" | "inactive";
  interface Property {
    id: number;
    title: string;
    listing_type: "sale" | "rent";
    property_type: string;
    status: PropStatus;
    price: number | null;
    price_per_month: number | null;
    city: string;
    bedrooms: number | null;
    bathrooms: number | null;
    area: string | null;
    thumbnail: string | null;
  }
  interface Paginated {
    data: Property[];
    current_page: number;
    last_page: number;
    total: number;
  }

  const [data, setData] = useState<Paginated | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), per_page: "8" });
      if (search) p.set("search", search);
      const res = await fetch(`/api/agents/listings?${p}`, {
        credentials: "include",
      });
      setData(await res.json());
    } catch {
      /**/
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await fetch(`/api/properties/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setData((prev) =>
        prev
          ? {
              ...prev,
              data: prev.data.filter((p) => p.id !== id),
              total: prev.total - 1,
            }
          : prev,
      );
    } catch {
      /**/
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  const fmtPrice = (p: Property) =>
    p.listing_type === "rent"
      ? p.price_per_month
        ? `₱${Number(p.price_per_month).toLocaleString("en-PH")}/mo`
        : "—"
      : p.price
        ? `₱${Number(p.price).toLocaleString("en-PH")}`
        : "—";

  return (
    <div>
      {confirmId !== null && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150]"
            onClick={() => setConfirmId(null)}
          />
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <div className="glass border border-white/15 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
              <div className="flex gap-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                  <TriangleAlert className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-white font-bold mb-1">Delete Listing</p>
                  <p className="text-white/50 text-sm">
                    This will permanently remove the property.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/60 hover:text-white text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmId)}
                  disabled={deletingId === confirmId}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {deletingId === confirmId && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {deletingId === confirmId ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">My Listings</h2>
          <p className="text-white/40 text-xs mt-0.5">
            {data?.total ?? 0} properties listed
          </p>
        </div>
        <Link
          href="/list-property"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Add Listing
        </Link>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search listings…"
          className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-white/25 focus:outline-none focus:border-red-500/50 transition-all"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
          <p className="text-white/30 text-sm">Loading…</p>
        </div>
      ) : (data?.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-4">
          <Building2 className="w-8 h-8 text-white/20" />
          <p className="text-white/40 text-sm">No listings yet</p>
          <Link
            href="/list-property"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Your First Listing
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(data?.data ?? []).map((prop) => {
            const cfg =
              PROP_STATUS[prop.status as keyof typeof PROP_STATUS] ||
              DEFAULT_PROP_STATUS;
            return (
              <div
                key={prop.id}
                className="glass rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all"
              >
                <div className="flex">
                  <div className="relative w-28 flex-shrink-0">
                    {prop.thumbnail ? (
                      <img
                        src={imgUrl(prop.thumbnail)}
                        alt={prop.title}
                        className="w-full h-full object-cover"
                        style={{ minHeight: 110 }}
                      />
                    ) : (
                      <div
                        className="w-full flex items-center justify-center bg-white/5"
                        style={{ minHeight: 110 }}
                      >
                        <Home className="w-6 h-6 text-white/20" />
                      </div>
                    )}
                    <div
                      className={`absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                        prop.listing_type === "rent"
                          ? "bg-violet-600/90 text-white"
                          : "bg-red-600/90 text-white"
                      }`}
                    >
                      {prop.listing_type === "rent" ? "Rent" : "Sale"}
                    </div>
                  </div>
                  <div className="flex-1 p-3 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.pill}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                            />
                            {cfg.label}
                          </span>
                          <span className="text-[10px] text-white/30 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full capitalize">
                            {prop.property_type}
                          </span>
                        </div>
                        <p className="text-white text-sm font-bold truncate">
                          {prop.title}
                        </p>
                        <p className="text-white/35 text-[11px] flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                          {prop.city}
                        </p>
                      </div>
                      <p className="text-red-400 font-black text-sm flex-shrink-0">
                        {fmtPrice(prop)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {prop.bedrooms != null && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg">
                          <Bed className="w-2.5 h-2.5" />
                          {prop.bedrooms}
                        </span>
                      )}
                      {prop.bathrooms != null && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg">
                          <Bath className="w-2.5 h-2.5" />
                          {prop.bathrooms}
                        </span>
                      )}
                      {prop.area && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg">
                          <Ruler className="w-2.5 h-2.5" />
                          {prop.area}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/properties/${prop.id}`}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white hover:border-white/20 transition-all"
                      >
                        <Eye className="w-3 h-3" /> View
                      </Link>
                      {/* <Link href={`/agent/dashboard/listings/${prop.id}/edit`}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-blue-400 hover:border-blue-500/30 transition-all">
                        <Edit2 className="w-3 h-3" /> Edit
                      </Link> */}
                      {/* <button
                        onClick={() => setConfirmId(prop.id)}
                        disabled={deletingId === prop.id}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-red-400 hover:border-red-500/30 transition-all disabled:opacity-40"
                      >
                        {deletingId === prop.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}{" "}
                        Delete
                      </button> */}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data && data.last_page > 1 && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
          <p className="text-white/30 text-xs">
            Page {data.current_page} of {data.last_page}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white text-xs transition-all disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.last_page, p + 1))}
              disabled={page === data.last_page}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white text-xs transition-all disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reviews Panel ──────────────────────────────────────────────────────────────
function ReviewsPanel({ agentId }: { agentId: number }) {
  type ReviewStatus = "pending" | "approved" | "rejected";
  interface Review {
    id: number;
    rating: number;
    comment: string | null;
    status: ReviewStatus;
    created_at: string;
    buyer?: { id: number; name: string; avatar: string | null };
  }
  interface Paginated {
    data: Review[];
    total: number;
    current_page?: number;
    last_page?: number;
  }

  const REVIEW_STATUS: Record<
    ReviewStatus,
    { label: string; dot: string; pill: string }
  > = {
    pending: {
      label: "Pending",
      dot: "bg-amber-400",
      pill: "bg-amber-500/10 border-amber-500/40 text-amber-400",
    },
    approved: {
      label: "Approved",
      dot: "bg-emerald-400",
      pill: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400",
    },
    rejected: {
      label: "Rejected",
      dot: "bg-red-400",
      pill: "bg-red-500/10 border-red-500/40 text-red-400",
    },
  };

  const [data, setData] = useState<Paginated | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "">("");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/agent/reviews?${params}`, {
        credentials: "include",
      });
      const raw = await res.text();
      let json: any;
      try {
        json = JSON.parse(raw);
      } catch {
        setError("Unexpected response.");
        return;
      }
      let list: Review[] = [];
      let total = 0;
      let lastPage = 1;
      if (Array.isArray(json)) {
        list = json;
        total = json.length;
        lastPage = 1;
      } else if (Array.isArray(json?.data)) {
        list = json.data;
        total = json.total ?? list.length;
        lastPage = json.last_page ?? 1;
      } else if (Array.isArray(json?.data?.data)) {
        list = json.data.data;
        total = json.data.total ?? list.length;
        lastPage = json.data.last_page ?? 1;
      }
      setData({ data: list, total, last_page: lastPage, current_page: page });
    } catch {
      setError("Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }, [agentId, page, statusFilter]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const approveReview = async (id: number) => {
    const key = `${id}-approve`;
    setActioningId(key);
    try {
      const res = await fetch(`/api/reviews/${id}/approve`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        console.error(`[approve] ${res.status}`);
        return;
      }
      setData((prev) =>
        prev
          ? {
              ...prev,
              data: prev.data.map((r) =>
                r.id === id ? { ...r, status: "approved" as ReviewStatus } : r,
              ),
            }
          : prev,
      );
    } catch (e) {
      console.error("[approve]", e);
    } finally {
      setActioningId(null);
    }
  };

  const rejectReview = async (id: number) => {
    const key = `${id}-reject`;
    setActioningId(key);
    try {
      const res = await fetch(`/api/reviews/${id}/reject`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        console.error(`[reject] ${res.status}`);
        return;
      }
      setData((prev) =>
        prev
          ? {
              ...prev,
              data: prev.data.map((r) =>
                r.id === id ? { ...r, status: "rejected" as ReviewStatus } : r,
              ),
            }
          : prev,
      );
    } catch (e) {
      console.error("[reject]", e);
    } finally {
      setActioningId(null);
    }
  };

  const pendingCount =
    data?.data.filter((r) => r.status === "pending").length ?? 0;
  const approvedCount =
    data?.data.filter((r) => r.status === "approved").length ?? 0;
  const avg =
    data && approvedCount > 0
      ? data.data
          .filter((r) => r.status === "approved")
          .reduce((s, r) => s + r.rating, 0) / approvedCount
      : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white">My Reviews</h2>
            {pendingCount > 0 && (
              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 animate-pulse">
                {pendingCount} pending
              </span>
            )}
          </div>
          <p className="text-white/40 text-xs mt-0.5">
            {data?.total ?? 0} total · {approvedCount} approved
          </p>
        </div>
        <button
          onClick={() => fetch_()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white text-xs font-semibold transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {!loading && data && approvedCount > 0 && (
        <div className="glass rounded-2xl border border-white/10 p-5 mb-5 flex gap-6 flex-wrap">
          <div className="flex flex-col items-center justify-center min-w-[80px]">
            <p className="text-5xl font-black text-white">{avg.toFixed(1)}</p>
            <StarRow rating={avg} />
            <p className="text-white/30 text-xs mt-1">
              {approvedCount} approved
            </p>
          </div>
          <div className="flex-1 min-w-[160px] space-y-1.5">
            {[5, 4, 3, 2, 1].map((n) => {
              const count = data.data.filter(
                (r) => r.status === "approved" && r.rating === n,
              ).length;
              return (
                <div key={n} className="flex items-center gap-2">
                  <span className="text-[11px] text-white/40 w-3 text-right">
                    {n}
                  </span>
                  <Star className="w-3 h-3 fill-yellow-400 stroke-yellow-400 flex-shrink-0" />
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${(count / approvedCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-white/30 w-4">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-4">
        {(
          [
            { value: "", label: "All" },
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
          ] as const
        ).map((f) => {
          const cfg = f.value ? REVIEW_STATUS[f.value as ReviewStatus] : null;
          return (
            <button
              key={f.value}
              onClick={() => {
                setStatusFilter(f.value as ReviewStatus | "");
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                statusFilter === f.value
                  ? cfg
                    ? cfg.pill
                    : "bg-white/10 border-white/20 text-white"
                  : "border-white/10 text-white/40 hover:text-white/70"
              }`}
            >
              {cfg && (
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              )}
              {f.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
          <p className="text-white/30 text-sm">Loading…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <AlertCircle className="w-8 h-8 text-red-400/50" />
          <p className="text-red-400/70 text-sm">{error}</p>
        </div>
      ) : (data?.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <Star className="w-8 h-8 text-white/15" />
          <p className="text-white/40 text-sm">No reviews found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(data?.data ?? []).map((review) => {
            const cfg = REVIEW_STATUS[review.status];
            const isPending = review.status === "pending";
            const isApprovingThis = actioningId === `${review.id}-approve`;
            const isRejectingThis = actioningId === `${review.id}-reject`;
            const isActioning = isApprovingThis || isRejectingThis;
            return (
              <div
                key={review.id}
                className={`glass rounded-xl border overflow-hidden transition-all ${isPending ? "border-amber-500/30" : "border-white/10"}`}
              >
                <div className={`h-0.5 w-full ${cfg.dot}`} />
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {review.buyer?.avatar ? (
                      <img
                        src={imgUrl(review.buyer.avatar)}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover border border-white/20 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white text-sm font-bold">
                            {review.buyer?.name ?? "Anonymous"}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.pill}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                            />
                            {cfg.label}
                          </span>
                        </div>
                        <span className="text-[11px] text-white/25 flex-shrink-0">
                          {timeAgo(review.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <StarRow rating={review.rating} size="xs" />
                        <span
                          className={`text-[11px] font-bold ${review.rating >= 4 ? "text-emerald-400" : review.rating === 3 ? "text-amber-400" : "text-red-400"}`}
                        >
                          {review.rating === 5
                            ? "Excellent"
                            : review.rating === 4
                              ? "Very Good"
                              : review.rating === 3
                                ? "Good"
                                : review.rating === 2
                                  ? "Fair"
                                  : "Poor"}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-white/50 text-xs leading-relaxed italic bg-white/5 border border-white/8 rounded-lg px-3 py-2">
                          "{review.comment}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {isPending && (
                  <div className="px-4 py-3 bg-amber-500/5 border-t border-amber-500/20 flex items-center gap-3">
                    <p className="text-[11px] text-amber-400/70 flex-1">
                      Awaiting your approval to publish
                    </p>
                    <button
                      disabled={isActioning}
                      onClick={() => rejectReview(review.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[11px] font-bold transition-all disabled:opacity-40"
                    >
                      {isRejectingThis ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span className="font-black text-xs leading-none">
                          ✕
                        </span>
                      )}
                      Reject
                    </button>
                    <button
                      disabled={isActioning}
                      onClick={() => approveReview(review.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[11px] font-bold transition-all disabled:opacity-40"
                    >
                      {isApprovingThis ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      Approve
                    </button>
                  </div>
                )}
                {!isPending && (
                  <div
                    className={`px-4 py-2 border-t flex items-center gap-2 ${
                      review.status === "approved"
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-red-500/20 bg-red-500/5"
                    }`}
                  >
                    {review.status === "approved" ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span className="text-[11px] text-emerald-400/70">
                          Published on your public profile
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-red-400 font-black text-xs leading-none">
                          ✕
                        </span>
                        <span className="text-[11px] text-red-400/70 ml-1">
                          Hidden from public profile
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {data && (data.last_page ?? 1) > 1 && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
          <p className="text-white/30 text-xs">
            Page {data.current_page} of {data.last_page}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white text-xs transition-all disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                setPage((p) => Math.min(data.last_page ?? 1, p + 1))
              }
              disabled={page === (data.last_page ?? 1)}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white text-xs transition-all disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Profile Panel ──────────────────────────────────────────────────────────────
function ProfilePanel({
  user,
  fetchUser,
}: {
  user: any;
  fetchUser: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: user.name ?? "",
    phone: user.phone ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.phone && !/^09\d{9}$/.test(form.phone)) {
      setErrorMsg("Phone must be 11 digits starting with 09");
      setStatus("error");
      return;
    }
    setSaving(true);
    setStatus("idle");
    try {
      const fd = new FormData();
      fd.append("user_id", String(user.id));
      fd.append("name", form.name);
      fd.append("phone", form.phone);
      if (avatarFile) fd.append("avatar", avatarFile);
      const res = await fetch("/api/profile/update", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed");
      }
      await fetchUser();
      setStatus("success");
      setAvatarFile(null);
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const displayAvatar = avatarPreview ?? imgUrl(user.avatar);

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-5">Profile Settings</h2>
      {status === "success" && (
        <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-300 text-sm font-medium">
            Profile updated successfully
          </p>
        </div>
      )}
      {status === "error" && (
        <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{errorMsg}</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass rounded-2xl border border-white/10 p-6 text-center">
          <div className="relative inline-block mb-3">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={user.name}
                className="w-20 h-20 rounded-full mx-auto object-cover ring-2 ring-primary/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-full mx-auto bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-7 h-7 bg-red-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-500 transition">
              <Camera className="w-3.5 h-3.5 text-white" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setAvatarFile(f);
                    setAvatarPreview(URL.createObjectURL(f));
                  }
                }}
              />
            </label>
          </div>
          <p className="text-white font-bold text-sm">{user.name}</p>
          <span className="inline-block mt-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 capitalize">
            {user.role}
          </span>
          {avatarFile && (
            <p className="text-xs text-amber-400 mt-2">
              New photo — save to apply
            </p>
          )}
          <div className="mt-4 space-y-2 text-left">
            {user.phone && (
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                <Phone className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                <span className="text-xs text-white/60">{user.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
              <Mail className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
              <span className="text-xs text-white/60 truncate">
                {user.email}
              </span>
            </div>
            {user.specialization && (
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                <Building2 className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                <span className="text-xs text-white/60">
                  {user.specialization}
                </span>
              </div>
            )}
            {user.license_number && (
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                <Settings className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                <span className="text-xs text-white/60">
                  PRC: {user.license_number}
                </span>
              </div>
            )}
          </div>
        </div>
        <form
          onSubmit={handleSubmit}
          className="sm:col-span-2 glass rounded-2xl border border-white/10 p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none focus:border-red-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-3 bg-white/3 border border-white/8 rounded-xl text-white/30 text-sm cursor-not-allowed"
            />
            <p className="text-white/25 text-xs mt-1">
              Email cannot be changed
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    phone: e.target.value.replace(/\D/g, "").slice(0, 11),
                  }))
                }
                placeholder="09171234567"
                inputMode="numeric"
                className="w-full px-4 py-3 pr-14 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none focus:border-red-500/50 transition-all"
              />
              <span
                className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold ${form.phone.length === 11 ? "text-emerald-400" : "text-white/30"}`}
              >
                {form.phone.length}/11
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm transition-all shadow-lg shadow-red-600/30 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function AgentDashboardPage() {
  const { user, logout, initialized, fetchUser } = useAuth();
  const router = useRouter();
  usePushNotification();

  const [activePanel, setActivePanel] = useState<ActivePanel>("overview");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!user) return;
    setStatsLoading(true);
    try {
      const [a, b, c, d, e, f] = await Promise.all([
        fetch("/api/inquiries?per_page=1", { credentials: "include" }),
        fetch("/api/tours?per_page=1", { credentials: "include" }),
        fetch("/api/agents/listings?per_page=1", { credentials: "include" }),
        fetch("/api/inquiries?per_page=1&status=new", {
          credentials: "include",
        }),
        fetch("/api/tours?per_page=1&status=pending", {
          credentials: "include",
        }),
        fetch(`/api/agents/${user.id}/reviews`, { credentials: "include" }),
      ]);

      const [ai, bi, ci, di, ei, fi] = await Promise.all(
        [a, b, c, d, e, f].map((r) => (r.ok ? r.json() : null)),
      );

      console.log("[loadStats] ── ALL RESPONSES ──────────────────");
      console.log("[loadStats] a) inquiries total     :", ai);
      console.log("[loadStats] b) tours total         :", bi);
      console.log("[loadStats] c) listings total      :", ci);
      console.log("[loadStats] d) inquiries new       :", di);
      console.log("[loadStats] e) tours pending       :", ei);
      console.log("[loadStats] f) reviews             :", fi);
      console.log("[loadStats] ── EXTRACTED VALUES ─────────────");
      console.log("[loadStats] inquiries.total  :", ai?.total);
      console.log("[loadStats] inquiries.new    :", di?.total);
      console.log("[loadStats] tours.total      :", bi?.total);
      console.log("[loadStats] tours.pending    :", ei?.total);
      console.log("[loadStats] properties       :", ci?.total);

      let reviewList: any[] = [];
      if (Array.isArray(fi)) reviewList = fi;
      else if (Array.isArray(fi?.data)) reviewList = fi.data;
      else if (Array.isArray(fi?.data?.data)) reviewList = fi.data.data;

      const reviewTotal = fi?.total ?? fi?.data?.total ?? reviewList.length;
      const reviewAvg =
        reviewList.length > 0
          ? reviewList.reduce((s: number, r: any) => s + (r.rating ?? 0), 0) /
            reviewList.length
          : 0;

      const nextStats = {
        inquiries: { total: ai?.total ?? 0, new: di?.total ?? 0 },
        tours: { total: bi?.total ?? 0, pending: ei?.total ?? 0 },
        properties: ci?.total ?? 0,
        reviews: { total: reviewTotal ?? 0, avg: reviewAvg },
      };

      console.log("[loadStats] ── FINAL STATS ───────────────────");
      console.log("[loadStats]", nextStats);

      setStats(nextStats);
    } catch (err) {
      console.error("[loadStats] ERROR:", err);
    } finally {
      setStatsLoading(false);
    }
  }, [user]);

  // ── Load stats on mount + poll every 30s ─────────────────────────────────
  useEffect(() => {
    if (!initialized || !user) return;
    loadStats();
    const interval = setInterval(loadStats, 30_000);
    return () => clearInterval(interval);
  }, [initialized, user, loadStats]);

  // ── Clear badge when dashboard first opens ────────────────────────────────
  useEffect(() => {
    clearBadge();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  if (!initialized || !user) return null;

  const NAV: {
    id: ActivePanel;
    icon: React.ReactNode;
    label: string;
    badge?: number | null;
  }[] = [
    {
      id: "overview",
      icon: <LayoutDashboard className="w-4 h-4" />,
      label: "Overview",
    },
    {
      id: "inquiries",
      icon: <MessageSquare className="w-4 h-4" />,
      label: "Inquiries",
      badge: stats?.inquiries.new || null,
    },
    {
      id: "tours",
      icon: <Calendar className="w-4 h-4" />,
      label: "Tours",
      badge: stats?.tours.pending || null,
    },
    {
      id: "listings",
      icon: <Building2 className="w-4 h-4" />,
      label: "My Listings",
      badge: stats?.properties || null,
    },
    {
      id: "reviews",
      icon: <Star className="w-4 h-4" />,
      label: "Reviews",
      badge: stats?.reviews.total || null,
    },
    {
      id: "achievements",
      icon: <Trophy className="w-4 h-4" />,
      label: "Achievements",
    },
    { id: "media", icon: <ImageIcon className="w-4 h-4" />, label: "My Media" },
    { id: "profile", icon: <Settings className="w-4 h-4" />, label: "Profile" },
  ];

  return (
    <div className="max-w-7xl mt-10 mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-white/40 text-sm capitalize mb-0.5">
            {user.role} Account
          </p>
          <h1 className="text-3xl font-bold text-white">
            Welcome, {user.name.split(" ")[0]}!
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 text-sm font-semibold transition-all"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="glass rounded-2xl border border-white/10 p-3 sticky top-24">
            <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest px-3 mb-3">
              Menu
            </p>
            <nav className="space-y-1">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActivePanel(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activePanel === item.id
                      ? "bg-red-600/20 border border-red-500/30 text-white"
                      : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <span
                    className={activePanel === item.id ? "text-red-400" : ""}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge ? (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        item.id === "inquiries"
                          ? "bg-blue-500 border-blue-400 text-white"
                          : item.id === "tours"
                            ? "bg-amber-500 border-amber-400 text-white"
                            : item.id === "listings"
                              ? "bg-white/20 border-white/30 text-white"
                              : item.id === "reviews"
                                ? "bg-yellow-500 border-yellow-400 text-white"
                                : "bg-blue-500 border-blue-400 text-white"
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </nav>
            <div className="mt-3 pt-3 border-t border-white/8">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-white/40 hover:text-red-400 hover:bg-red-500/10 border border-transparent transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {activePanel === "overview" && (
            <OverviewPanel
              stats={stats}
              statsLoading={statsLoading}
              user={user}
              setPanel={setActivePanel}
            />
          )}
          {activePanel === "inquiries" && (
            <InquiriesPanel onViewed={loadStats} />
          )}
          {activePanel === "tours" && <ToursPanel />}
          {activePanel === "listings" && <ListingsPanel />}
          {activePanel === "reviews" && <ReviewsPanel agentId={user.id} />}
          {activePanel === "achievements" && (
            <AchievementsPanel userId={user.id} />
          )}
          {activePanel === "media" && <MediaPanel userId={user.id} />}
          {activePanel === "profile" && (
            <ProfilePanel user={user} fetchUser={fetchUser} />
          )}
        </div>
      </div>
    </div>
  );
}
