// app/admin/tours/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Phone, Mail, MapPin, Calendar, Clock,
  Search, X, Eye, Video, Home,
  Building2, User, RefreshCw,
} from 'lucide-react';

// ─── Image URL helper ─────────────────────────────────────────────────────────
const IMG_BASE = (process.env.NEXT_PUBLIC_API_IMG ?? 'http://localhost:8000').replace(/\/$/, '');
function imgUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith(IMG_BASE)) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${IMG_BASE}/${path.replace(/^\//, '')}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Tour {
  id: number;
  property_id: number;
  agent_id?: number | null;
  tour_type: 'in-person' | 'video';
  tour_date: string;
  tour_time: string;
  lead_name: string;
  lead_phone: string;
  lead_email?: string | null;
  preferred_contact: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  property?: {
    id: number;
    title: string;
    city?: string;
    address?: string;
    listing_type?: string;
    price?: number;
    price_per_month?: number;
  };
  agent?: {
    id: number;
    name: string;
    avatar?: string | null;
    phone?: string | null;
  };
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const API = '/api/admin/tours';

const STATUS_MAP = {
  pending:   { bg: '#fef9c3', color: '#854d0e', dot: '#eab308',  label: 'Pending'   },
  confirmed: { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6',  label: 'Confirmed' },
  completed: { bg: '#dcfce7', color: '#15803d', dot: '#22c55e',  label: 'Completed' },
  cancelled: { bg: '#fee2e2', color: '#b91c1c', dot: '#ef4444',  label: 'Cancelled' },
};

const CONTACT_ICONS: Record<string, string> = {
  sms: '💬', viber: '📲', email: '📧', phone: '📞', whatsapp: '💬',
};

function StatusBadge({ status }: { status: Tour['status'] }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700,
      padding: '3px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
      {s.label}
    </span>
  );
}

function TourTypeBadge({ type }: { type: Tour['tour_type'] }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
      background: type === 'video' ? '#eff6ff' : '#f0fdf4',
      color: type === 'video' ? '#1d4ed8' : '#15803d',
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      {type === 'video' ? <Video size={10} /> : <Home size={10} />}
      {type === 'video' ? 'Video' : 'In-Person'}
    </span>
  );
}

function formatTime(time: string): string {
  if (!time) return '—';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function gcalUrl(tour: Tour): string {
  if (!tour.tour_date || !tour.tour_time) return '#';

  try {
    const datePart = tour.tour_date.split('T')[0];
    const timePart = tour.tour_time.slice(0, 5);

    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute]     = timePart.split(':').map(Number);

    const start = new Date(year, month - 1, day, hour, minute, 0);
    const end   = new Date(start.getTime() + 60 * 60 * 1000);

    const pad = (n: number) => String(n).padStart(2, '0');
    const fmtLocal = (d: Date) =>
      `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

    return (
      `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(`Property Tour: ${tour.property?.title ?? ''}`)}` +
      `&dates=${fmtLocal(start)}/${fmtLocal(end)}` +
      `&location=${encodeURIComponent(tour.property?.address ?? '')}` +
      `&details=${encodeURIComponent(`Tour Type: ${tour.tour_type === 'video' ? 'Video Call' : 'On-site visit'}\nLead: ${tour.lead_name}\nPhone: ${tour.lead_phone}`)}`
    );
  } catch {
    return '#';
  }
}
// ─── Agent Avatar ─────────────────────────────────────────────────────────────
function AgentAvatar({ agent }: { agent: NonNullable<Tour['agent']> }) {
  const src = imgUrl(agent.avatar)
    ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&size=64&background=random`;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={agent.name} width={36} height={36}
    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />;
}

// ─── Detail drawer ────────────────────────────────────────────────────────────
function TourDrawer({
  tour, onClose, onStatusChange,
}: {
  tour: Tour;
  onClose: () => void;
  onStatusChange: (id: number, status: Tour['status']) => void;
}) {
  const tourDate = tour.tour_date
    ? new Date(tour.tour_date).toLocaleDateString('en-PH', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}
      onClick={onClose}>
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(3px)' }} />
      <div style={{ width: 420, background: '#fff', height: '100%', overflowY: 'auto',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>
              Tour #{tour.id}
            </p>
            <h3 style={{ color: '#fff', fontSize: 17, fontWeight: 700, margin: '0 0 4px' }}>
              {tour.lead_name}
            </h3>
            <TourTypeBadge type={tour.tour_type} />
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)',
            border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer',
            display: 'flex', alignItems: 'center' }}>
            <X size={16} color="#fff" />
          </button>
        </div>

        <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Status */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', margin: '0 0 8px',
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['pending', 'confirmed', 'completed', 'cancelled'] as const).map(s => {
                const m = STATUS_MAP[s];
                const active = tour.status === s;
                return (
                  <button key={s} onClick={() => onStatusChange(tour.id, s)} style={{
                    flex: 1, minWidth: 80, padding: '7px 4px', borderRadius: 10,
                    border: active ? `2px solid ${m.dot}` : '1.5px solid #e2e8f0',
                    background: active ? m.bg : '#fafafa', color: active ? m.color : '#64748b',
                    fontSize: 11, fontWeight: active ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tour schedule */}
          <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe',
            borderRadius: 12, padding: '16px' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#1d4ed8', margin: '0 0 12px',
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>Schedule</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar size={16} color="#1d4ed8" />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{tourDate}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={16} color="#1d4ed8" />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                  {formatTime(tour.tour_time)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {tour.tour_type === 'video'
                  ? <Video size={16} color="#1d4ed8" />
                  : <Home size={16} color="#1d4ed8" />}
                <span style={{ fontSize: 14, color: '#1e293b' }}>
                  {tour.tour_type === 'video' ? 'Video call (Viber / Messenger)' : 'On-site visit'}
                </span>
              </div>
            </div>
            <a href={gcalUrl(tour)} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 12,
                fontSize: 12, color: '#1d4ed8', fontWeight: 600, textDecoration: 'none',
                background: '#dbeafe', padding: '6px 12px', borderRadius: 8 }}>
              📅 Add to Google Calendar
            </a>
          </div>

          {/* Lead contact */}
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', margin: '0 0 12px',
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lead Contact</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1d4ed8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={15} color="#fff" />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{tour.lead_name}</span>
              </div>
              <a href={`tel:${tour.lead_phone}`}
                style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dcfce7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Phone size={14} color="#15803d" />
                </div>
                <span style={{ fontSize: 14, color: '#15803d', fontWeight: 500 }}>{tour.lead_phone}</span>
              </a>
              {tour.lead_email && (
                <a href={`mailto:${tour.lead_email}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dbeafe',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={14} color="#1d4ed8" />
                  </div>
                  <span style={{ fontSize: 14, color: '#1d4ed8', fontWeight: 500 }}>{tour.lead_email}</span>
                </a>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
                  {CONTACT_ICONS[tour.preferred_contact] ?? '💬'}
                </div>
                <span style={{ fontSize: 13, color: '#64748b' }}>
                  Confirm via: <strong style={{ color: '#1e293b' }}>{tour.preferred_contact.toUpperCase()}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Property */}
          {tour.property && (
            <div style={{ background: '#fff8f8', border: '1.5px solid #fde8e8', borderRadius: 12, padding: '16px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', margin: '0 0 10px',
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>Property</p>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 36, height: 36, background: '#fee2e2', borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Building2 size={17} color="#c0392b" />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 3px' }}>
                    {tour.property.title}
                  </p>
                  {tour.property.address && (
                    <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 2px',
                      display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={10} />{tour.property.address}
                      {tour.property.city ? `, ${tour.property.city}` : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Agent */}
          {tour.agent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10,
              background: '#fafafa', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px 16px' }}>
              <AgentAvatar agent={tour.agent} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 1px' }}>Assigned Agent</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>{tour.agent.name}</p>
              </div>
              {tour.agent.phone && (
                <a href={`tel:${tour.agent.phone}`}>
                  <button style={{ background: '#f1f5f9', border: 'none', borderRadius: 8,
                    padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 12, color: '#475569', fontWeight: 600 }}>
                    <Phone size={12} />Call
                  </button>
                </a>
              )}
            </div>
          )}

          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={12} />
            Booked {new Date(tour.created_at).toLocaleString('en-PH', {
              month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
            <a href={`tel:${tour.lead_phone}`} style={{ flex: 1, textDecoration: 'none' }}>
              <button style={{ width: '100%', padding: '11px', background: '#1d4ed8', color: '#fff',
                border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Phone size={14} />Call Lead
              </button>
            </a>
            {tour.lead_email && (
              <a href={`mailto:${tour.lead_email}`} style={{ flex: 1, textDecoration: 'none' }}>
                <button style={{ width: '100%', padding: '11px', background: '#c0392b', color: '#fff',
                  border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Mail size={14} />Email Lead
                </button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminToursPage() {
  const [tours,        setTours]        = useState<Tour[]>([]);
  const [pagination,   setPagination]   = useState<PaginationMeta | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter,   setTypeFilter]   = useState('all');
  const [selected,     setSelected]     = useState<Tour | null>(null);
  const [currentPage,  setCurrentPage]  = useState(1);

  const load = useCallback(async (page = 1, s = search, st = statusFilter, tp = typeFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '20' });
      if (s)            params.set('search', s);
      if (st !== 'all') params.set('status', st);
      if (tp !== 'all') params.set('tour_type', tp);

      const res  = await fetch(`${API}?${params}`);
      const data = await res.json();
      setTours(data.data ?? data.tours ?? []);
      if (data.meta ?? data.current_page) {
        setPagination({
          current_page: data.meta?.current_page ?? data.current_page,
          last_page:    data.meta?.last_page    ?? data.last_page,
          per_page:     data.meta?.per_page     ?? data.per_page,
          total:        data.meta?.total        ?? data.total,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => { load(1); }, []);

  const handleStatusChange = async (id: number, status: Tour['status']) => {
    try {
      await fetch(`/api/tours/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      });
      setTours(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : prev);
    } catch (err) {
      console.error(err);
    }
  };

  const counts = {
    total:     tours.length,
    pending:   tours.filter(t => t.status === 'pending').length,
    confirmed: tours.filter(t => t.status === 'confirmed').length,
    completed: tours.filter(t => t.status === 'completed').length,
    cancelled: tours.filter(t => t.status === 'cancelled').length,
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', maxWidth: 1200, margin: '0 auto' }}>

      {selected && (
        <TourDrawer
          tour={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>Tours</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
            {pagination?.total ?? tours.length} total property tour bookings
          </p>
        </div>
        <button onClick={() => load(currentPage)} style={{ display: 'flex', alignItems: 'center', gap: 6,
          background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: 10,
          padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}>
          <RefreshCw size={14} />Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total',     value: pagination?.total ?? counts.total, bg: '#f8fafc', color: '#1e293b', border: '#e2e8f0' },
          { label: 'Pending',   value: counts.pending,   bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
          { label: 'Confirmed', value: counts.confirmed, bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' },
          { label: 'Completed', value: counts.completed, bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
          { label: 'Cancelled', value: counts.cancelled, bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1.5px solid ${s.border}`,
            borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: '0 0 2px' }}>{s.value}</p>
            <p style={{ fontSize: 12, color: s.color, margin: 0, opacity: 0.8 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff',
          border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', flex: 1, minWidth: 220 }}>
          <Search size={14} color="#94a3b8" />
          <input type="text" placeholder="Search by name, phone, property…"
            value={search} onChange={e => { setSearch(e.target.value); load(1, e.target.value, statusFilter, typeFilter); }}
            style={{ border: 'none', outline: 'none', fontSize: 13, color: '#334155',
              background: 'transparent', flex: 1 }} />
          {search && (
            <button onClick={() => { setSearch(''); load(1, '', statusFilter, typeFilter); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <X size={13} color="#94a3b8" />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); load(1, search, s, typeFilter); }} style={{
              padding: '7px 12px', borderRadius: 10,
              border: statusFilter === s ? '2px solid #1d4ed8' : '1.5px solid #e2e8f0',
              background: statusFilter === s ? '#eff6ff' : '#fff',
              color: statusFilter === s ? '#1d4ed8' : '#64748b',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
              transition: 'all 0.12s',
            }}>
              {s}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { val: 'all',       label: 'All Types' },
            { val: 'in-person', label: '🏠 In-Person' },
            { val: 'video',     label: '📹 Video' },
          ].map(t => (
            <button key={t.val} onClick={() => { setTypeFilter(t.val); load(1, search, statusFilter, t.val); }} style={{
              padding: '7px 12px', borderRadius: 10,
              border: typeFilter === t.val ? '2px solid #c0392b' : '1.5px solid #e2e8f0',
              background: typeFilter === t.val ? '#fff1f0' : '#fff',
              color: typeFilter === t.val ? '#c0392b' : '#64748b',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table — horizontal scroll on mobile */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                {['Lead', 'Property', 'Tour Type', 'Date & Time', 'Contact', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11,
                    fontWeight: 700, color: '#64748b', textTransform: 'uppercase',
                    letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[...Array(6)].map((_, i) => (
                        <div key={i} style={{ height: 44, background: '#f1f5f9', borderRadius: 8,
                          animation: 'shimmer 1.5s ease-in-out infinite' }} />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : tours.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <Calendar size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#475569', margin: '0 0 4px' }}>No tours found</p>
                      <p style={{ fontSize: 13, margin: 0 }}>Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tours.map((tour, idx) => (
                  <tr key={tour.id} onClick={() => setSelected(tour)}
                    style={{
                      borderBottom: idx < tours.length - 1 ? '1px solid #f1f5f9' : 'none',
                      cursor: 'pointer', transition: 'background 0.1s',
                      background: selected?.id === tour.id ? '#f0f9ff' : '#fff',
                    }}
                    onMouseEnter={e => { if (selected?.id !== tour.id) (e.currentTarget as HTMLTableRowElement).style.background = '#fafafa'; }}
                    onMouseLeave={e => { if (selected?.id !== tour.id) (e.currentTarget as HTMLTableRowElement).style.background = selected?.id === tour.id ? '#f0f9ff' : '#fff'; }}
                  >
                    {/* Lead */}
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: '0 0 2px' }}>{tour.lead_name}</p>
                      <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{tour.lead_phone}</p>
                    </td>

                    {/* Property */}
                    <td style={{ padding: '13px 16px', maxWidth: 180 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#334155', margin: '0 0 2px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tour.property?.title ?? '—'}
                      </p>
                      {tour.property?.city && (
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0,
                          display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
                          <MapPin size={10} />{tour.property.city}
                        </p>
                      )}
                    </td>

                    {/* Tour type */}
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <TourTypeBadge type={tour.tour_type} />
                    </td>

                    {/* Date & time */}
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', margin: '0 0 2px' }}>
                        {tour.tour_date
                          ? new Date(tour.tour_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—'}
                      </p>
                      <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                        {formatTime(tour.tour_time)}
                      </p>
                    </td>

                    {/* Contact */}
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 15 }}>{CONTACT_ICONS[tour.preferred_contact] ?? '💬'}</span>
                        <span style={{ textTransform: 'capitalize' }}>{tour.preferred_contact}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <StatusBadge status={tour.status} />
                    </td>

                    {/* Action */}
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <button style={{ background: 'none', border: '1.5px solid #e2e8f0',
                        borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
                        fontSize: 12, color: '#475569', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Eye size={12} />View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (pagination.last_page ?? 0) > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6, marginTop: 20 }}>
          <button onClick={() => { setCurrentPage(p => p - 1); load(currentPage - 1); }}
            disabled={currentPage === 1} style={{ padding: '7px 14px', borderRadius: 8,
              border: '1.5px solid #e2e8f0', background: '#fff',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: 13, color: currentPage === 1 ? '#cbd5e1' : '#475569', fontWeight: 600 }}>
            ← Prev
          </button>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            Page {pagination.current_page ?? 1} of {pagination.last_page ?? 1}
          </span>
          <button onClick={() => { setCurrentPage(p => p + 1); load(currentPage + 1); }}
            disabled={currentPage === (pagination.last_page ?? 1)} style={{ padding: '7px 14px', borderRadius: 8,
              border: '1.5px solid #e2e8f0', background: '#fff',
              cursor: currentPage === (pagination.last_page ?? 1) ? 'not-allowed' : 'pointer',
              fontSize: 13, color: currentPage === (pagination.last_page ?? 1) ? '#cbd5e1' : '#475569', fontWeight: 600 }}>
            Next →
          </button>
        </div>
      )}

      <style>{`@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}