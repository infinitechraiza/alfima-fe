// app/admin/analytics/page.tsx

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Building2,
  MessageSquare,
  Calendar,
  Star,
  Users,
  RefreshCw,
  TrendingUp,
  Home,
  Briefcase,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// ─── API base ───────────────────────────────────────────────────────────────
// Adjust these two paths to wherever your Next.js API layer proxies through
// to Laravel's AnalyticsController (App\Http\Controllers\Api\External).
const SUMMARY_API = "/api/admin/analytics/summary";
const TRENDS_API = "/api/admin/analytics/trends";

// ─── Types (mirrors AnalyticsController's JSON shape) ────────────────────────
interface StatusBreakdown {
  total: number;
  by_status: Record<string, number>;
}

interface PropertiesBreakdown {
  total: number;
  agent_total: number;
  developer_total: number;
  by_status: Record<string, number>;
}

interface InquiriesBreakdown {
  total: number;
  agent_inquiries: { total: number; by_status: Record<string, number> };
  developer_inquiries: { total: number };
}

interface SummaryData {
  properties: PropertiesBreakdown;
  inquiries: InquiriesBreakdown;
  viewing_requests: StatusBreakdown;
  tours: StatusBreakdown;
  agent_reviews: StatusBreakdown;
}

interface TrendPoint {
  date: string;
  count: number;
}

interface TrendsData {
  inquiries: TrendPoint[];
  developer_inquiries: TrendPoint[];
  tours: TrendPoint[];
  viewing_requests: TrendPoint[];
}

// ─── Style tokens (matches the Inquiries admin page) ─────────────────────────
const ACCENT = "#c0392b";
const BORDER = "#e2e8f0";
const MUTED = "#64748b";
const INK = "#1e293b";

// Fixed colors for statuses we know about; anything else falls back to the
// cycling palette below (backend groups by whatever status strings exist,
// so we can't assume a fixed enum).
const KNOWN_STATUS_COLORS: Record<string, string> = {
  new: "#3b82f6",
  pending: "#3b82f6",
  available: "#3b82f6",
  active: "#3b82f6",
  contacted: "#eab308",
  in_progress: "#eab308",
  confirmed: "#22c55e",
  accepted: "#22c55e",
  closed: "#22c55e",
  sold: "#22c55e",
  rented: "#22c55e",
  approved: "#22c55e",
  cancelled: "#ef4444",
  rejected: "#ef4444",
  declined: "#ef4444",
  archived: "#64748b",
  inactive: "#64748b",
};
const FALLBACK_PALETTE = [
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
];

function colorForStatus(status: string, indexInList: number): string {
  return (
    KNOWN_STATUS_COLORS[status.toLowerCase()] ??
    FALLBACK_PALETTE[indexInList % FALLBACK_PALETTE.length]
  );
}

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-PH");
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

// ─── Status breakdown mini bar ────────────────────────────────────────────────
function StatusMiniBar({ byStatus }: { byStatus: Record<string, number> }) {
  const entries = Object.entries(byStatus).filter(([, v]) => v > 0);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  if (total === 0) {
    return (
      <p style={{ fontSize: 12, color: "#94a3b8", margin: "8px 0 0" }}>
        No data yet
      </p>
    );
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div
        style={{
          display: "flex",
          height: 6,
          borderRadius: 4,
          overflow: "hidden",
          background: "#f1f5f9",
        }}
      >
        {entries.map(([status, count], i) => (
          <div
            key={status}
            title={`${formatStatusLabel(status)}: ${count}`}
            style={{
              width: `${(count / total) * 100}%`,
              background: colorForStatus(status, i),
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 10px",
          marginTop: 8,
        }}
      >
        {entries.map(([status, count], i) => (
          <span
            key={status}
            style={{
              fontSize: 11,
              color: MUTED,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: colorForStatus(status, i),
                flexShrink: 0,
              }}
            />
            {formatStatusLabel(status)}{" "}
            <strong style={{ color: INK }}>{count}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({
  icon,
  label,
  total,
  tint,
  byStatus,
  split,
}: {
  icon: React.ReactNode;
  label: string;
  total: number;
  tint: string;
  byStatus?: Record<string, number>;
  split?: { label: string; value: number }[];
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1.5px solid ${BORDER}`,
        borderRadius: 14,
        padding: "18px 20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: tint,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
      </div>
      <p
        style={{ fontSize: 26, fontWeight: 800, color: INK, margin: "0 0 2px" }}
      >
        {formatNumber(total)}
      </p>
      <p style={{ fontSize: 13, color: MUTED, margin: 0, fontWeight: 600 }}>
        {label}
      </p>

      {split && (
        <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
          {split.map((s) => (
            <span key={s.label} style={{ fontSize: 12, color: MUTED }}>
              {s.label}{" "}
              <strong style={{ color: INK }}>{formatNumber(s.value)}</strong>
            </span>
          ))}
        </div>
      )}

      {byStatus && <StatusMiniBar byStatus={byStatus} />}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [loading, setLoading] = useState(true);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(SUMMARY_API);
      if (!res.ok) throw new Error(`Summary request failed (${res.status})`);
      const json = await res.json();
      setSummary(json.data ?? json);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError("Could not load analytics summary.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTrends = useCallback(async (rangeDays: number) => {
    setTrendsLoading(true);
    try {
      const res = await fetch(`${TRENDS_API}?days=${rangeDays}`);
      if (!res.ok) throw new Error(`Trends request failed (${res.status})`);
      const json = await res.json();
      setTrends(json.data ?? json);
    } catch (err) {
      console.error(err);
    } finally {
      setTrendsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);
  useEffect(() => {
    loadTrends(days);
  }, [days, loadTrends]);

  const refreshAll = () => {
    loadSummary();
    loadTrends(days);
  };

  // Merge the four trend series into one array keyed by date, for a single chart.
  const chartData = useMemo(() => {
    if (!trends) return [];
    const byDate = new Map<string, Record<string, number | string>>();

    const merge = (series: TrendPoint[] | undefined, key: string) => {
      (series ?? []).forEach(({ date, count }) => {
        const row = byDate.get(date) ?? { date };
        row[key] = count;
        byDate.set(date, row);
      });
    };

    merge(trends.inquiries, "inquiries");
    merge(trends.developer_inquiries, "developer_inquiries");
    merge(trends.tours, "tours");
    merge(trends.viewing_requests, "viewing_requests");

    return Array.from(byDate.values())
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .map((row) => ({
        ...row,
        dateLabel: formatDateShort(String(row.date)),
        inquiries: Number(row.inquiries ?? 0),
        developer_inquiries: Number(row.developer_inquiries ?? 0),
        tours: Number(row.tours ?? 0),
        viewing_requests: Number(row.viewing_requests ?? 0),
      }));
  }, [trends]);

  const totalLeads = summary
    ? summary.inquiries.total +
      summary.viewing_requests.total +
      summary.tours.total
    : 0;

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        maxWidth: 1280,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: INK,
              margin: "0 0 4px",
            }}
          >
            Analytics
          </h1>
          <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}`
              : "Platform-wide performance overview"}
          </p>
        </div>
        <button
          onClick={refreshAll}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#f1f5f9",
            border: `1.5px solid ${BORDER}`,
            borderRadius: 10,
            padding: "8px 14px",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            color: "#475569",
          }}
        >
          <RefreshCw
            size={14}
            className={loading || trendsLoading ? "spin" : ""}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1.5px solid #fecaca",
            color: "#b91c1c",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* Hero: total leads */}
      <div
        style={{
          background: `linear-gradient(135deg, ${ACCENT} 0%, #7f1d1d 100%)`,
          borderRadius: 16,
          padding: "22px 26px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: "rgba(255,255,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <TrendingUp size={22} color="#fff" />
        </div>
        <div>
          <p
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: "#fff",
              margin: "0 0 2px",
            }}
          >
            {loading ? "—" : formatNumber(totalLeads)}
          </p>
          <p
            style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: 0 }}
          >
            Total leads across inquiries, viewing requests & tours
          </p>
        </div>
      </div>

      {/* Metric cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        {loading || !summary ? (
          [...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{ height: 140, background: "#f1f5f9", borderRadius: 14 }}
            />
          ))
        ) : (
          <>
            <MetricCard
              icon={<Building2 size={17} color="#fff" />}
              label="Properties"
              total={summary.properties.total}
              tint={ACCENT}
              split={[
                { label: "Agent", value: summary.properties.agent_total },
                {
                  label: "Developer",
                  value: summary.properties.developer_total,
                },
              ]}
              byStatus={summary.properties.by_status}
            />
            <MetricCard
              icon={<MessageSquare size={17} color="#fff" />}
              label="Inquiries"
              total={summary.inquiries.total}
              tint="#1d4ed8"
              split={[
                {
                  label: "Agent",
                  value: summary.inquiries.agent_inquiries.total,
                },
                {
                  label: "Developer",
                  value: summary.inquiries.developer_inquiries.total,
                },
              ]}
              byStatus={summary.inquiries.agent_inquiries.by_status}
            />
            <MetricCard
              icon={<Calendar size={17} color="#fff" />}
              label="Viewing Requests"
              total={summary.viewing_requests.total}
              tint="#15803d"
              byStatus={summary.viewing_requests.by_status}
            />
            <MetricCard
              icon={<Briefcase size={17} color="#fff" />}
              label="Tours"
              total={summary.tours.total}
              tint="#7c3aed"
              byStatus={summary.tours.by_status}
            />
            <MetricCard
              icon={<Star size={17} color="#fff" />}
              label="Agent Reviews"
              total={summary.agent_reviews.total}
              tint="#eab308"
              byStatus={summary.agent_reviews.by_status}
            />
          </>
        )}
      </div>

      {/* Trends chart */}
      <div
        style={{
          background: "#fff",
          border: `1.5px solid ${BORDER}`,
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: INK,
                margin: "0 0 2px",
              }}
            >
              Activity trends
            </h2>
            <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>
              Daily volume across lead types
            </p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d as 7 | 30 | 90)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border:
                    days === d
                      ? `2px solid ${ACCENT}`
                      : `1.5px solid ${BORDER}`,
                  background: days === d ? "#fff1f0" : "#fff",
                  color: days === d ? ACCENT : MUTED,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 300 }}>
          {trendsLoading ? (
            <div
              style={{
                height: "100%",
                background: "#f8fafc",
                borderRadius: 10,
              }}
            />
          ) : chartData.length === 0 ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              No activity in this range
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gInq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1d4ed8" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDevInq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gTours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gViewing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#15803d" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#15803d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11, fill: MUTED }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: MUTED }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: `1px solid ${BORDER}`,
                    fontSize: 12,
                  }}
                  labelStyle={{ fontWeight: 700, color: INK }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                <Area
                  type="monotone"
                  dataKey="inquiries"
                  name="Inquiries"
                  stroke="#1d4ed8"
                  fill="url(#gInq)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="developer_inquiries"
                  name="Developer Inquiries"
                  stroke={ACCENT}
                  fill="url(#gDevInq)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="tours"
                  name="Tours"
                  stroke="#7c3aed"
                  fill="url(#gTours)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="viewing_requests"
                  name="Viewing Requests"
                  stroke="#15803d"
                  fill="url(#gViewing)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <style>{`
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
