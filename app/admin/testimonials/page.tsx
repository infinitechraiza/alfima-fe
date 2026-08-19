"use client";

import { useEffect, useState, useRef } from "react";
import {
  Search, Trash2, Eye, X, CheckCircle, AlertCircle, Loader2,
  Check, Ban, TriangleAlert, Play, Video, VideoOff,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Service {
  id:     number;
  label?: string;
  name?:  string;
}

interface Testimonial {
  id:          number;
  full_name:   string;
  message:     string;
  video_url:   string | null;
  is_approved: boolean;
  created_at:  string;
  service_id:  number | null;
  service?:    Service | null;
}

interface Toast {
  id:      number;
  type:    "success" | "error";
  message: string;
}

function getServiceLabel(service: Service): string {
  return service.label ?? service.name ?? `Service #${service.id}`;
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
  const bgColor   = isDangerous ? "bg-red-50"   : "bg-blue-50";
  const iconColor = isDangerous ? "text-red-500" : "text-blue-500";
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

// ── Video Player ──────────────────────────────────────────────────────────────
function InlineVideoPlayer({ src }: { src: string }) {
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  const toggle = () => {
    if (!ref.current) return;
    if (playing) { ref.current.pause(); setPlaying(false); }
    else          { ref.current.play();  setPlaying(true);  }
  };

  return (
    <div className="relative rounded-xl overflow-hidden bg-black aspect-video cursor-pointer" onClick={toggle}>
      <video ref={ref} src={src} className="w-full h-full object-contain"
        onEnded={() => setPlaying(false)} playsInline />
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-slate-800 ml-0.5" fill="currentColor" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── View Modal ────────────────────────────────────────────────────────────────
function TestimonialViewModal({
  testimonial, onClose,
}: {
  testimonial: Testimonial | null; onClose: () => void;
}) {
  if (!testimonial) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]" onClick={onClose} />
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
          style={{ animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{testimonial.full_name}</h2>
              {testimonial.service && (
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-medium">
                  {getServiceLabel(testimonial.service)}
                </span>
              )}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Video */}
          {testimonial.video_url && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Video Testimonial
              </p>
              <InlineVideoPlayer src={testimonial.video_url} />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Message</p>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{testimonial.message}</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</p>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${
                  testimonial.is_approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  <span className={`w-2 h-2 rounded-full ${testimonial.is_approved ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {testimonial.is_approved ? "Approved" : "Pending"}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Submitted</p>
                <p className="text-sm text-slate-700">
                  {new Date(testimonial.created_at).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors">
            Close
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TestimonialsAdminPage() {
  const [testimonials,         setTestimonials]         = useState<Testimonial[]>([]);
  const [filteredTestimonials, setFilteredTestimonials] = useState<Testimonial[]>([]);
  const [services,             setServices]             = useState<Service[]>([]);
  const [loading,              setLoading]              = useState(true);
  const [searchQuery,          setSearchQuery]          = useState("");
  const [filterStatus,         setFilterStatus]         = useState<"all" | "approved" | "pending">("all");
  const [filterVideo,          setFilterVideo]          = useState<"all" | "with" | "without">("all");
  const [filterService,        setFilterService]        = useState<string>("all");
  const [viewModal,            setViewModal]            = useState<Testimonial | null>(null);
  const [confirmDialog,        setConfirmDialog]        = useState<{
    type: "approve" | "reject" | "delete"; testimonial: Testimonial | null;
  } | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [toasts,       setToasts]       = useState<Toast[]>([]);

  useEffect(() => {
    fetchTestimonials();
    fetchServices();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/testimonials");
      const data     = await response.json();
      if (data.success) setTestimonials(data.data || []);
    } catch {
      addToast("Failed to load testimonials", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const res  = await fetch("/api/services?all=1");
      const data = await res.json();
      const list: Service[] =
        Array.isArray(data)      ? data      :
        Array.isArray(data.data) ? data.data :
        [];
      setServices(list);
    } catch {
      // non-critical — filters just won't show service names
    }
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let filtered = testimonials;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) => t.full_name.toLowerCase().includes(q) || t.message.toLowerCase().includes(q)
      );
    }
    if (filterStatus  === "approved") filtered = filtered.filter((t) =>  t.is_approved);
    if (filterStatus  === "pending")  filtered = filtered.filter((t) => !t.is_approved);
    if (filterVideo   === "with")     filtered = filtered.filter((t) =>  !!t.video_url);
    if (filterVideo   === "without")  filtered = filtered.filter((t) => !t.video_url);
    if (filterService !== "all")      filtered = filtered.filter((t) =>
      String(t.service_id) === filterService
    );

    setFilteredTestimonials(filtered);
  }, [searchQuery, filterStatus, filterVideo, filterService, testimonials]);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const addToast = (message: string, type: "success" | "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleApprove = async (testimonial: Testimonial) => {
    setProcessingId(testimonial.id);
    try {
      const res  = await fetch(`/api/admin/testimonials/${testimonial.id}/approve`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setTestimonials((prev) => prev.map((t) => t.id === testimonial.id ? { ...t, is_approved: true } : t));
        addToast("Testimonial approved!", "success");
        setConfirmDialog(null);
      } else { addToast(data.message || "Failed to approve", "error"); }
    } catch { addToast("Error approving testimonial", "error"); }
    finally  { setProcessingId(null); }
  };

  const handleReject = async (testimonial: Testimonial) => {
    setProcessingId(testimonial.id);
    try {
      const res  = await fetch(`/api/admin/testimonials/${testimonial.id}/reject`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setTestimonials((prev) => prev.map((t) => t.id === testimonial.id ? { ...t, is_approved: false } : t));
        addToast("Testimonial rejected", "success");
        setConfirmDialog(null);
      } else { addToast(data.message || "Failed to reject", "error"); }
    } catch { addToast("Error rejecting testimonial", "error"); }
    finally  { setProcessingId(null); }
  };

  const handleDelete = async (testimonial: Testimonial) => {
    setProcessingId(testimonial.id);
    try {
      const res  = await fetch(`/api/admin/testimonials/${testimonial.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setTestimonials((prev) => prev.filter((t) => t.id !== testimonial.id));
        addToast("Testimonial deleted", "success");
        setConfirmDialog(null);
      } else { addToast(data.message || "Failed to delete", "error"); }
    } catch { addToast("Error deleting testimonial", "error"); }
    finally  { setProcessingId(null); }
  };

  const inp = "bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all";

  const withVideo = testimonials.filter((t) => !!t.video_url).length;

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
            <h1 className="text-4xl font-bold text-slate-800 mb-1">Testimonials</h1>
            <p className="text-slate-500">
              {testimonials.length} total testimonial{testimonials.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={fetchTestimonials}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition-colors flex items-center gap-2">
            ↻ Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="rounded-2xl border border-slate-200 p-5 bg-white">
            <p className="text-2xl font-bold text-slate-800">{testimonials.length}</p>
            <p className="text-slate-500 text-sm mt-0.5">Total</p>
          </div>
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
            <p className="text-2xl font-bold text-yellow-700">{testimonials.filter((t) => !t.is_approved).length}</p>
            <p className="text-yellow-600 text-sm mt-0.5">Pending</p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-2xl font-bold text-blue-700">{testimonials.filter((t) => t.is_approved).length}</p>
            <p className="text-blue-600 text-sm mt-0.5">Approved</p>
          </div>
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
            <p className="text-2xl font-bold text-purple-700">{withVideo}</p>
            <p className="text-purple-600 text-sm mt-0.5">With Video</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-2xl font-bold text-slate-700">
              {Math.round((testimonials.filter((t) => t.is_approved).length / Math.max(testimonials.length, 1)) * 100)}%
            </p>
            <p className="text-slate-500 text-sm mt-0.5">Approval Rate</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search by name or message..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className={`${inp} w-full pl-10`} />
            </div>
            <select value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as "all" | "approved" | "pending")}
              className={inp}>
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
            <select value={filterVideo}
              onChange={(e) => setFilterVideo(e.target.value as "all" | "with" | "without")}
              className={inp}>
              <option value="all">All Types</option>
              <option value="with">With Video</option>
              <option value="without">Text Only</option>
            </select>
            {/* Service filter — only shows if services loaded */}
            {services.length > 0 && (
              <select value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className={inp}>
                <option value="all">All Services</option>
                <option value="none">No Service</option>
                {services.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {getServiceLabel(s)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          ) : filteredTestimonials.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-slate-500">
              <AlertCircle className="w-12 h-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">No testimonials found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Message</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Video</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTestimonials.map((testimonial) => (
                    <tr key={testimonial.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{testimonial.full_name}</p>
                      </td>

                      {/* Service column */}
                      <td className="px-6 py-4">
                        {testimonial.service ? (
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-medium whitespace-nowrap">
                            {getServiceLabel(testimonial.service)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-slate-600 text-sm line-clamp-2">{testimonial.message}</p>
                      </td>

                      <td className="px-6 py-4">
                        {testimonial.video_url ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs font-medium">
                            <Video className="w-3.5 h-3.5" />
                            Video
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-400 text-xs font-medium">
                            <VideoOff className="w-3.5 h-3.5" />
                            None
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium ${
                          testimonial.is_approved
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"}`}>
                          <span className={`w-2 h-2 rounded-full ${testimonial.is_approved ? "bg-blue-500" : "bg-yellow-500"}`} />
                          {testimonial.is_approved ? "Approved" : "Pending"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-600 text-sm">
                        {new Date(testimonial.created_at).toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setViewModal(testimonial)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                            title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          {!testimonial.is_approved && (
                            <button
                              onClick={() => setConfirmDialog({ type: "approve", testimonial })}
                              disabled={processingId === testimonial.id}
                              className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600 hover:text-blue-700 disabled:opacity-50"
                              title="Approve">
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {testimonial.is_approved && (
                            <button
                              onClick={() => setConfirmDialog({ type: "reject", testimonial })}
                              disabled={processingId === testimonial.id}
                              className="p-2 hover:bg-yellow-100 rounded-lg transition-colors text-yellow-600 hover:text-yellow-700 disabled:opacity-50"
                              title="Reject">
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmDialog({ type: "delete", testimonial })}
                            disabled={processingId === testimonial.id}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600 hover:text-red-700 disabled:opacity-50"
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

      <TestimonialViewModal testimonial={viewModal} onClose={() => setViewModal(null)} />

      {confirmDialog && (
        <ConfirmDialog
          title={
            confirmDialog.type === "approve" ? "Approve Testimonial?"
            : confirmDialog.type === "reject" ? "Reject Testimonial?"
            : "Delete Testimonial?"
          }
          description={
            confirmDialog.type === "approve" ? "This testimonial will be visible on your website."
            : confirmDialog.type === "reject" ? "This testimonial will be unpublished from your website."
            : "This action cannot be undone."
          }
          confirmLabel={
            confirmDialog.type === "approve" ? "Approve"
            : confirmDialog.type === "reject" ? "Reject"
            : "Delete"
          }
          onConfirm={() => {
            if (confirmDialog.type === "approve") handleApprove(confirmDialog.testimonial!);
            else if (confirmDialog.type === "reject") handleReject(confirmDialog.testimonial!);
            else handleDelete(confirmDialog.testimonial!);
          }}
          onCancel={() => setConfirmDialog(null)}
          loading={processingId === confirmDialog.testimonial?.id}
          isDangerous={confirmDialog.type === "delete"}
        />
      )}

      <ToastList toasts={toasts} remove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}