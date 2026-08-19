"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Building2,
  MapPin,
  Bed,
  Bath,
  Ruler,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  XCircle,
  TriangleAlert,
} from "lucide-react";

interface Property {
  id: number;
  title: string;
  listing_type: "sale" | "rent";
  property_type: string;
  status: "active" | "sold" | "rented" | "inactive";
  price: number | null;
  price_per_month: number | null;
  address: string;
  city: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: string | null;
  thumbnail: string | null;
  created_at: string;
}

interface PaginatedResponse {
  data: Property[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const STATUS_CONFIG = {
  active: {
    label: "Active",
    dot: "bg-emerald-400",
    text: "text-emerald-400",
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
  },
  sold: {
    label: "Sold",
    dot: "bg-blue-400",
    text: "text-blue-400",
    border: "border-blue-500/40",
    bg: "bg-blue-500/10",
  },
  rented: {
    label: "Rented",
    dot: "bg-violet-400",
    text: "text-violet-400",
    border: "border-violet-500/40",
    bg: "bg-violet-500/10",
  },
  inactive: {
    label: "Inactive",
    dot: "bg-white/30",
    text: "text-white/40",
    border: "border-white/10",
    bg: "bg-white/5",
  },
} as const;

function formatPrice(p: Property): string {
  if (p.listing_type === "rent")
    return p.price_per_month
      ? `₱${Number(p.price_per_month).toLocaleString("en-PH")}/mo`
      : "—";
  return p.price ? `₱${Number(p.price).toLocaleString("en-PH")}` : "—";
}

function ConfirmDialog({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150]"
        onClick={onCancel}
      />
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
              <TriangleAlert className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-white font-bold text-base mb-1">
                Delete Listing
              </p>
              <p className="text-white/50 text-sm leading-relaxed">
                This will permanently remove the property and all its images.
                This cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/60 hover:text-white hover:border-white/30 text-sm font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function PropertyCard({
  property,
  onDelete,
  deleting,
}: {
  property: Property;
  onDelete: (id: number) => void;
  deleting: boolean;
}) {
  const cfg = STATUS_CONFIG[property.status];
  const isForRent = property.listing_type === "rent";

  return (
    <div className="group glass rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-black/20">
      <div className="flex">
        <div className="relative flex-shrink-0 w-36 sm:w-44">
          {property.thumbnail ? (
            <img
              src={property.thumbnail}
              alt={property.title}
              className="w-full h-full object-cover"
              style={{ minHeight: 140 }}
            />
          ) : (
            <div
              className="w-full flex items-center justify-center bg-white/5"
              style={{ minHeight: 140 }}
            >
              <Home className="w-8 h-8 text-white/20" />
            </div>
          )}
          <div
            className={`absolute top-3 left-3 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
              isForRent
                ? "bg-violet-600/90 text-white"
                : "bg-red-600/90 text-white"
            }`}
          >
            {isForRent ? "For Rent" : "For Sale"}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 group-hover:to-black/10 transition-all" />
        </div>

        <div className="flex-1 p-5 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
                <span className="text-[11px] font-semibold text-white/40 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full capitalize">
                  {property.property_type}
                </span>
              </div>
              <h3 className="text-white font-bold text-base truncate leading-tight">
                {property.title}
              </h3>
              <p className="text-white/40 text-xs mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {property.address}, {property.city}
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-red-400 font-black text-lg leading-tight">
                {formatPrice(property)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-4">
            {property.bedrooms != null && (
              <span className="inline-flex items-center gap-1.5 text-xs text-white/50 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <Bed className="w-3 h-3" />
                {property.bedrooms} bed
              </span>
            )}
            {property.bathrooms != null && (
              <span className="inline-flex items-center gap-1.5 text-xs text-white/50 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <Bath className="w-3 h-3" />
                {property.bathrooms} bath
              </span>
            )}
            {property.area && (
              <span className="inline-flex items-center gap-1.5 text-xs text-white/50 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <Ruler className="w-3 h-3" />
                {property.area}
              </span>
            )}
            <span className="text-[11px] text-white/25 ml-auto">
              {new Date(property.created_at).toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/properties/${property.id}`}>
              <button className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/25 hover:bg-white/10 transition-all">
                <Eye className="w-3.5 h-3.5" /> View
              </button>
            </Link>
            {/* <Link href={`/agent/dashboard/listings/${property.id}/edit`}>
              <button className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-blue-400 hover:border-blue-500/40 hover:bg-blue-500/10 transition-all">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            </Link> */}
            <button
              onClick={() => onDelete(property.id)}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentListingsPage() {
  const { user, initialized } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => {
    if (initialized && !user) router.push("/login");
  }, [user, initialized, router]);

  const fetchListings = useCallback(
    async (showRefresh = false) => {
      if (!user) return;
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          per_page: "10",
        });
        // ✅ Filter by current agent's ID
        params.set("agent_id", String(user.id));
        if (search) params.set("search", search);
        if (statusFilter) params.set("status", statusFilter);
        if (typeFilter) params.set("property_type", typeFilter);

        const res = await fetch(`/api/properties?${params}`, {
          credentials: "include",
        });
        const json = await res.json();
        setData(json);
      } catch {
        /* keep existing */
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search, statusFilter, typeFilter, user],
  );

  useEffect(() => {
    if (initialized && user) fetchListings();
  }, [initialized, user, fetchListings]);

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
      /* silently fail */
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  if (!initialized || !user) return null;

  const propertyTypes = [
    "house",
    "condo",
    "townhouse",
    "lot",
    "commercial",
    "warehouse",
  ];
  const tabCounts = (Object.keys(STATUS_CONFIG) as Property["status"][]).reduce<
    Record<string, number>
  >(
    (acc, s) => ({
      ...acc,
      [s]: data?.data.filter((p) => p.status === s).length ?? 0,
    }),
    {},
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/30 rounded-full px-3 py-1 mb-3">
            <Building2 className="w-3.5 h-3.5 text-red-400" />
            <span className="text-red-300 text-xs font-semibold tracking-widest uppercase">
              My Properties
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            My Listings
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {loading
              ? "Loading…"
              : `${data?.total ?? 0} propert${(data?.total ?? 0) !== 1 ? "ies" : "y"} listed`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchListings(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/20 text-sm font-semibold transition-all"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />{" "}
            Refresh
          </button>
          <Link href="/list-property">
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-sm font-bold transition-all shadow-lg shadow-red-600/30 hover:scale-105">
              <Plus className="w-4 h-4" /> Add Listing
            </button>
          </Link>
        </div>
      </div>

      <div className="glass rounded-2xl border border-white/10 p-5 mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search by title, address, or city…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 text-sm focus:outline-none focus:border-red-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <button
            onClick={() => {
              setStatusFilter("");
              setPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              !statusFilter
                ? "bg-white/10 border-white/20 text-white"
                : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
            }`}
          >
            All {data ? `(${data.total})` : ""}
          </button>
          {(
            Object.entries(STATUS_CONFIG) as [
              Property["status"],
              (typeof STATUS_CONFIG)[Property["status"]],
            ][]
          ).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => {
                setStatusFilter(key);
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                statusFilter === key
                  ? `${cfg.bg} ${cfg.border} ${cfg.text}`
                  : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label} ({tabCounts[key] ?? 0})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-white/25 uppercase tracking-widest">
            Type:
          </span>
          <button
            onClick={() => {
              setTypeFilter("");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              !typeFilter
                ? "bg-white/10 border-white/20 text-white"
                : "border-white/10 text-white/40 hover:text-white/60"
            }`}
          >
            All
          </button>
          {propertyTypes.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTypeFilter(t);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border ${
                typeFilter === t
                  ? "bg-red-600/20 border-red-500/40 text-red-400"
                  : "border-white/10 text-white/40 hover:text-white/60 hover:border-white/20"
              }`}
            >
              {t}
            </button>
          ))}
          {(search || statusFilter || typeFilter) && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setTypeFilter("");
                setPage(1);
              }}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-all"
            >
              <XCircle className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-2xl glass border border-white/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
          </div>
          <p className="text-white/30 text-sm font-medium">Loading listings…</p>
        </div>
      ) : (data?.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-3xl glass border border-white/10 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-white/20" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-base mb-1">
              {search || statusFilter || typeFilter
                ? "No listings match your filters"
                : "No listings yet"}
            </p>
            <p className="text-white/40 text-sm">
              {search || statusFilter || typeFilter
                ? "Try adjusting your search or filters"
                : "Add your first property to get started"}
            </p>
          </div>
          {search || statusFilter || typeFilter ? (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setTypeFilter("");
              }}
              className="inline-flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300 transition-colors"
            >
              <XCircle className="w-4 h-4" /> Clear filters
            </button>
          ) : (
            <Link href="/list-property">
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm transition-all shadow-lg shadow-red-600/30 hover:scale-105">
                <Plus className="w-4 h-4" /> Add Your First Listing
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {(data?.data ?? []).map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onDelete={(id) => setConfirmId(id)}
              deleting={deletingId === property.id}
            />
          ))}
        </div>
      )}

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/10">
          <p className="text-white/30 text-sm">
            Showing{" "}
            <span className="text-white font-semibold">
              {(page - 1) * data.per_page + 1}–
              {Math.min(page * data.per_page, data.total)}
            </span>{" "}
            of <span className="text-white font-semibold">{data.total}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white hover:border-white/20 text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            {Array.from({ length: data.last_page }, (_, i) => i + 1)
              .filter((n) => Math.abs(n - page) <= 2)
              .map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-10 h-10 rounded-xl border text-sm font-bold transition-all ${
                    n === page
                      ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30"
                      : "border-white/10 bg-white/5 text-white/50 hover:text-white hover:border-white/20"
                  }`}
                >
                  {n}
                </button>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(data.last_page, p + 1))}
              disabled={page === data.last_page}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white hover:border-white/20 text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {confirmId !== null && (
        <ConfirmDialog
          loading={deletingId === confirmId}
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
