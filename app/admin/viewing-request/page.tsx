"use client";

import { useEffect, useState } from "react";
import {
  Search, Trash2, Eye, X, CheckCircle, AlertCircle,
  Loader2, Check, Ban, TriangleAlert, Calendar, Clock,
  Building2, Phone, Mail, User, StickyNote,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface PropertyItem {
  id:    number | string;
  title: string;
  city?: string;
}

interface ViewingRequest {
  id:             number;
  name:           string;
  email:          string;
  phone:          string;
  preferred_date: string;
  preferred_time: string;
  properties:     PropertyItem[];
  status:         "pending" | "accepted" | "rejected";
  notes:          string | null;
  created_at:     string;
}

interface Toast {
  id:      number;
  type:    "success" | "error";
  message: string;
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({
  title, description, confirmLabel = "Confirm",
  onConfirm, onCancel, loading, isDangerous = false,
}: {
  title: string; description: string; confirmLabel?: string;
  onConfirm: () => void; onCancel: () => void;
  loading?: boolean; isDangerous?: boolean;
}) {
  const bgColor   = isDangerous ? "bg-red-50"    : "bg-blue-50";
  const iconColor = isDangerous ? "text-red-500"  : "text-blue-500";
  const btnColor  = isDangerous ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700";
  const Icon      = isDangerous ? TriangleAlert : CheckCircle;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]" onClick={onCancel} />
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4"
          style={{ animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
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
              className={`px-5 py-2.5 rounded-xl ${btnColor} text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2`}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Processing..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function ToastList({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium
            ${t.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"}`}
          style={{ animation: "toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
          {t.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {t.message}
          <button onClick={() => remove(t.id)} className="ml-1 opacity-50 hover:opacity-100">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ViewingRequest["status"] }) {
  const map = {
    pending:  { dot: "bg-amber-400",   pill: "bg-amber-100 text-amber-700",   label: "Pending"  },
    accepted: { dot: "bg-emerald-500", pill: "bg-emerald-100 text-emerald-700", label: "Accepted" },
    rejected: { dot: "bg-red-400",     pill: "bg-red-100 text-red-600",        label: "Rejected" },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold ${s.pill}`}>
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ── Notes Modal (Accept with notes) ──────────────────────────────────────────
function AcceptWithNotesModal({
  request, onConfirm, onCancel, loading,
}: {
  request: ViewingRequest;
  onConfirm: (notes: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [notes, setNotes] = useState(request.notes ?? "");

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]" onClick={onCancel} />
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5"
          style={{ animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Accept Viewing Request</h3>
                <p className="text-xs text-slate-500 mt-0.5">{request.name}</p>
              </div>
            </div>
            <button onClick={onCancel} className="p-1.5 hover:bg-slate-100 rounded-lg">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Confirmed schedule summary */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              {new Date(request.preferred_date).toLocaleDateString("en-PH", {
                weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
              })}
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-4 h-4 text-slate-400" />
              {request.preferred_time}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Agent Notes <span className="font-normal normal-case text-slate-400">(optional — visible to agent only)</span>
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Bring the floor plan for Unit 3B. Client is relocating from Cebu."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none transition-all"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={onCancel} disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button onClick={() => onConfirm(notes)} disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Accepting..." : "Confirm & Accept"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── View Modal ────────────────────────────────────────────────────────────────
function ViewRequestModal({
  request, onClose,
}: {
  request: ViewingRequest | null; onClose: () => void;
}) {
  if (!request) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]" onClick={onClose} />
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
          style={{ animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{request.name}</h2>
              <p className="text-sm text-slate-500 mt-1">Viewing Request #{request.id}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={request.status} />
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Mail,  label: "Email", value: request.email },
              { icon: Phone, label: "Phone", value: request.phone },
              { icon: User,  label: "Submitted", value: new Date(request.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
                </div>
                <p className="text-sm font-medium text-slate-800 break-all">{value}</p>
              </div>
            ))}
          </div>

          {/* Schedule */}
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">
            <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3">Preferred Schedule</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 text-blue-800 font-semibold">
                <Calendar className="w-4 h-4" />
                {new Date(request.preferred_date).toLocaleDateString("en-PH", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
                })}
              </div>
              <span className="hidden sm:block text-blue-300">·</span>
              <div className="flex items-center gap-2 text-blue-700">
                <Clock className="w-4 h-4" />
                {request.preferred_time}
              </div>
            </div>
          </div>

          {/* Properties */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Properties to View ({request.properties.length})
            </p>
            <div className="space-y-2">
              {request.properties.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                  <span className="text-xs font-bold text-slate-400 w-5">#{i + 1}</span>
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{p.title}</p>
                    {p.city && <p className="text-xs text-slate-500">{p.city}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {request.notes && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <StickyNote className="w-4 h-4 text-amber-500" />
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Agent Notes</p>
              </div>
              <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{request.notes}</p>
            </div>
          )}

          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors">
            Close
          </button>
        </div>
      </div>
    </>
  );
}

// ── Edit Notes Modal ──────────────────────────────────────────────────────────
function EditNotesModal({
  request, onConfirm, onCancel, loading,
}: {
  request: ViewingRequest;
  onConfirm: (notes: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [notes, setNotes] = useState(request.notes ?? "");

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]" onClick={onCancel} />
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5"
          style={{ animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <StickyNote className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Edit Notes</h3>
                <p className="text-xs text-slate-500 mt-0.5">{request.name}</p>
              </div>
            </div>
            <button onClick={onCancel} className="p-1.5 hover:bg-slate-100 rounded-lg">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <textarea
            rows={5}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add agent notes here…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none transition-all"
          />

          <div className="flex gap-3 justify-end">
            <button onClick={onCancel} disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button onClick={() => onConfirm(notes)} disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Saving..." : "Save Notes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ViewingRequestsAdminPage() {
  const [requests,         setRequests]         = useState<ViewingRequest[]>([]);
  const [filtered,         setFiltered]         = useState<ViewingRequest[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [searchQuery,      setSearchQuery]      = useState("");
  const [filterStatus,     setFilterStatus]     = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [viewModal,        setViewModal]        = useState<ViewingRequest | null>(null);
  const [acceptModal,      setAcceptModal]      = useState<ViewingRequest | null>(null);
  const [editNotesModal,   setEditNotesModal]   = useState<ViewingRequest | null>(null);
  const [confirmDialog,    setConfirmDialog]    = useState<{
    type: "reject" | "delete"; request: ViewingRequest;
  } | null>(null);
  const [processingId,     setProcessingId]     = useState<number | null>(null);
  const [toasts,           setToasts]           = useState<Toast[]>([]);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res  = await fetch("/api/admin/request-viewing");
      const data = await res.json();
      if (data.success) setRequests(data.data ?? []);
      else addToast("Failed to load requests", "error");
    } catch {
      addToast("Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let f = requests;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      f = f.filter(r =>
        r.name.toLowerCase().includes(q)  ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.properties.some(p => p.title.toLowerCase().includes(q))
      );
    }
    if (filterStatus !== "all") f = f.filter(r => r.status === filterStatus);
    setFiltered(f);
  }, [searchQuery, filterStatus, requests]);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const addToast = (message: string, type: "success" | "error") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const patchRequest = (id: number, patch: Partial<ViewingRequest>) =>
    setRequests(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));

  // ── Accept ─────────────────────────────────────────────────────────────────
  const handleAccept = async (request: ViewingRequest, notes: string) => {
    setProcessingId(request.id);
    try {
      const res  = await fetch(`/api/admin/request-viewing/${request.id}/accept`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (data.success) {
        patchRequest(request.id, { status: "accepted", notes: notes || null });
        addToast("Request accepted!", "success");
        setAcceptModal(null);
      } else { addToast(data.message || "Failed to accept", "error"); }
    } catch { addToast("Error accepting request", "error"); }
    finally  { setProcessingId(null); }
  };

  // ── Reject ─────────────────────────────────────────────────────────────────
  const handleReject = async (request: ViewingRequest) => {
    setProcessingId(request.id);
    try {
      const res  = await fetch(`/api/admin/request-viewing/${request.id}/reject`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        patchRequest(request.id, { status: "rejected" });
        addToast("Request rejected", "success");
        setConfirmDialog(null);
      } else { addToast(data.message || "Failed to reject", "error"); }
    } catch { addToast("Error rejecting request", "error"); }
    finally  { setProcessingId(null); }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (request: ViewingRequest) => {
    setProcessingId(request.id);
    try {
      const res  = await fetch(`/api/admin/request-viewing/${request.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setRequests(prev => prev.filter(r => r.id !== request.id));
        addToast("Request deleted", "success");
        setConfirmDialog(null);
      } else { addToast(data.message || "Failed to delete", "error"); }
    } catch { addToast("Error deleting request", "error"); }
    finally  { setProcessingId(null); }
  };

  // ── Update Notes ───────────────────────────────────────────────────────────
  const handleUpdateNotes = async (request: ViewingRequest, notes: string) => {
    setProcessingId(request.id);
    try {
      const res  = await fetch(`/api/admin/request-viewing/${request.id}/notes`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (data.success) {
        patchRequest(request.id, { notes: notes || null });
        addToast("Notes saved!", "success");
        setEditNotesModal(null);
      } else { addToast(data.message || "Failed to save notes", "error"); }
    } catch { addToast("Error saving notes", "error"); }
    finally  { setProcessingId(null); }
  };

  const inp = "bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all";

  const counts = {
    total:    requests.length,
    pending:  requests.filter(r => r.status === "pending").length,
    accepted: requests.filter(r => r.status === "accepted").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-1">Viewing Requests</h1>
            <p className="text-slate-500">{counts.total} total request{counts.total !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={fetchRequests}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition-colors flex items-center gap-2">
            ↻ Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-slate-200 p-5 bg-white">
            <p className="text-2xl font-bold text-slate-800">{counts.total}</p>
            <p className="text-slate-500 text-sm mt-0.5">Total</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-2xl font-bold text-amber-700">{counts.pending}</p>
            <p className="text-amber-600 text-sm mt-0.5">Pending</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-2xl font-bold text-emerald-700">{counts.accepted}</p>
            <p className="text-emerald-600 text-sm mt-0.5">Accepted</p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-2xl font-bold text-red-700">{counts.rejected}</p>
            <p className="text-red-600 text-sm mt-0.5">Rejected</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search by name, email, phone, or property…"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className={`${inp} w-full pl-10`} />
            </div>
            <select value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
              className={inp}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-slate-500">
              <AlertCircle className="w-12 h-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">No requests found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    {["Client", "Schedule", "Properties", "Status", "Notes", "Date", "Actions"].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">

                      {/* Client */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{r.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{r.email}</p>
                        <p className="text-xs text-slate-400">{r.phone}</p>
                      </td>

                      {/* Schedule */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700 text-sm font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(r.preferred_date).toLocaleDateString("en-PH", {
                            month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
                          })}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1">
                          <Clock className="w-3 h-3" />
                          {r.preferred_time}
                        </div>
                      </td>

                      {/* Properties */}
                      <td className="px-6 py-4 max-w-[180px]">
                        <div className="flex flex-wrap gap-1">
                          {r.properties.slice(0, 2).map(p => (
                            <span key={p.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                              <Building2 className="w-2.5 h-2.5" />
                              {p.title}
                            </span>
                          ))}
                          {r.properties.length > 2 && (
                            <span className="text-xs text-slate-400">+{r.properties.length - 2} more</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge status={r.status} />
                      </td>

                      {/* Notes */}
                      <td className="px-6 py-4 max-w-[140px]">
                        {r.notes ? (
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{r.notes}</p>
                        ) : (
                          <span className="text-xs text-slate-300 italic">No notes</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {new Date(r.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">

                          {/* View */}
                          <button onClick={() => setViewModal(r)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-800"
                            title="View details">
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Accept (pending or rejected → re-accept) */}
                          {r.status !== "accepted" && (
                            <button
                              onClick={() => setAcceptModal(r)}
                              disabled={processingId === r.id}
                              className="p-2 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                              title="Accept">
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          {/* Reject (accepted → reject) */}
                          {r.status === "accepted" && (
                            <button
                              onClick={() => setConfirmDialog({ type: "reject", request: r })}
                              disabled={processingId === r.id}
                              className="p-2 hover:bg-amber-100 rounded-lg transition-colors text-amber-600 hover:text-amber-700 disabled:opacity-50"
                              title="Reject">
                              <Ban className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit notes */}
                          <button
                            onClick={() => setEditNotesModal(r)}
                            disabled={processingId === r.id}
                            className="p-2 hover:bg-amber-50 rounded-lg transition-colors text-amber-500 hover:text-amber-600 disabled:opacity-50"
                            title="Edit notes">
                            <StickyNote className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setConfirmDialog({ type: "delete", request: r })}
                            disabled={processingId === r.id}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500 hover:text-red-600 disabled:opacity-50"
                            title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ViewRequestModal  request={viewModal}      onClose={() => setViewModal(null)} />
      {acceptModal    && <AcceptWithNotesModal    request={acceptModal}    loading={processingId === acceptModal.id}    onConfirm={n => handleAccept(acceptModal, n)}    onCancel={() => setAcceptModal(null)} />}
      {editNotesModal && <EditNotesModal          request={editNotesModal} loading={processingId === editNotesModal.id} onConfirm={n => handleUpdateNotes(editNotesModal, n)} onCancel={() => setEditNotesModal(null)} />}

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.type === "delete" ? "Delete Request?" : "Reject Request?"}
          description={
            confirmDialog.type === "delete"
              ? "This action cannot be undone. The request will be permanently removed."
              : "This request will be marked as rejected and the client will need to resubmit."
          }
          confirmLabel={confirmDialog.type === "delete" ? "Delete" : "Reject"}
          onConfirm={() =>
            confirmDialog.type === "delete"
              ? handleDelete(confirmDialog.request)
              : handleReject(confirmDialog.request)
          }
          onCancel={() => setConfirmDialog(null)}
          loading={processingId === confirmDialog.request.id}
          isDangerous={confirmDialog.type === "delete"}
        />
      )}

      <ToastList toasts={toasts} remove={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
}