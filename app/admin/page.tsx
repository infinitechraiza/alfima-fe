"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Home,
  Users,
  FileText,
  Settings,
  BarChart3,
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Eye,
  Calendar,
  MessageSquare,
  Activity,
  Globe,
  MonitorSmartphone,
  Chrome,
  ExternalLink,
  FileBarChart,
} from "lucide-react";

interface StatCard {
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: React.ElementType;
  color: string;
}

interface AdminStats {
  totalProperties: number;
  activeAgents: number;
  totalInquiries: number;
  totalTours: number;
}

type RecentActivity = {
  type: "property" | "agent" | "user" | "inquiry" | "report";
  title: string;
  sub: string;
  time: string;
  dot: string;
  timestamp: number;
};

type CountryVisit = { country: string; visitors: number; pageviews: number };
type PageVisit = { route: string; visitors: number; pageviews: number };
type ReferrerVisit = {
  referrerHostname: string;
  visitors: number;
  pageviews: number;
};
type DeviceVisit = { deviceType: string; visitors: number; pageviews: number };
type BrowserVisit = {
  browserName: string;
  visitors: number;
  pageviews: number;
};

type SiteAnalytics = {
  totals: { visitors: number; pageviews: number } | null;
  countries: CountryVisit[];
  pages: PageVisit[];
  referrers: ReferrerVisit[];
  devices: DeviceVisit[];
  browsers: BrowserVisit[];
};

const EMPTY_ANALYTICS: SiteAnalytics = {
  totals: null,
  countries: [],
  pages: [],
  referrers: [],
  devices: [],
  browsers: [],
};

const STAT_CARDS: Omit<StatCard, "value" | "change" | "up">[] = [
  {
    label: "Total Properties",
    icon: Home,
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    label: "Active Agents",
    icon: Users,
    color: "bg-emerald-500/10 text-emerald-500",
  },
  {
    label: "Total Inquiries",
    icon: FileText,
    color: "bg-orange-500/10 text-orange-500",
  },
  {
    label: "Total Tours",
    icon: Calendar,
    color: "bg-violet-500/10 text-violet-500",
  },
];

const QUICK_LINKS = [
  {
    label: "Properties",
    sub: "Manage listings",
    href: "/admin/properties",
    icon: Home,
    color: "from-blue-600 to-blue-700",
  },
  {
    label: "Agents",
    sub: "Verify & manage agents",
    href: "/admin/agents",
    icon: Users,
    color: "from-emerald-600 to-emerald-700",
  },
  {
    label: "Inquiries",
    sub: "Buyer messages",
    href: "/admin/inquiries",
    icon: MessageSquare,
    color: "from-pink-600 to-pink-700",
  },
  {
    label: "Tours",
    sub: "Scheduled viewings",
    href: "/admin/tours",
    icon: Calendar,
    color: "from-teal-600 to-teal-700",
  },
];

const RECENT_ACTIVITY = [
  {
    type: "property",
    title: "New property submitted",
    sub: "Modern Downtown Penthouse — pending approval",
    time: "2 hours ago",
    dot: "bg-blue-500",
  },
  {
    type: "agent",
    title: "New agent registration",
    sub: "Juan Dela Cruz — PRC license verified",
    time: "5 hours ago",
    dot: "bg-emerald-500",
  },
  {
    type: "report",
    title: "User reported a property",
    sub: "Flagged for inappropriate listing details",
    time: "1 day ago",
    dot: "bg-red-500",
  },
  {
    type: "inquiry",
    title: "New inquiry received",
    sub: "3BR Condo BGC — from buyer@email.com",
    time: "2 days ago",
    dot: "bg-purple-500",
  },
];

const COUNTRY_NAMES: Record<string, string> = {
  PH: "Philippines",
  US: "United States",
  CY: "Cyprus",
  IE: "Ireland",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  SG: "Singapore",
  JP: "Japan",
  AE: "UAE",
};
const countryLabel = (code: string) => COUNTRY_NAMES[code] ?? code;

const parseJsonResponse = async (res: Response, source: string) => {
  if (!res.ok) {
    const text = await res.text();
    console.error(
      `Dashboard: ${source} status ${res.status} ${res.statusText}`,
      text,
    );
    return { total: 0, data: [] };
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    console.error(
      `Dashboard: ${source} unexpected content-type ${contentType}`,
      text,
    );
    return { total: 0, data: [] };
  }
  try {
    return await res.json();
  } catch (err) {
    const text = await res.text();
    console.error(`Dashboard: ${source} invalid JSON`, err, text);
    return { total: 0, data: [] };
  }
};

// Small horizontal bar-list panel used across the analytics section
function BarListPanel({
  title,
  icon: Icon,
  rows,
  labelKey,
  emptyLabel = "(direct / unknown)",
}: {
  title: string;
  icon: React.ElementType;
  rows: { label: string; visitors: number; pageviews: number }[];
  labelKey?: never;
  emptyLabel?: string;
}) {
  const max = rows.length > 0 ? Math.max(...rows.map((r) => r.visitors)) : 0;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-slate-400" />
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">No data yet.</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => {
            const pct = max > 0 ? (r.visitors / max) * 100 : 0;
            const label = r.label.trim() === "" ? emptyLabel : r.label;
            return (
              <div key={label} className="flex items-center gap-3">
                <span
                  className="text-xs text-slate-600 font-medium truncate flex-shrink-0"
                  style={{ width: "38%" }}
                  title={label}
                >
                  {label}
                </span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-20 text-right flex-shrink-0">
                  {r.visitors} visitors
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteAnalytics, setSiteAnalytics] =
    useState<SiteAnalytics>(EMPTY_ANALYTICS);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const formatRelative = (iso: string | Date | undefined): string => {
    if (!iso) return "Just now";
    const then = new Date(iso);
    const now = new Date();
    const diff = Math.max(0, now.getTime() - then.getTime());
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [propRes, agentRes, inquiryRes, tourRes] = await Promise.all([
          fetch("/api/admin/properties?per_page=5"),
          fetch("/api/admin/agents?per_page=5"),
          fetch("/api/inquiries?per_page=5"),
          fetch("/api/admin/tours?per_page=5"),
        ]);
        const tourJson = await parseJsonResponse(tourRes, "tours");

        const [propJson, agentJson, inquiryJson] = await Promise.all([
          parseJsonResponse(propRes, "properties"),
          parseJsonResponse(agentRes, "agents"),
          parseJsonResponse(inquiryRes, "inquiries"),
        ]);

        setStats({
          totalProperties:
            propJson?.total ?? (Array.isArray(propJson) ? propJson.length : 0),
          activeAgents:
            agentJson?.total ??
            (Array.isArray(agentJson) ? agentJson.length : 0),
          totalInquiries:
            inquiryJson?.total ??
            (Array.isArray(inquiryJson) ? inquiryJson.length : 0),
          totalTours:
            tourJson?.total ?? (Array.isArray(tourJson) ? tourJson.length : 0),
        });

        const toTimestamp = (date: any): number => {
          if (!date) return 0;
          const d = new Date(date);
          return Number.isNaN(d.getTime()) ? 0 : d.getTime();
        };

        const propertyActivities = (propJson?.data ?? []).map((p: any) => ({
          type: "property" as const,
          title: "New property submitted",
          sub: p.title ?? "Unnamed property",
          time: formatRelative(p.created_at),
          dot: "bg-blue-500",
          timestamp: toTimestamp(p.created_at),
        }));

        const agentActivities = (agentJson?.data ?? []).map((a: any) => ({
          type: "agent" as const,
          title: "Agent updated",
          sub: a.name ?? "Agent",
          time: formatRelative(a.updated_at ?? a.created_at),
          dot: "bg-emerald-500",
          timestamp: toTimestamp(a.updated_at ?? a.created_at),
        }));

        const tourActivities = (tourJson?.data ?? []).map((t: any) => ({
          type: "report" as const,
          title: "Tour request",
          sub: `${t.property?.title ?? "Unknown property"} — ${t.status ?? "pending"}`,
          time: formatRelative(t.created_at ?? t.date ?? t.updated_at),
          dot: "bg-violet-500",
          timestamp: toTimestamp(t.created_at ?? t.date ?? t.updated_at),
        }));

        const inquiryActivities = (inquiryJson?.data ?? []).map((i: any) => ({
          type: "inquiry" as const,
          title: "New inquiry received",
          sub: `${i.property?.title ?? "Unknown property"} — from ${i.lead_email ?? i.lead_name ?? "unknown"}`,
          time: formatRelative(i.created_at),
          dot: "bg-orange-500",
          timestamp: toTimestamp(i.created_at),
        }));

        setRecentActivity(
          [
            ...propertyActivities,
            ...tourActivities,
            ...inquiryActivities,
            ...agentActivities,
          ]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 6),
        );
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Vercel Web Analytics — full breakdown
  useEffect(() => {
    const fetchSiteAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const res = await fetch("/api/admin/site-analytics");
        const data = await parseJsonResponse(res, "site-analytics");
        setSiteAnalytics({
          totals: data?.totals ?? null,
          countries: Array.isArray(data?.countries) ? data.countries : [],
          pages: Array.isArray(data?.pages) ? data.pages : [],
          referrers: Array.isArray(data?.referrers) ? data.referrers : [],
          devices: Array.isArray(data?.devices) ? data.devices : [],
          browsers: Array.isArray(data?.browsers) ? data.browsers : [],
        });
      } catch (err) {
        console.error("Failed to load site analytics", err);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchSiteAnalytics();
  }, []);

  const activeStatCards: StatCard[] = STAT_CARDS.map((base) => {
    let value = "—";
    let change = "0%";
    let up = true;

    if (stats) {
      if (base.label === "Total Properties")
        value = stats.totalProperties.toLocaleString();
      if (base.label === "Active Agents")
        value = stats.activeAgents.toLocaleString();
      if (base.label === "Total Inquiries")
        value = stats.totalInquiries.toLocaleString();
      if (base.label === "Total Tours")
        value = stats.totalTours.toLocaleString();
      change = "+0%";
      up = true;
    }

    return { ...base, value, change, up } as StatCard;
  });

  const activityItems =
    recentActivity.length > 0 ? recentActivity : RECENT_ACTIVITY;

  const countryRows = siteAnalytics.countries.map((c) => ({
    label: countryLabel(c.country),
    visitors: c.visitors,
    pageviews: c.pageviews,
  }));
  const pageRows = siteAnalytics.pages.map((p) => ({
    label: p.route,
    visitors: p.visitors,
    pageviews: p.pageviews,
  }));
  const referrerRows = siteAnalytics.referrers.map((r) => ({
    label: r.referrerHostname,
    visitors: r.visitors,
    pageviews: r.pageviews,
  }));
  const deviceRows = siteAnalytics.devices.map((d) => ({
    label: d.deviceType,
    visitors: d.visitors,
    pageviews: d.pageviews,
  }));
  const browserRows = siteAnalytics.browsers.map((b) => ({
    label: b.browserName,
    visitors: b.visitors,
    pageviews: b.pageviews,
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Dashboard
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Welcome back — here's what's happening today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {activeStatCards.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${s.up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}
                >
                  {s.up ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {s.change}
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800 mb-0.5">
                {s.value}
              </p>
              <p className="text-sm text-slate-400">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-700">Quick Access</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {QUICK_LINKS.map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.href}
                href={q.href}
                className="group bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 shadow-sm"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${q.color} flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-slate-700 font-bold text-sm">{q.label}</p>
                <p className="text-slate-400 text-xs mt-0.5 leading-tight">
                  {q.sub}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              Recent Activity
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Last 7 days
            </span>
          </div>
          <div className="space-y-4">
            {activityItems.map((a, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 ${i < activityItems.length - 1 ? "pb-4 border-b border-slate-50" : ""}`}
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.dot}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 font-semibold text-sm">
                    {a.title}
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5 truncate">
                    {a.sub}
                  </p>
                </div>
                <span className="text-xs text-slate-300 flex-shrink-0 font-medium">
                  {a.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Management shortcuts */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-700 flex items-center gap-2 mb-5">
            <Settings className="w-4 h-4 text-slate-400" />
            Management
          </h2>
          <div className="space-y-2">
            {[
              {
                label: "Add New Property",
                href: "/admin/properties",
                icon: Home,
                color: "text-blue-500",
              },
              {
                label: "Add New Agent",
                href: "/admin/agents",
                icon: Users,
                color: "text-emerald-500",
              },
              {
                label: "Site Settings",
                href: "/admin/settings",
                icon: Settings,
                color: "text-slate-500",
              },
            ].map(({ label, href, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                <span className="text-slate-600 text-sm font-medium flex-1">
                  {label}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Site Analytics (Vercel Web Analytics) ────────────────────────── */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            Site Analytics
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Last 7 days
          </span>
        </div>

        {/* Totals row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-blue-500" />
              <p className="text-sm text-slate-400">Visitors</p>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {analyticsLoading
                ? "—"
                : (siteAnalytics.totals?.visitors ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <FileBarChart className="w-4 h-4 text-violet-500" />
              <p className="text-sm text-slate-400">Page Views</p>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {analyticsLoading
                ? "—"
                : (siteAnalytics.totals?.pageviews ?? 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Breakdown panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <BarListPanel
            title="Top Pages"
            icon={FileText}
            rows={pageRows}
            emptyLabel="/"
          />
          <BarListPanel
            title="Visitors by Country"
            icon={Globe}
            rows={countryRows}
          />
          <BarListPanel
            title="Top Referrers"
            icon={ExternalLink}
            rows={referrerRows}
            emptyLabel="Direct / no referrer"
          />
          <BarListPanel
            title="Devices"
            icon={MonitorSmartphone}
            rows={deviceRows}
          />
          <BarListPanel title="Browsers" icon={Chrome} rows={browserRows} />
        </div>
      </div>
    </div>
  );
}
