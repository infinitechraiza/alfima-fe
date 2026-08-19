'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Trash2, Eye, X, Calendar, Clock, Mail, Phone,
  Loader2, CheckCircle, AlertCircle, TriangleAlert, MapPin, Send,
} from 'lucide-react';

interface DeveloperInquiry {
  id?: number;
  full_name: string;
  email: string;
  contact_number: string;
  message: string;
  preferred_viewing_date: string;
  preferred_viewing_time: string;
  developer_property_id?: number;
  property?: { id: number; title: string; address: string };
  created_at?: string;
  updated_at?: string;
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function ToastList({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium
            ${t.type === 'success' ? 'bg-emerald-950 border-emerald-700/40 text-emerald-300' : 'bg-red-950 border-red-700/40 text-red-300'}`}
          style={{ animation: 'toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
          {t.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {t.message}
          <button onClick={() => remove(t.id)} className="ml-1 opacity-50 hover:opacity-100">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({ title, description, onConfirm, onCancel, loading }: {
  title: string; description: string; onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]" onClick={onCancel} />
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4"
          style={{ animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <TriangleAlert className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-slate-800 font-bold text-base">{title}</h3>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">{description}</p>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button onClick={onCancel} disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Inquiry Detail Modal ─────────────────────────────────────────────────────

function InquiryDetailModal({ isOpen, onClose, inquiry }: {
  isOpen: boolean; onClose: () => void; inquiry: DeveloperInquiry | null;
}) {
  if (!isOpen || !inquiry) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100]" onClick={onClose} />
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
          style={{ animation: 'modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Inquiry Details</h2>
              <p className="text-sm text-slate-500 mt-0.5">{inquiry.property?.title || 'Property'}</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            {inquiry.property && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs text-slate-400 mb-2">Property</p>
                <p className="font-bold text-slate-800 mb-1">{inquiry.property.title}</p>
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <MapPin className="w-3 h-3" />{inquiry.property.address}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs text-slate-400 mb-2">Full Name</p>
                <p className="font-bold text-slate-800">{inquiry.full_name}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-1 text-slate-400 text-xs mb-2"><Mail className="w-3 h-3" />Email</div>
                <p className="font-bold text-slate-800 break-all text-sm">{inquiry.email}</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center gap-1 text-slate-400 text-xs mb-2"><Phone className="w-3 h-3" />Contact Number</div>
              <p className="font-bold text-slate-800">{inquiry.contact_number}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-1 text-slate-400 text-xs mb-2"><Calendar className="w-3 h-3" />Preferred Date</div>
                <p className="font-bold text-slate-800">
                  {new Date(inquiry.preferred_viewing_date).toLocaleDateString('en-PH', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-1 text-slate-400 text-xs mb-2"><Clock className="w-3 h-3" />Preferred Time</div>
                <p className="font-bold text-slate-800">{inquiry.preferred_viewing_time}</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="text-xs text-slate-400 mb-2">Message</p>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{inquiry.message}</p>
            </div>
            {inquiry.created_at && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs text-slate-400 mb-2">Submitted</p>
                <p className="text-sm text-slate-600">{new Date(inquiry.created_at).toLocaleString('en-PH')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Send Email Modal ─────────────────────────────────────────────────────────

// ─── Send Email Modal ─────────────────────────────────────────────────────────

function SendEmailModal({ isOpen, onClose, inquiry, onSuccess }: {
  isOpen: boolean;
  onClose: () => void;
  inquiry: DeveloperInquiry | null;
  onSuccess: () => void;
}) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!inquiry || !isOpen) return;
    setTo(inquiry.email);
    setSubject(`Re: Property Viewing Inquiry — ${inquiry.property?.title ?? 'Your Inquiry'}`);
    setError('');

    if (editorRef.current) {
      editorRef.current.innerHTML = `<p>Dear ${inquiry.full_name},</p>
<p>Thank you for your inquiry regarding <strong>${inquiry.property?.title ?? 'our property'}</strong> located at ${inquiry.property?.address ?? ''}.</p>
<p>We have received your request for a viewing on <strong>${new Date(inquiry.preferred_viewing_date).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong> at <strong>${inquiry.preferred_viewing_time}</strong>.</p>
<p>Our team will be in touch shortly to confirm your appointment. If you have any questions in the meantime, feel free to reach out.</p>
<p>Best regards,<br/><strong>Alfima Realty Inc.</strong>`;
    }
  }, [inquiry, isOpen]);

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleSend = async () => {
    const body = editorRef.current?.innerHTML ?? '';
    if (!to || !subject || !body || body === '<br>') {
      setError('All fields are required.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ to, subject, body }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to send email.'); return; }
      onSuccess();
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !inquiry) return null;

  const toolbarBtn = 'p-1.5 rounded hover:bg-slate-200 transition-colors text-slate-600 text-sm font-medium';

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120]" onClick={onClose} />
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          style={{ animation: 'modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">New Message</h2>
                <p className="text-xs text-slate-400">Compose and send email</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* To */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-400 w-14 flex-shrink-0">To</span>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="flex-1 text-sm text-slate-800 outline-none bg-transparent"
                placeholder="recipient@email.com"
              />
            </div>

            {/* Subject */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-400 w-14 flex-shrink-0">Subject</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 text-sm text-slate-800 outline-none bg-transparent font-medium"
                placeholder="Email subject"
              />
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-0.5 px-4 py-2 border-b border-slate-100 bg-slate-50 flex-wrap">
              <button onClick={() => exec('bold')} className={toolbarBtn} title="Bold"><strong>B</strong></button>
              <button onClick={() => exec('italic')} className={toolbarBtn} title="Italic"><em>I</em></button>
              <button onClick={() => exec('underline')} className={toolbarBtn} title="Underline"><u>U</u></button>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <button onClick={() => exec('insertUnorderedList')} className={toolbarBtn} title="Bullet list">• List</button>
              <button onClick={() => exec('insertOrderedList')} className={toolbarBtn} title="Numbered list">1. List</button>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <button onClick={() => exec('justifyLeft')} className={toolbarBtn} title="Align left">Left</button>
              <button onClick={() => exec('justifyCenter')} className={toolbarBtn} title="Align center">Center</button>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <select
                onChange={(e) => exec('fontSize', e.target.value)}
                defaultValue=""
                className="text-xs text-slate-600 bg-transparent outline-none px-1 py-1 rounded hover:bg-slate-200 transition-colors"
              >
                <option value="" disabled>Size</option>
                <option value="1">Small</option>
                <option value="3">Normal</option>
                <option value="5">Large</option>
                <option value="7">Huge</option>
              </select>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <button onClick={() => exec('removeFormat')} className={toolbarBtn} title="Clear formatting">Clear</button>
            </div>

            {/* Rich text editor */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="min-h-[220px] px-6 py-4 text-sm text-slate-700 leading-relaxed outline-none"
              style={{ wordBreak: 'break-word' }}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
            <div className="flex-1">
              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={onClose} disabled={sending}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors disabled:opacity-50">
                Discard
              </button>
              <button onClick={handleSend} disabled={sending}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DeveloperInquiriesPage() {
  const [inquiries, setInquiries] = useState<DeveloperInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<DeveloperInquiry | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [emailTarget, setEmailTarget] = useState<DeveloperInquiry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeveloperInquiry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const PER_PAGE = 15;

  const addToast = (type: Toast['type'], message: string) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, type, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) });
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/developer-inquiries?${params}`, {
        headers: { 'Accept': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) { addToast('error', data.error ?? `Error ${res.status}`); return; }

      setInquiries(data.data ?? data);
      setTotal(data.total ?? (data.data ?? data).length);
      setLastPage(data.last_page ?? 1);
    } catch {
      addToast('error', 'Failed to load inquiries.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/developer-inquiries/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) { addToast('error', data.error ?? 'Failed to delete.'); return; }
      addToast('success', 'Inquiry deleted.');
      setDeleteTarget(null);
      fetchInquiries();
    } catch {
      addToast('error', 'Failed to delete inquiry.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes toastIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .row-hover:hover { background: #f8fafc; }
      `}</style>

      <ToastList toasts={toasts} remove={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      <InquiryDetailModal isOpen={showDetail} onClose={() => setShowDetail(false)} inquiry={selectedInquiry} />

      <SendEmailModal
        isOpen={showEmail}
        onClose={() => setShowEmail(false)}
        inquiry={emailTarget}
        onSuccess={() => addToast('success', `Email sent to ${emailTarget?.email}!`)}
      />

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Inquiry"
          description={`Remove the inquiry from ${deleteTarget.full_name}?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      <div className="bg-slate-50 min-h-screen">
        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Developer Inquiries</h1>
            <p className="text-sm text-slate-400 mt-0.5">{total} total inquiries</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                placeholder="Search by name, email, property, address..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Updated header — 5 columns now with email action */}
            <div className="grid grid-cols-[2fr_1.5fr_1.2fr_1fr_160px] gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50">
              {['Inquiry From', 'Property', 'Preferred Date', 'Submitted', 'Actions'].map((h) => (
                <span key={h} className="text-xs font-bold text-slate-400 uppercase tracking-widest">{h}</span>
              ))}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Loading inquiries...</p>
              </div>
            ) : !inquiries.length ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
                  <Mail className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-base font-semibold text-slate-600">No inquiries found</p>
                <p className="text-sm text-slate-400">Inquiries will appear here when users submit them.</p>
              </div>
            ) : (
              <div>
                {inquiries.map((inquiry, idx) => (
                  <div key={inquiry.id}
                    className={`row-hover grid grid-cols-[2fr_1.5fr_1.2fr_1fr_160px] gap-4 px-6 py-4 items-center transition-colors ${idx < inquiries.length - 1 ? 'border-b border-slate-50' : ''}`}
                    style={{ animation: `fadeUp 0.3s ease ${idx * 0.04}s both` }}>

                    <div>
                      <p className="text-slate-800 text-sm font-bold mb-0.5">{inquiry.full_name}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{inquiry.email}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-slate-800 text-sm font-semibold line-clamp-1">{inquiry.property?.title || '—'}</p>
                      <p className="text-slate-400 text-xs line-clamp-1 mt-0.5">{inquiry.property?.address || '—'}</p>
                    </div>

                    <div>
                      <p className="text-slate-800 text-sm font-semibold">
                        {new Date(inquiry.preferred_viewing_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">{inquiry.preferred_viewing_time}</p>
                    </div>

                    <div>
                      <p className="text-slate-600 text-xs">
                        {inquiry.created_at
                          ? new Date(inquiry.created_at).toLocaleDateString('en-PH', {
                              month: 'short', day: 'numeric',
                              year: inquiry.created_at.split('-')[0] !== new Date().getFullYear().toString() ? 'numeric' : undefined,
                            })
                          : '—'}
                      </p>
                    </div>

                    {/* Actions — now 3 buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { setSelectedInquiry(inquiry); setShowDetail(true); }}
                        title="View details"
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setEmailTarget(inquiry); setShowEmail(true); }}
                        title="Send email"
                        className="p-2 hover:bg-green-50 rounded-lg transition-colors text-green-600">
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(inquiry)}
                        title="Delete inquiry"
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!loading && inquiries.length > 0 && (
            <div className="flex items-center justify-between mt-6 px-4">
              <p className="text-sm text-slate-500">
                Page <span className="font-bold text-slate-700">{page}</span> of{' '}
                <span className="font-bold text-slate-700">{lastPage}</span>
              </p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-colors">
                  Previous
                </button>
                <button disabled={page === lastPage} onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-colors">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}