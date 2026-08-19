'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/lib/store';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar, Phone, Mail, MapPin, Home, Video,
  ChevronLeft, ChevronRight, Loader2, RefreshCw, Search,
  Clock, CheckCircle2, XCircle, User, Inbox, MessageSquare,
} from 'lucide-react';

interface TourProperty {
  id: number;
  title: string;
  thumbnail: string | null;
  address: string;
  city: string;
}

interface Tour {
  id: number;
  property_id: number;
  agent_id: number;
  lead_name: string;
  lead_phone: string;
  lead_email: string | null;
  tour_type: 'in-person' | 'video';
  tour_date: string;
  tour_time: string;
  preferred_contact: 'sms' | 'viber' | 'email' | 'phone';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  property?: TourProperty;
}

interface PaginatedResponse {
  data: Tour[];
  current_page: number;
  last_page: number;
  total: number;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon:  <Clock className="w-3 h-3" />,
    pill:  'bg-amber-100 text-amber-700 border border-amber-200',
    dot:   'bg-amber-400',
    bar:   'bg-amber-400',
    activeTab: '#d97706',
  },
  confirmed: {
    label: 'Confirmed',
    icon:  <CheckCircle2 className="w-3 h-3" />,
    pill:  'bg-blue-100 text-blue-700 border border-blue-200',
    dot:   'bg-blue-500',
    bar:   'bg-blue-500',
    activeTab: '#1d4ed8',
  },
  completed: {
    label: 'Completed',
    icon:  <CheckCircle2 className="w-3 h-3" />,
    pill:  'bg-emerald-100 text-emerald-700 border border-emerald-200',
    dot:   'bg-emerald-500',
    bar:   'bg-emerald-500',
    activeTab: '#059669',
  },
  cancelled: {
    label: 'Cancelled',
    icon:  <XCircle className="w-3 h-3" />,
    pill:  'bg-slate-100 text-slate-500 border border-slate-200',
    dot:   'bg-slate-400',
    bar:   'bg-slate-300',
    activeTab: '#475569',
  },
} as const;

const IMG = process.env.NEXT_PUBLIC_API_IMG ?? '';

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

function formatTourDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatTourTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour  = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function TourCard({
  tour, onStatusChange, updating,
}: {
  tour: Tour;
  onStatusChange: (id: number, status: Tour['status']) => void;
  updating: boolean;
}) {
  const cfg       = STATUS_CONFIG[tour.status];
  const isPending = tour.status === 'pending';

  const nextStatuses = (
    [
      { value: 'pending'   as const, label: 'Pending'   },
      { value: 'confirmed' as const, label: 'Confirm'   },
      { value: 'completed' as const, label: 'Completed' },
      { value: 'cancelled' as const, label: 'Cancel'    },
    ] satisfies { value: Tour['status']; label: string }[]
  ).filter(s => s.value !== tour.status);

  return (
    <div
      style={{ background: '#fff', fontFamily: 'system-ui, sans-serif' }}
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isPending
          ? 'border-amber-200 shadow-[0_0_0_3px_rgba(251,191,36,0.1)] shadow-sm'
          : 'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
      }`}
    >
      <div className={`h-1 w-full ${cfg.bar}`} />
      <div className="p-5">
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-[52px] h-[52px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
            {tour.property?.thumbnail
              ? <img src={`${IMG}${tour.property.thumbnail}`} alt={tour.property.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Home className="w-5 h-5 text-slate-400" /></div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg.pill}`}>
                  {cfg.icon}{cfg.label}
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                  background: tour.tour_type === 'video' ? '#eff6ff' : '#f0fdf4',
                  color:      tour.tour_type === 'video' ? '#1d4ed8'  : '#15803d',
                  border:     `1px solid ${tour.tour_type === 'video' ? '#bfdbfe' : '#bbf7d0'}`,
                }}>
                  {tour.tour_type === 'video'
                    ? <><Video className="w-3 h-3" /> Video Tour</>
                    : <><Home  className="w-3 h-3" /> In-Person</>
                  }
                </span>
                {isPending && (
                  <span style={{ background: '#d97706', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99 }}
                    className="uppercase tracking-wider animate-pulse">
                    Needs Confirmation
                  </span>
                )}
              </div>
              <span style={{ color: '#94a3b8', fontSize: 12, flexShrink: 0 }}>{timeAgo(tour.created_at)}</span>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 2 }} className="truncate">
              {tour.property?.title ?? `Property #${tour.property_id}`}
            </p>
            {tour.property && (
              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }} className="flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {tour.property.address}, {tour.property.city}
              </p>
            )}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10, padding: '8px 14px', marginBottom: 10 }}>
              <Calendar className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#92400e', margin: 0 }}>{formatTourDate(tour.tour_date)}</p>
                <p style={{ fontSize: 12, color: '#b45309', margin: 0 }}>{formatTourTime(tour.tour_time)}</p>
              </div>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px' }}
              className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-2">
                <div style={{ background: '#e2e8f0', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User className="w-3.5 h-3.5 text-slate-600" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{tour.lead_name}</span>
              </div>
              <a href={`tel:${tour.lead_phone}`} style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }} className="hover:text-blue-600 transition-colors">
                <Phone className="w-3 h-3" />{tour.lead_phone}
              </a>
              {tour.lead_email && (
                <a href={`mailto:${tour.lead_email}`} style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }} className="hover:text-blue-600 transition-colors">
                  <Mail className="w-3 h-3 flex-shrink-0" />{tour.lead_email}
                </a>
              )}
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3, textTransform: 'capitalize' }}>
                <MessageSquare className="w-3 h-3" />Prefers {tour.preferred_contact}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '10px 16px' }} className="flex items-center gap-2 flex-wrap">
        <a href={`tel:${tour.lead_phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0', color: '#374151', textDecoration: 'none', transition: 'all 0.15s' }} className="hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50">
          <Phone className="w-3.5 h-3.5" /> Call
        </a>
        {tour.lead_email && (
          <a href={`mailto:${tour.lead_email}?subject=Re: Tour for ${tour.property?.title ?? 'property'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0', color: '#374151', textDecoration: 'none', transition: 'all 0.15s' }} className="hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50">
            <Mail className="w-3.5 h-3.5" /> Email
          </a>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 flex-wrap">
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginRight: 4 }}>Move to:</span>
          {nextStatuses.map(ns => {
            const nCfg = STATUS_CONFIG[ns.value];
            return (
              <button key={ns.value} disabled={updating} onClick={() => onStatusChange(tour.id, ns.value)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#374151', cursor: updating ? 'not-allowed' : 'pointer', opacity: updating ? 0.5 : 1, transition: 'all 0.15s' }}
                className="hover:border-slate-400 hover:bg-slate-50">
                {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className={`w-2 h-2 rounded-full ${nCfg.dot}`} />}
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
function AgentToursContent() {
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

  const fetchTours = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '15' });
      if (statusFilter) params.set('status', statusFilter);
      const res  = await fetch(`/api/tours?${params}`, { credentials: 'include' });
      const json = await res.json();
      setData(json);
    } catch { /* keep existing */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [page, statusFilter]);

  useEffect(() => {
    if (initialized && user) fetchTours();
  }, [initialized, user, fetchTours]);

  const handleStatusChange = async (id: number, status: Tour['status']) => {
    setUpdatingId(id);
    try {
      await fetch(`/api/tours/${id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setData(prev => prev
        ? { ...prev, data: prev.data.map(t => t.id === id ? { ...t, status } : t) }
        : prev
      );
    } catch { /* silently fail */ }
    finally { setUpdatingId(null); }
  };

  if (!initialized || !user) return null;

  const displayed = (data?.data ?? []).filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.lead_name.toLowerCase().includes(q) ||
      t.lead_phone.includes(q) ||
      (t.lead_email ?? '').toLowerCase().includes(q) ||
      (t.property?.title ?? '').toLowerCase().includes(q) ||
      (t.property?.city  ?? '').toLowerCase().includes(q)
    );
  });

  const totalPending = data?.data.filter(t => t.status === 'pending').length ?? 0;
  const tabCounts = (Object.keys(STATUS_CONFIG) as Tour['status'][]).reduce<Record<string, number>>(
    (acc, s) => ({ ...acc, [s]: data?.data.filter(t => t.status === s).length ?? 0 }),
    {}
  );

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>

        <div style={{ marginBottom: 28 }} className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0 }}>Tours</h1>
              {totalPending > 0 && (
                <span style={{ background: '#d97706', color: '#fff', fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 99 }} className="animate-pulse">
                  {totalPending} pending
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
              {loading ? 'Loading…' : `${data?.total ?? 0} total tour${(data?.total ?? 0) !== 1 ? 's' : ''} booked`}
            </p>
          </div>
          <button onClick={() => fetchTours(true)} disabled={refreshing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.15s' }}
            className="hover:border-slate-300 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 16, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', width: 16, height: 16 }} />
            <input type="text" placeholder="Search by name, phone, email, or property…" value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 42, paddingRight: 16, paddingTop: 11, paddingBottom: 11, borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, color: '#0f172a', outline: 'none', background: '#f8fafc', boxSizing: 'border-box', transition: 'border 0.15s' }}
              onFocus={e => (e.target.style.borderColor = '#f59e0b')}
              onBlur={e  => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => { setStatusFilter(''); setPage(1); }}
              style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: !statusFilter ? '#0f172a' : '#f1f5f9', color: !statusFilter ? '#fff' : '#64748b' }}>
              All {data ? `(${data.total})` : ''}
            </button>
            {(Object.entries(STATUS_CONFIG) as [Tour['status'], typeof STATUS_CONFIG[Tour['status']]][]).map(([key, cfg]) => (
              <button key={key} onClick={() => { setStatusFilter(key); setPage(1); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: statusFilter === key ? cfg.activeTab : '#f1f5f9',
                  color: statusFilter === key ? '#fff' : '#64748b',
                }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusFilter === key ? '#fff' : (key === 'pending' ? '#f59e0b' : key === 'confirmed' ? '#3b82f6' : key === 'completed' ? '#10b981' : '#94a3b8'), flexShrink: 0 }} />
                {cfg.label} ({tabCounts[key] ?? 0})
              </button>
            ))}
            {(search || statusFilter) && (
              <button onClick={() => { setSearch(''); setStatusFilter(''); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', marginLeft: 'auto' }}>
                <XCircle className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
            </div>
            <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Loading tours…</p>
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <Inbox className="w-7 h-7 text-slate-400" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                {search ? 'No results found' : statusFilter ? `No ${STATUS_CONFIG[statusFilter as Tour['status']].label.toLowerCase()} tours` : 'No tours yet'}
              </p>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>
                {search ? 'Try a different search term' : 'Tour bookings from buyers will appear here'}
              </p>
            </div>
            {(search || statusFilter) && (
              <button onClick={() => { setSearch(''); setStatusFilter(''); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer' }}>
                <XCircle className="w-4 h-4" /> Clear filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayed.map(tour => (
              <TourCard key={tour.id} tour={tour} onStatusChange={handleStatusChange} updating={updatingId === tour.id} />
            ))}
          </div>
        )}

        {data && data.last_page > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: 13, color: '#64748b' }}>
              Page <strong style={{ color: '#0f172a' }}>{data.current_page}</strong> of <strong style={{ color: '#0f172a' }}>{data.last_page}</strong>
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button onClick={() => setPage(p => Math.min(data.last_page, p + 1))} disabled={page === data.last_page}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: page === data.last_page ? 'not-allowed' : 'pointer', opacity: page === data.last_page ? 0.4 : 1, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page export — wraps in Suspense ───────────────────────────────────────────
export default function AgentToursPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
        <Loader2 style={{ width: 32, height: 32, color: '#f59e0b' }} className="animate-spin" />
      </div>
    }>
      <AgentToursContent />
    </Suspense>
  );
}