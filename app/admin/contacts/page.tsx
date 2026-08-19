'use client';

import { useEffect, useState } from 'react';
import {
  Search, Trash2, Eye, X, Mail, Phone, User, Reply,
  Loader2, AlertCircle, CheckCircle, Send, ChevronLeft, ChevronRight,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Contact {
  reply_message: any;
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  created_at: string;
  replied_at?: string | null;
}

interface PaginatedResponse {
  data: Contact[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

type ModalMode = 'view' | 'reply' | null;
interface Toast { id: number; type: 'success' | 'error'; message: string; }

const inp = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all';
const lbl = 'block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2';

// ── Predefined Messages ───────────────────────────────────────────────────────
const PREDEFINED_MESSAGES = [
  {
    label: 'Thank You',
    message: 'Thank you for reaching out to us! We appreciate your interest and will get back to you shortly with more information.',
  },
  {
    label: 'Information Request',
    message: 'Thank you for your inquiry. We have received your message and our team will review it. We will provide you with the requested information within 24 hours.',
  },
  {
    label: 'Appointment Confirmation',
    message: 'Thank you for contacting us. We are pleased to confirm your appointment. Please keep this message for your records.',
  },
  {
    label: 'Support Response',
    message: 'We have received your support request and our team is working on resolving your issue. We will follow up with you soon with updates.',
  },
  {
    label: 'Custom',
    message: '',
  },
];

// ── Toast ─────────────────────────────────────────────────────────────────────

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
          <button onClick={() => remove(t.id)} className="ml-1 opacity-50 hover:opacity-100"><X className="w-3 h-3" /></button>
        </div>
      ))}
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({
  title, description, confirmLabel = 'Confirm', variant = 'red',
  onConfirm, onCancel, loading,
}: {
  title: string; description: string; confirmLabel?: string; variant?: 'red' | 'amber';
  onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  const btnCls = variant === 'amber' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-600 hover:bg-red-700';
  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]" onClick={onCancel} />
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4"
          style={{ animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${variant === 'amber' ? 'bg-amber-50' : 'bg-red-50'}`}>
              <AlertCircle className={`w-5 h-5 ${variant === 'amber' ? 'text-amber-500' : 'text-red-500'}`} />
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
              className={`px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2 ${btnCls}`}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Please wait...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── View Modal ────────────────────────────────────────────────────────────────

function ViewModal({
  contact, onClose, onReply,
}: {
  contact: Contact; onClose: () => void; onReply: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100]" onClick={onClose} />
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          style={{ animation: 'modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{contact.subject}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{new Date(contact.created_at).toLocaleString()}</p>
            </div>
            <button onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">From</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-slate-800 font-semibold">{contact.name}</p>
                    <p className="text-xs text-slate-500">{contact.email}</p>
                  </div>
                </div>
              </div>
              {contact.phone && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Phone</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-slate-800 font-semibold">{contact.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Message */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Message</p>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
                {contact.message}
              </div>
            </div>

            {/* Status & Reply Message */}
            {contact.replied_at && (
              <div className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Replied</p>
                    <p className="text-xs text-emerald-700">{new Date(contact.replied_at).toLocaleString()}</p>
                  </div>
                </div>
                {contact.reply_message && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Reply Message</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
                      {contact.reply_message}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-8 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
            <button onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors">
              Close
            </button>
            {!contact.replied_at && (
              <button onClick={onReply}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-red-200">
                <Reply className="w-4 h-4" /> Send Reply
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Reply Modal ───────────────────────────────────────────────────────────────

function ReplyModal({
  contact, onClose, onSent,
}: {
  contact: Contact; onClose: () => void; onSent: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<{ subject: string; message: string; reply_message: string }>({
    subject: `Re: ${contact.subject}`,
    message: '',
    reply_message: typeof contact.reply_message === 'string' ? contact.reply_message : '',
  });

  const handleSubmit = async () => {
    if (!form.message.trim()) {
      setError('Message cannot be empty.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/contacts/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contact.id,
          replyTo: contact.email,
          subject: form.subject,
          message: form.message,
          reply_message: form.reply_message,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to send reply.');
      }

      onSent('Reply sent successfully!');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unexpected error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100]" onClick={onClose} />
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          style={{ animation: 'modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Send Reply</h2>
              <p className="text-xs text-slate-400 mt-0.5">To: {contact.email}</p>
            </div>
            <button onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            {/* Subject */}
            <div>
              <label className={lbl}>Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))}
                className={inp}
                placeholder="Reply subject..."
              />
            </div>

            {/* Predefined Messages */}
            <div>
              <label className={lbl}>Quick Template</label>
              <select
                onChange={(e) => {
                  const template = PREDEFINED_MESSAGES.find(m => m.label === e.target.value);
                  if (template && template.label !== 'Custom') {
                    setForm(p => ({ ...p, message: template.message }));
                  }
                }}
                className={inp}
              >
                <option value="">Select a template...</option>
                {PREDEFINED_MESSAGES.map(msg => (
                  <option key={msg.label} value={msg.label}>{msg.label}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-2">Select a predefined message or write your own below</p>
            </div>

            {/* Message */}
            <div>
              <label className={lbl}>Message</label>
              <textarea
                rows={8}
                value={form.message}
                onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
                className={`${inp} resize-none`}
                placeholder="Type your reply message here..."
              />
              <p className="text-xs text-slate-400 mt-2">{form.message.length} characters</p>
            </div>

            {/* Reply Message Field */}
            {/* <div>
              <label className={lbl}>Reply Message (Internal Note)</label>
              <textarea
                rows={4}
                value={form.reply_message}
                onChange={(e) => setForm(p => ({ ...p, reply_message: e.target.value }))}
                className={`${inp} resize-none`}
                placeholder="Add any internal notes or additional information..."
              />
              <p className="text-xs text-slate-400 mt-2">{form.reply_message.length} characters</p>
            </div> */}

            {/* Original Message Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Original Message</p>
              <p className="text-xs text-slate-600 font-semibold mb-1">{contact.subject}</p>
              <div className="text-sm text-slate-600 whitespace-pre-wrap border-t border-slate-200 mt-2 pt-3">
                {contact.message}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-8 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
            <button onClick={onClose} disabled={loading}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-red-200">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Sending...' : <>
                <Send className="w-4 h-4" /> Send Reply
              </>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginatedResponse | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000);
  };

  const removeToast = (id: number) => {
    setToasts(p => p.filter(t => t.id !== id));
  };

  const fetchContacts = async (pageNum = 1) => {
    setLoading(true);
    setError('');

    try {
      const query = new URLSearchParams({
        page: String(pageNum),
        ...(search && { search }),
      });

      const res = await fetch(`/api/admin/contacts?${query}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to fetch contacts.');
      }

      setContacts(data.data);
      setPagination(data);
      setPage(pageNum);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts(1);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContacts(1);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/admin/contacts/${deleteConfirm}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to delete contact.');
      }

      setContacts(p => p.filter(c => c.id !== deleteConfirm));
      addToast('success', 'Contact deleted successfully.');
      setDeleteConfirm(null);
    } catch (err: unknown) {
      addToast('error', err instanceof Error ? err.message : 'Failed to delete contact.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openView = (contact: Contact) => {
    setSelectedContact(contact);
    setModalMode('view');
  };

  const openReply = () => {
    setModalMode('reply');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedContact(null);
  };

  const handleReplySent = (msg: string) => {
    addToast('success', msg);
    fetchContacts(page);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @keyframes modalIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes toastIn { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 lg:px-8 py-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-black text-slate-900">Contact Messages</h1>
          <p className="text-slate-500 text-sm mt-1">View and reply to contact form submissions</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or subject..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Error State */}
        {error && (
          <div className="mb-8 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-600">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
              <p className="text-slate-600 text-sm">Loading contacts...</p>
            </div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Mail className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">No contacts yet</h3>
            <p className="text-slate-500">New contact form submissions will appear here</p>
          </div>
        ) : (
          <>
            {/* Contacts Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact, i) => (
                      <tr key={contact.id} className={`border-t border-slate-100 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? '' : ''}`}>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-800">{contact.name}</p>
                          {contact.phone && <p className="text-xs text-slate-500 mt-1">{contact.phone}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <a href={`mailto:${contact.email}`} className="text-sm text-red-600 hover:text-red-700 font-medium">
                            {contact.email}
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-700 max-w-xs truncate">{contact.subject}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-600">{new Date(contact.created_at).toLocaleDateString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          {contact.replied_at ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                              <CheckCircle className="w-3 h-3" /> Replied
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                              <AlertCircle className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openView(contact)}
                              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(contact.id)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-slate-600 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-slate-600">
                  Showing <span className="font-semibold">{(page - 1) * pagination.per_page + 1}</span> to{' '}
                  <span className="font-semibold">{Math.min(page * pagination.per_page, pagination.total)}</span> of{' '}
                  <span className="font-semibold">{pagination.total}</span> contacts
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchContacts(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => fetchContacts(p)}
                        className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                          p === page
                            ? 'bg-red-600 text-white'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => fetchContacts(Math.min(pagination.last_page, page + 1))}
                    disabled={page === pagination.last_page}
                    className="p-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {selectedContact && modalMode === 'view' && (
        <ViewModal contact={selectedContact} onClose={closeModal} onReply={openReply} />
      )}

      {selectedContact && modalMode === 'reply' && (
        <ReplyModal contact={selectedContact} onClose={closeModal} onSent={handleReplySent} />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Contact"
          description="This contact message will be permanently deleted. This action cannot be undone."
          confirmLabel="Delete"
          variant="red"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
          loading={deleteLoading}
        />
      )}

      {/* Toast Notifications */}
      <ToastList toasts={toasts} remove={removeToast} />
    </div>
  );
}
