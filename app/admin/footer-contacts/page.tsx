// app/admin/footer-contacts/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  ChevronUp,
  ChevronDown,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

type ContactType = "address" | "phone" | "email";

interface FooterContact {
  id: number;
  type: ContactType;
  value: string;
  href: string | null;
  is_active: boolean;
  sort_order: number;
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

const TYPE_CONFIG: Record<
  ContactType,
  {
    icon: typeof MapPin;
    label: string;
    placeholder: string;
    hrefPlaceholder: string;
    hrefHint: string;
  }
> = {
  address: {
    icon: MapPin,
    label: "Address",
    placeholder: "10th Floor IBP Tower, Jade Drive, Pasig",
    hrefPlaceholder: "https://maps.google.com/?q=...",
    hrefHint: "Google Maps URL (optional)",
  },
  phone: {
    icon: Phone,
    label: "Phone",
    placeholder: "0917 174 2419",
    hrefPlaceholder: "tel:+639171742419",
    hrefHint: "tel: link (e.g. tel:+639171742419)",
  },
  email: {
    icon: Mail,
    label: "Email",
    placeholder: "info@alfimarealtyinc.com",
    hrefPlaceholder: "mailto:info@alfimarealtyinc.com",
    hrefHint: "mailto: link (e.g. mailto:info@example.com)",
  },
};

const inp =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all";
const lbl =
  "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5";

// ── Toast ─────────────────────────────────────────────────────────────────────
function ToastList({
  toasts,
  remove,
}: {
  toasts: Toast[];
  remove: (id: number) => void;
}) {
  return (
    <div className="fixed top-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium
            ${t.type === "success" ? "bg-emerald-950 border-emerald-700/40 text-emerald-300" : "bg-red-950 border-red-700/40 text-red-300"}`}
          style={{ animation: "toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          {t.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {t.message}
          <button
            onClick={() => remove(t.id)}
            className="ml-1 opacity-50 hover:opacity-100"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Type Badge ────────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: ContactType }) {
  const cfg = {
    address: {
      icon: MapPin,
      label: "Address",
      cls: "bg-blue-50 text-blue-600",
    },
    phone: {
      icon: Phone,
      label: "Phone",
      cls: "bg-emerald-50 text-emerald-700",
    },
    email: { icon: Mail, label: "Email", cls: "bg-violet-50 text-violet-600" },
  }[type];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({
  title,
  description,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
        onClick={onCancel}
      />
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4"
          style={{ animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-50">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-slate-800 font-bold text-base">{title}</h3>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2 bg-red-600 hover:bg-red-700"
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

// ── View Modal ────────────────────────────────────────────────────────────────
function ViewModal({
  contact,
  onClose,
}: {
  contact: FooterContact;
  onClose: () => void;
}) {
  const cfg = TYPE_CONFIG[contact.type];
  const Icon = cfg.icon;
  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
          style={{ animation: "modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50">
                <Icon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {cfg.label}
                </h2>
                <p className="text-xs text-slate-400">Contact details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <div className="p-8 space-y-4">
            <div>
              <p className={lbl}>Type</p>
              <TypeBadge type={contact.type} />
            </div>
            <div>
              <p className={lbl}>Display Value</p>
              <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                {contact.value}
              </p>
            </div>
            {contact.href && (
              <div>
                <p className={lbl}>Link / HREF</p>
                <p className="text-sm font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 break-all">
                  {contact.href}
                </p>
              </div>
            )}
            <div>
              <p className={lbl}>Status</p>
              <span
                className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium ${contact.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${contact.is_active ? "bg-emerald-500" : "bg-slate-400"}`}
                />
                {contact.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <div className="flex justify-end px-8 py-4 border-t border-slate-100 bg-slate-50">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
function ContactModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Partial<FooterContact>;
  onClose: () => void;
  onSave: (data: Omit<FooterContact, "id" | "sort_order">) => Promise<void>;
}) {
  const [form, setForm] = useState({
    type: (initial?.type ?? "phone") as ContactType,
    value: initial?.value ?? "",
    href: initial?.href ?? "",
    is_active: initial?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cfg = TYPE_CONFIG[form.type];
  const Icon = cfg.icon;

  const handleSubmit = async () => {
    if (!form.value.trim()) {
      setError("Display value is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSave({
        type: form.type,
        value: form.value.trim(),
        href: form.href.trim() || null,
        is_active: form.is_active,
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden"
          style={{ animation: "modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50">
                <Icon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {initial?.id ? "Edit Contact" : "Add Contact"}
                </h2>
                <p className="text-xs text-slate-400">
                  Configure contact details
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 space-y-5">
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Type selector */}
            <div>
              <label className={lbl}>Contact Type</label>
              <div className="flex gap-2">
                {(["address", "phone", "email"] as ContactType[]).map((t) => {
                  const TIcon = TYPE_CONFIG[t].icon;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, type: t }))}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-semibold transition-all
                        ${form.type === t ? "bg-red-600 border-red-600 text-white shadow-md" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"}`}
                    >
                      <TIcon className="w-3.5 h-3.5" />
                      {TYPE_CONFIG[t].label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Display value */}
            <div>
              <label className={lbl}>Display Value</label>
              <input
                type="text"
                value={form.value}
                onChange={(e) =>
                  setForm((p) => ({ ...p, value: e.target.value }))
                }
                className={inp}
                placeholder={cfg.placeholder}
              />
              <p className="text-xs text-slate-400 mt-1">
                This is what visitors will see in the footer.
              </p>
            </div>

            {/* HREF */}
            <div>
              <label className={lbl}>
                Link (href){" "}
                <span className="normal-case text-slate-400 font-normal">
                  — optional
                </span>
              </label>
              <input
                type="text"
                value={form.href}
                onChange={(e) =>
                  setForm((p) => ({ ...p, href: e.target.value }))
                }
                className={inp}
                placeholder={cfg.hrefPlaceholder}
              />
              <p className="text-xs text-slate-400 mt-1">{cfg.hrefHint}</p>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">Active</p>
                <p className="text-xs text-slate-400">
                  Show this contact in the footer
                </p>
              </div>
              <button
                onClick={() =>
                  setForm((p) => ({ ...p, is_active: !p.is_active }))
                }
                className={`relative w-12 h-6 rounded-full transition-colors ${form.is_active ? "bg-emerald-500" : "bg-slate-300"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? "translate-x-6" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-8 py-4 border-t border-slate-100 bg-slate-50">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-red-200"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? (
                "Saving…"
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Contact
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FooterContactsAdminPage() {
  const [contacts, setContacts] = useState<FooterContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FooterContact | null>(null);
  const [viewTarget, setViewTarget] = useState<FooterContact | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const addToast = (type: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, type, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 5000);
  };
  const removeToast = (id: number) =>
    setToasts((p) => p.filter((t) => t.id !== id));

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/footer-contacts");
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch {
      addToast("error", "Failed to load contacts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleSave = async (data: Omit<FooterContact, "id" | "sort_order">) => {
    const isEdit = !!editTarget;
    const url = isEdit
      ? `/api/admin/footer-contacts/${editTarget!.id}`
      : "/api/admin/footer-contacts";
    const method = isEdit ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Failed to save.");
    }
    addToast("success", isEdit ? "Contact updated." : "Contact added.");
    fetchContacts();
    setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/footer-contacts/${deleteConfirm}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setContacts((p) => p.filter((c) => c.id !== deleteConfirm));
      addToast("success", "Contact deleted.");
    } catch {
      addToast("error", "Failed to delete contact.");
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm(null);
    }
  };

  const handleReorder = async (id: number, direction: "up" | "down") => {
    const idx = contacts.findIndex((c) => c.id === id);
    if (
      (direction === "up" && idx === 0) ||
      (direction === "down" && idx === contacts.length - 1)
    )
      return;
    const newContacts = [...contacts];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newContacts[idx], newContacts[swapIdx]] = [
      newContacts[swapIdx],
      newContacts[idx],
    ];
    const reordered = newContacts.map((c, i) => ({ ...c, sort_order: i + 1 }));
    setContacts(reordered);
    try {
      await fetch("/api/admin/footer-contacts/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: reordered.map((c) => ({ id: c.id, sort_order: c.sort_order })),
        }),
      });
    } catch {
      addToast("error", "Failed to reorder.");
      fetchContacts();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @keyframes modalIn { 0%{opacity:0;transform:scale(0.95)} 100%{opacity:1;transform:scale(1)} }
        @keyframes toastIn { 0%{opacity:0;transform:translateY(-10px)} 100%{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 lg:px-8 py-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">
              Footer Contacts
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage address, phone, and email shown in the footer
            </p>
          </div>
          <button
            onClick={() => {
              setEditTarget(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-red-200"
          >
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
              <p className="text-slate-600 text-sm">Loading contacts…</p>
            </div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Phone className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              No contacts yet
            </h3>
            <p className="text-slate-500 mb-6">
              Add your first address, phone, or email contact
            </p>
            <button
              onClick={() => {
                setEditTarget(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Add First Contact
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact, idx) => {
              const Icon = TYPE_CONFIG[contact.type].icon;
              return (
                <div
                  key={contact.id}
                  className={`bg-white rounded-2xl border shadow-sm flex items-center gap-4 px-5 py-4 transition-all ${contact.is_active ? "border-slate-200" : "border-slate-100 opacity-60"}`}
                >
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => handleReorder(contact.id, "up")}
                      disabled={idx === 0}
                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-20 transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReorder(contact.id, "down")}
                      disabled={idx === contacts.length - 1}
                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-20 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Icon */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-50 flex-shrink-0">
                    <Icon className="w-5 h-5 text-red-600" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-800">
                        {contact.value}
                      </p>
                      <TypeBadge type={contact.type} />
                    </div>
                    {contact.href && (
                      <p className="text-xs text-slate-400 truncate mt-0.5 max-w-xs font-mono">
                        {contact.href}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setViewTarget(contact)}
                      title="View details"
                      className="p-2 rounded-lg transition-colors text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditTarget(contact);
                        setModalOpen(true);
                      }}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(contact.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {viewTarget && (
        <ViewModal contact={viewTarget} onClose={() => setViewTarget(null)} />
      )}
      {modalOpen && (
        <ContactModal
          initial={editTarget ?? undefined}
          onClose={() => {
            setModalOpen(false);
            setEditTarget(null);
          }}
          onSave={handleSave}
        />
      )}
      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Contact"
          description="This contact will be permanently removed from the footer."
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
          loading={deleteLoading}
        />
      )}
      <ToastList toasts={toasts} remove={removeToast} />
    </div>
  );
}
