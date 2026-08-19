// app/admin/inquiries/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Phone, Mail, MapPin, Calendar, MessageSquare,
  Search, X, Eye, CheckCircle2, Clock, Filter,
  Building2, User, RefreshCw, ChevronDown,
} from 'lucide-react';

// ─── Image URL helper ─────────────────────────────────────────────────────────
const IMG_BASE = (process.env.NEXT_PUBLIC_API_IMG ?? 'http://localhost:8000').replace(/\/$/, '');

function imgUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  // Already a full URL pointing to the backend — return as-is
  if (path.startsWith(IMG_BASE)) return path;
  // Any other absolute URL (e.g. ui-avatars) — return as-is
  if (/^https?:\/\//i.test(path)) return path;
  // Relative path (e.g. "agents/avatars/xxx.jpg") — always prefix with backend base
  return `${IMG_BASE}/${path.replace(/^\//, '')}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Inquiry {
  id: number;
  property_id: number;
  agent_id: number;
  lead_name: string;
  lead_phone: string;
  lead_email?: string | null;
  message?: string | null;
  preferred_contact: string;
  viewing_date?: string | null;
  status: 'new' | 'contacted' | 'closed';
  created_at: string;
  property?: {
    id: number;
    title: string;
    city?: string;
    listing_type?: string;
    price?: number;
    price_per_month?: number;
    thumbnail?: string | null;
  };
  agent?: {
    id: number;
    name: string;
    avatar?: string | null;
  };
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const API = '/api/admin/inquiries';

const STATUS_MAP = {
  new:       { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6', label: 'New' },
  contacted: { bg: '#fef9c3', color: '#854d0e', dot: '#eab308', label: 'Contacted' },
  closed:    { bg: '#dcfce7', color: '#15803d', dot: '#22c55e', label: 'Closed' },
};

const CONTACT_ICONS: Record<string, string> = {
  sms: '💬', viber: '📲', email: '📧', phone: '📞', whatsapp: '💬',
};

function StatusBadge({ status }: { status: Inquiry['status'] }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.new;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700,
      padding: '3px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
      {s.label}
    </span>
  );
}

function formatPrice(amount: number, isRent = false): string {
  if (!amount) return '—';
  const fmt = amount >= 1_000_000
    ? `₱${(amount / 1_000_000).toFixed(2)}M`
    : `₱${amount.toLocaleString('en-PH')}`;
  return isRent ? `${fmt}/mo` : fmt;
}

// ─── Agent Avatar ─────────────────────────────────────────────────────────────
function AgentAvatar({ agent }: { agent: NonNullable<Inquiry['agent']> }) {
  const src = imgUrl(agent.avatar)
    ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&size=64&background=random`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={agent.name}
      width={36}
      height={36}
      style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}

    />
  );
}

// ─── Detail drawer ────────────────────────────────────────────────────────────
function InquiryDrawer({
  inquiry, onClose, onStatusChange,
}: {
  inquiry: Inquiry;
  onClose: () => void;
  onStatusChange: (id: number, status: Inquiry['status']) => void;
}) {
  const isRent = inquiry.property?.listing_type === 'rent';
  const price  = isRent ? inquiry.property?.price_per_month : inquiry.property?.price;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}
      onClick={onClose}>
      {/* Backdrop */}
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(3px)' }} />

      {/* Panel */}
      <div style={{ width: 420, background: '#fff', height: '100%', overflowY: 'auto',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #7f1d1d 0%, #c0392b 100%)' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>
              Inquiry #{inquiry.id}
            </p>
            <h3 style={{ color: '#fff', fontSize: 17, fontWeight: 700, margin: 0 }}>
              {inquiry.lead_name}
            </h3>
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
            <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['new', 'contacted', 'closed'] as const).map(s => {
                const m = STATUS_MAP[s];
                const active = inquiry.status === s;
                return (
                  <button key={s} onClick={() => onStatusChange(inquiry.id, s)} style={{
                    flex: 1, padding: '8px 4px', borderRadius: 10, border: active ? `2px solid ${m.dot}` : '1.5px solid #e2e8f0',
                    background: active ? m.bg : '#fafafa', color: active ? m.color : '#64748b',
                    fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact info */}
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', margin: '0 0 12px',
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lead Contact</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#c0392b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={15} color="#fff" />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{inquiry.lead_name}</span>
              </div>
              <a href={`tel:${inquiry.lead_phone}`} style={{ display: 'flex', alignItems: 'center', gap: 10,
                textDecoration: 'none', color: '#1e293b' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dcfce7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Phone size={14} color="#15803d" />
                </div>
                <span style={{ fontSize: 14, color: '#15803d', fontWeight: 500 }}>{inquiry.lead_phone}</span>
              </a>
              {inquiry.lead_email && (
                <a href={`mailto:${inquiry.lead_email}`} style={{ display: 'flex', alignItems: 'center', gap: 10,
                  textDecoration: 'none', color: '#1e293b' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dbeafe',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={14} color="#1d4ed8" />
                  </div>
                  <span style={{ fontSize: 14, color: '#1d4ed8', fontWeight: 500 }}>{inquiry.lead_email}</span>
                </a>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
                  {CONTACT_ICONS[inquiry.preferred_contact] ?? '💬'}
                </div>
                <span style={{ fontSize: 13, color: '#64748b' }}>
                  Prefers: <strong style={{ color: '#1e293b' }}>{inquiry.preferred_contact.toUpperCase()}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Property */}
          {inquiry.property && (
            <div style={{ background: '#fff8f8', border: '1.5px solid #fde8e8', borderRadius: 12, padding: '16px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', margin: '0 0 10px',
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>Property</p>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {/* Property thumbnail */}
                {imgUrl(inquiry.property.thumbnail) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgUrl(inquiry.property.thumbnail)}
                    alt={inquiry.property.title}
                    style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                    onError={e => {
                      // swap to icon fallback on error
                      const parent = (e.currentTarget as HTMLImageElement).parentElement;
                      if (parent) {
                        e.currentTarget.style.display = 'none';
                        const icon = parent.querySelector('.prop-icon-fallback') as HTMLElement | null;
                        if (icon) icon.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div className="prop-icon-fallback" style={{
                  width: 36, height: 36, background: '#fee2e2', borderRadius: 10,
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  display: imgUrl(inquiry.property.thumbnail) ? 'none' : 'flex',
                }}>
                  <Building2 size={17} color="#c0392b" />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 3px' }}>
                    {inquiry.property.title}
                  </p>
                  {inquiry.property.city && (
                    <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 4px',
                      display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={11} />{inquiry.property.city}
                    </p>
                  )}
                  {price && (
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#c0392b', margin: 0 }}>
                      {formatPrice(price, isRent)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Viewing date */}
          {inquiry.viewing_date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10,
              background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: '14px 16px' }}>
              <Calendar size={18} color="#15803d" />
              <div>
                <p style={{ fontSize: 11, color: '#15803d', fontWeight: 600, margin: '0 0 1px' }}>Preferred Viewing Date</p>
                <p style={{ fontSize: 14, color: '#1e293b', fontWeight: 600, margin: 0 }}>
                  {new Date(inquiry.viewing_date).toLocaleDateString('en-PH', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Message */}
          {inquiry.message && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', margin: '0 0 8px',
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>Message</p>
              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12,
                padding: '14px 16px', fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
                {inquiry.message}
              </div>
            </div>
          )}

          {/* Agent */}
          {inquiry.agent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10,
              background: '#fafafa', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px 16px' }}>
              <AgentAvatar agent={inquiry.agent} />
              <div>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 1px' }}>Assigned Agent</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>{inquiry.agent.name}</p>
              </div>
            </div>
          )}

          {/* Date received */}
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={12} />
            Received {new Date(inquiry.created_at).toLocaleString('en-PH', {
              month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>

          {/* Quick contact buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
            <a href={`tel:${inquiry.lead_phone}`} style={{ flex: 1, textDecoration: 'none' }}>
              <button style={{ width: '100%', padding: '11px', background: '#c0392b', color: '#fff',
                border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Phone size={14} />Call Lead
              </button>
            </a>
            {inquiry.lead_email && (
              <a href={`mailto:${inquiry.lead_email}`} style={{ flex: 1, textDecoration: 'none' }}>
                <button style={{ width: '100%', padding: '11px', background: '#1d4ed8', color: '#fff',
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
export default function AdminInquiriesPage() {
  const [inquiries,   setInquiries]   = useState<Inquiry[]>([]);
  const [pagination,  setPagination]  = useState<PaginationMeta | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected,    setSelected]    = useState<Inquiry | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async (page = 1, s = search, st = statusFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '20' });
      if (s)         params.set('search', s);
      if (st !== 'all') params.set('status', st);

      const res  = await fetch(`${API}?${params}`);
      const data = await res.json();
      setInquiries(data.data ?? data.inquiries ?? []);
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
  }, [search, statusFilter]);

  useEffect(() => { load(1); }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
    load(1, val, statusFilter);
  };

  const handleStatusFilter = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
    load(1, search, val);
  };

  const handleStatusChange = async (id: number, status: Inquiry['status']) => {
    try {
      await fetch(`/api/inquiries/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      });
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : prev);
    } catch (err) {
      console.error(err);
    }
  };

  const counts = {
    all:       inquiries.length,
    new:       inquiries.filter(i => i.status === 'new').length,
    contacted: inquiries.filter(i => i.status === 'contacted').length,
    closed:    inquiries.filter(i => i.status === 'closed').length,
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', maxWidth: 1200, margin: '0 auto' }}>

      {/* Drawer */}
      {selected && (
        <InquiryDrawer
          inquiry={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>Inquiries</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
            {pagination?.total ?? inquiries.length} total inquiries from potential buyers & renters
          </p>
        </div>
        <button onClick={() => load(currentPage)} style={{ display: 'flex', alignItems: 'center', gap: 6,
          background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: 10,
          padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}>
          <RefreshCw size={14} />Refresh
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', value: pagination?.total ?? inquiries.length, bg: '#f8fafc', color: '#1e293b', border: '#e2e8f0' },
          { label: 'New',   value: counts.new,       bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' },
          { label: 'Contacted', value: counts.contacted, bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
          { label: 'Closed',   value: counts.closed,    bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
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
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff',
          border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', flex: 1, minWidth: 220 }}>
          <Search size={14} color="#94a3b8" />
          <input type="text" placeholder="Search by name, phone, property…"
            value={search} onChange={e => handleSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 13, color: '#334155',
              background: 'transparent', flex: 1 }} />
          {search && <button onClick={() => handleSearch('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <X size={13} color="#94a3b8" />
          </button>}
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'new', 'contacted', 'closed'].map(s => (
            <button key={s} onClick={() => handleStatusFilter(s)} style={{
              padding: '8px 14px', borderRadius: 10, border: statusFilter === s
                ? '2px solid #c0392b' : '1.5px solid #e2e8f0',
              background: statusFilter === s ? '#fff1f0' : '#fff',
              color: statusFilter === s ? '#c0392b' : '#64748b',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              textTransform: 'capitalize', transition: 'all 0.12s',
            }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table — horizontal scroll on mobile */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                {['Lead', 'Property', 'Contact', 'Date', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11,
                    fontWeight: 700, color: '#64748b', textTransform: 'uppercase',
                    letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[...Array(6)].map((_, i) => (
                        <div key={i} style={{ height: 44, background: '#f1f5f9', borderRadius: 8,
                          animation: 'shimmer 1.5s ease-in-out infinite' }} />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : inquiries.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <MessageSquare size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#475569', margin: '0 0 4px' }}>No inquiries found</p>
                      <p style={{ fontSize: 13, margin: 0 }}>Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                inquiries.map((inq, idx) => (
                  <tr key={inq.id} onClick={() => setSelected(inq)}
                    className="inq-row"
                    style={{
                      borderBottom: idx < inquiries.length - 1 ? '1px solid #f1f5f9' : 'none',
                      cursor: 'pointer', transition: 'background 0.1s',
                      background: selected?.id === inq.id ? '#fff8f8' : '#fff',
                    }}
                    onMouseEnter={e => { if (selected?.id !== inq.id) (e.currentTarget as HTMLTableRowElement).style.background = '#fafafa'; }}
                    onMouseLeave={e => { if (selected?.id !== inq.id) (e.currentTarget as HTMLTableRowElement).style.background = selected?.id === inq.id ? '#fff8f8' : '#fff'; }}
                  >
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: '0 0 2px' }}>{inq.lead_name}</p>
                      <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{inq.lead_phone}</p>
                    </td>
                    <td style={{ padding: '13px 16px', maxWidth: 180 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#334155', margin: '0 0 2px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {inq.property?.title ?? '\u2014'}
                      </p>
                      {inq.property?.city && (
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0,
                          display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
                          <MapPin size={10} />{inq.property.city}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 15 }}>{CONTACT_ICONS[inq.preferred_contact] ?? '\ud83d\udcac'}</span>
                        <span style={{ textTransform: 'capitalize' }}>{inq.preferred_contact}</span>
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>
                        {new Date(inq.created_at).toLocaleDateString('en-PH', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <StatusBadge status={inq.status} />
                    </td>
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
          gap: 6, marginTop: 20, flexWrap: 'wrap' }}>
          <button onClick={() => { setCurrentPage(p => p - 1); load(currentPage - 1); }}
            disabled={currentPage === 1} style={{ padding: '7px 14px', borderRadius: 8,
              border: '1.5px solid #e2e8f0', background: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
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