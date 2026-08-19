'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/lib/store';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MessageSquare, Phone, Mail, Calendar, MapPin, Home,
  ChevronLeft, ChevronRight, Loader2, RefreshCw, Search,
  Clock, CheckCircle2, Eye, XCircle, SlidersHorizontal,
  User, Inbox,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface InquiryProperty {
  id: number;
  title: string;
  thumbnail: string | null;
  address: string;
  city: string;
}

interface Inquiry {
  id: number;
  property_id: number;
  agent_id: number;
  lead_name: string;
  lead_phone: string;
  lead_email: string | null;
  message: string | null;
  preferred_contact: 'sms' | 'viber' | 'email' | 'phone' | 'whatsapp';
  viewing_date: string | null;
  status: 'new' | 'contacted' | 'viewing_scheduled' | 'closed';
  created_at: string;
  property?: InquiryProperty;
}

interface PaginatedResponse {
  data: Inquiry[];
  current_page: number;
  last_page: number;
  total: number;
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  new: {
    label: 'New',
    icon:  <Clock className="w-3 h-3" />,
    text:  'text-blue-400',
    border:'border-blue-500/40',
    bg:    'bg-blue-500/10',
    dot:   'bg-blue-400',
    glow:  'shadow-blue-500/20',
  },
  contacted: {
    label: 'Contacted',
    icon:  <Phone className="w-3 h-3" />,
    text:  'text-amber-400',
    border:'border-amber-500/40',
    bg:    'bg-amber-500/10',
    dot:   'bg-amber-400',
    glow:  'shadow-amber-500/20',
  },
  viewing_scheduled: {
    label: 'Viewing Set',
    icon:  <Calendar className="w-3 h-3" />,
    text:  'text-violet-400',
    border:'border-violet-500/40',
    bg:    'bg-violet-500/10',
    dot:   'bg-violet-400',
    glow:  'shadow-violet-500/20',
  },
  closed: {
    label: 'Closed',
    icon:  <CheckCircle2 className="w-3 h-3" />,
    text:  'text-emerald-400',
    border:'border-emerald-500/40',
    bg:    'bg-emerald-500/10',
    dot:   'bg-emerald-400',
    glow:  'shadow-emerald-500/20',
  },
} as const;

function imgUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = (process.env.NEXT_PUBLIC_API_IMG ?? '').replace(/\/$/, '');
  const slug  = path.replace(/^\//, '');
  return `${base}/${slug}`;
}

const CONTACT_LABEL: Record<string, string> = {
  sms:      'SMS',
  viber:    'Viber',
  email:    'Email',
  phone:    'Call',
  whatsapp: 'WhatsApp',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Inquiry Card ──────────────────────────────────────────────────────────────
function InquiryCard({ inquiry, onStatusChange, updating }: {
  inquiry: Inquiry;
  onStatusChange: (id: number, status: Inquiry['status']) => void;
  updating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg   = STATUS_CONFIG[inquiry.status];
  const isNew = inquiry.status === 'new';

  const nextStatuses = (
    [
      { value: 'new'               as const, label: 'New'         },
      { value: 'contacted'         as const, label: 'Contacted'   },
      { value: 'viewing_scheduled' as const, label: 'Viewing Set' },
      { value: 'closed'            as const, label: 'Closed'      },
    ] satisfies { value: Inquiry['status']; label: string }[]
  ).filter(s => s.value !== inquiry.status);

  return (
    <div className={`glass rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-xl ${
      isNew
        ? 'border-blue-500/30 shadow-lg shadow-blue-500/10'
        : 'border-white/10 hover:border-white/20'
    }`}>
      <div className={`h-0.5 w-full ${cfg.dot}`} />
      <div className="p-5">
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-white/5 border border-white/10">
            {inquiry.property?.thumbnail
              ? <img src={imgUrl(inquiry.property.thumbnail)} alt={inquiry.property?.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center">
                  <Home className="w-5 h-5 text-white/20" />
                </div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                  {cfg.icon}{cfg.label}
                </span>
                {isNew && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 uppercase tracking-wider animate-pulse">
                    Unread
                  </span>
                )}
              </div>
              <span className="text-xs text-white/25 flex-shrink-0">{timeAgo(inquiry.created_at)}</span>
            </div>
            <p className="text-white font-bold text-sm truncate mb-0.5">
              {inquiry.property?.title ?? `Property #${inquiry.property_id}`}
            </p>
            {inquiry.property && (
              <p className="text-white/35 text-xs flex items-center gap-1 mb-3">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {inquiry.property.address}, {inquiry.property.city}
              </p>
            )}
            <div className="bg-white/5 border border-white/8 rounded-xl p-3 mb-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 text-white/50" />
                  </div>
                  <span className="text-sm font-bold text-white">{inquiry.lead_name}</span>
                </div>
                <a href={`tel:${inquiry.lead_phone}`}
                  className="flex items-center gap-1.5 text-xs text-white/50 hover:text-emerald-400 transition-colors">
                  <Phone className="w-3 h-3" />{inquiry.lead_phone}
                </a>
                {inquiry.lead_email && (
                  <a href={`mailto:${inquiry.lead_email}`}
                    className="flex items-center gap-1.5 text-xs text-white/50 hover:text-blue-400 transition-colors truncate max-w-[180px]">
                    <Mail className="w-3 h-3 flex-shrink-0" />{inquiry.lead_email}
                  </a>
                )}
                <span className="flex items-center gap-1 text-[11px] text-white/30 ml-auto">
                  <MessageSquare className="w-3 h-3" />
                  Prefers {CONTACT_LABEL[inquiry.preferred_contact] ?? inquiry.preferred_contact}
                </span>
              </div>
            </div>
            {inquiry.viewing_date && (
              <div className="mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/30 px-3 py-1.5 rounded-full">
                  <Calendar className="w-3.5 h-3.5" />
                  Viewing requested: {new Date(inquiry.viewing_date).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
            {inquiry.message && (
              <div>
                <p className={`text-xs text-white/40 italic leading-relaxed ${expanded ? '' : 'line-clamp-1'}`}>
                  "{inquiry.message}"
                </p>
                <button
                  onClick={() => setExpanded(p => !p)}
                  className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-white/30 hover:text-white/60 transition-colors">
                  <Eye className="w-3 h-3" />
                  {expanded ? 'Show less' : 'Read full message'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="px-5 py-3 bg-white/3 border-t border-white/8 flex items-center gap-2 flex-wrap">
        <a href={`tel:${inquiry.lead_phone}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all">
          <Phone className="w-3.5 h-3.5" /> Call
        </a>
        {inquiry.lead_email && (
          <a href={`mailto:${inquiry.lead_email}?subject=Re: ${inquiry.property?.title ?? 'Your inquiry'}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-blue-400 hover:border-blue-500/40 hover:bg-blue-500/10 transition-all">
            <Mail className="w-3.5 h-3.5" /> Email
          </a>
        )}
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-white/25 font-medium">Move to:</span>
          {nextStatuses.map(ns => {
            const nCfg = STATUS_CONFIG[ns.value];
            return (
              <button
                key={ns.value}
                disabled={updating}
                onClick={() => onStatusChange(inquiry.id, ns.value)}
                className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed border-white/10 bg-white/5 text-white/40 hover:${nCfg.bg} hover:${nCfg.border} hover:${nCfg.text}`}>
                {updating
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <span className={`w-2 h-2 rounded-full ${nCfg.dot}`} />
                }
                {ns.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Inner component (uses useSearchParams) ────────────────────────────────────
function AgentInquiriesContent() {
  const { user, initialized } = useAuth();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [data,         setData]         = useState<PaginatedResponse | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '');
  const [updatingId,   setUpdatingId]   = useState<number | null>(null);

  useEffect(() => {
    if (initialized && !user) router.push('/login');
  }, [user, initialized, router]);

  const fetchInquiries = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '15' });
      if (statusFilter) params.set('status', statusFilter);
      const res  = await fetch(`/api/inquiries?${params}`, { credentials: 'include' });
      const json = await res.json();
      setData(json);
    } catch { /* keep existing */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [page, statusFilter]);

  useEffect(() => {
    if (initialized && user) fetchInquiries();
  }, [initialized, user, fetchInquiries]);

  const handleStatusChange = async (id: number, status: Inquiry['status']) => {
    setUpdatingId(id);
    try {
      await fetch(`/api/inquiries/${id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setData(prev => prev
        ? { ...prev, data: prev.data.map(i => i.id === id ? { ...i, status } : i) }
        : prev
      );
    } catch { /* silently fail */ }
    finally { setUpdatingId(null); }
  };

  if (!initialized || !user) return null;

  const displayed = (data?.data ?? []).filter(i => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      i.lead_name.toLowerCase().includes(q) ||
      i.lead_phone.includes(q) ||
      (i.lead_email ?? '').toLowerCase().includes(q) ||
      (i.property?.title ?? '').toLowerCase().includes(q) ||
      (i.property?.city  ?? '').toLowerCase().includes(q)
    );
  });

  const totalNew = data?.data.filter(i => i.status === 'new').length ?? 0;
  const tabCounts = (Object.keys(STATUS_CONFIG) as Inquiry['status'][]).reduce<Record<string, number>>(
    (acc, s) => ({ ...acc, [s]: data?.data.filter(i => i.status === s).length ?? 0 }),
    {}
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/30 rounded-full px-3 py-1 mb-3">
            <MessageSquare className="w-3.5 h-3.5 text-red-400" />
            <span className="text-red-300 text-xs font-semibold tracking-widest uppercase">Buyer Inquiries</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-white tracking-tight">Inquiries</h1>
            {totalNew > 0 && (
              <span className="bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-black px-3 py-1 rounded-full animate-pulse">
                {totalNew} new
              </span>
            )}
          </div>
          <p className="text-white/40 text-sm mt-1">
            {loading ? 'Loading…' : `${data?.total ?? 0} total ${(data?.total ?? 0) === 1 ? 'inquiry' : 'inquiries'} from buyers`}
          </p>
        </div>
        <button
          onClick={() => fetchInquiries(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/20 text-sm font-semibold transition-all">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="glass rounded-2xl border border-white/10 p-5 mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search by name, phone, email, or property…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 text-sm focus:outline-none focus:border-red-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
          <button
            onClick={() => { setStatusFilter(''); setPage(1); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              !statusFilter
                ? 'bg-white/10 border-white/20 text-white'
                : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
            }`}>
            All {data ? `(${data.total})` : ''}
          </button>
          {(Object.entries(STATUS_CONFIG) as [Inquiry['status'], typeof STATUS_CONFIG[Inquiry['status']]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { setStatusFilter(key); setPage(1); }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                statusFilter === key
                  ? `${cfg.bg} ${cfg.border} ${cfg.text}`
                  : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label} ({tabCounts[key] ?? 0})
            </button>
          ))}
          {(search || statusFilter) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-all">
              <XCircle className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-2xl glass border border-white/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
          <p className="text-white/30 text-sm font-medium">Loading inquiries…</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-3xl glass border border-white/10 flex items-center justify-center">
            <Inbox className="w-7 h-7 text-white/20" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-base mb-1">
              {search ? 'No results found' : statusFilter ? `No ${STATUS_CONFIG[statusFilter as Inquiry['status']].label.toLowerCase()} inquiries` : 'No inquiries yet'}
            </p>
            <p className="text-white/40 text-sm">
              {search ? 'Try a different search term' : 'Buyer inquiries will appear here'}
            </p>
          </div>
          {(search || statusFilter) && (
            <button onClick={() => { setSearch(''); setStatusFilter(''); }}
              className="inline-flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300 transition-colors">
              <XCircle className="w-4 h-4" /> Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(inquiry => (
            <InquiryCard
              key={inquiry.id}
              inquiry={inquiry}
              onStatusChange={handleStatusChange}
              updating={updatingId === inquiry.id}
            />
          ))}
        </div>
      )}

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/10">
          <p className="text-white/30 text-sm">
            Page <span className="text-white font-semibold">{data.current_page}</span> of <span className="text-white font-semibold">{data.last_page}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white hover:border-white/20 text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            {Array.from({ length: data.last_page }, (_, i) => i + 1)
              .filter(n => Math.abs(n - page) <= 2)
              .map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className={`w-10 h-10 rounded-xl border text-sm font-bold transition-all ${
                    n === page
                      ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30'
                      : 'border-white/10 bg-white/5 text-white/50 hover:text-white hover:border-white/20'
                  }`}>
                  {n}
                </button>
              ))}
            <button
              onClick={() => setPage(p => Math.min(data.last_page, p + 1))}
              disabled={page === data.last_page}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white hover:border-white/20 text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page export — wraps content in Suspense ───────────────────────────────────
export default function AgentInquiriesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
      </div>
    }>
      <AgentInquiriesContent />
    </Suspense>
  );
}