"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  Trash2,
  Pencil,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  TriangleAlert,
  Plus,
  ImageOff,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type PartnerCategory = "developer" | "bank" | "other";

interface Partner {
  id: number;
  name: string;
  category: PartnerCategory;
  logo: string | null;
  logo_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

// ── Category Config ───────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<
  PartnerCategory,
  { label: string; color: string; bg: string; border: string }
> = {
  bank: {
    label: "Banks",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  developer: {
    label: "Developers",
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
  other: {
    label: "Others",
    color: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-200",
  },
};

// Badge shown in the table row
function CategoryBadge({ category }: { category: PartnerCategory }) {
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.other;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}
    >
      {cfg.label.replace(/s$/, "")}{" "}
      {/* "Banks" → "Bank", "Developers" → "Developer" */}
    </span>
  );
}

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
            ${
              t.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
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

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
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
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <TriangleAlert className="w-5 h-5 text-red-500" />
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
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Deleting..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Partner Form Modal ────────────────────────────────────────────────────────
function PartnerFormModal({
  partner,
  onClose,
  onSaved,
}: {
  partner: Partner | null;
  onClose: () => void;
  onSaved: (p: Partner) => void;
}) {
  const [name, setName] = useState(partner?.name ?? "");
  const [category, setCategory] = useState<PartnerCategory>(
    partner?.category ?? "developer",
  );
  const [isActive, setIsActive] = useState(partner?.is_active ?? true);
  const [preview, setPreview] = useState<string | null>(
    partner?.logo_url ?? null,
  );
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const isEdit = !!partner;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    setErrors({});
    if (!name.trim()) {
      setErrors({ name: "Name is required." });
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("category", category);
      fd.append("is_active", isActive ? "1" : "0");
      if (file) fd.append("logo", file);
      if (isEdit) fd.append("_method", "PUT");

      const url = isEdit
        ? `/api/admin/partners/${partner.id}`
        : `/api/admin/partners`;

      const res = await fetch(url, { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(
            data.errors as Record<string, string[]>,
          )) {
            mapped[k] = v[0];
          }
          setErrors(mapped);
        } else {
          setErrors({ general: data.message ?? "Something went wrong." });
        }
        return;
      }

      onSaved(data.data);
    } catch {
      setErrors({ general: "Failed to connect to the server." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 flex flex-col gap-6"
          style={{ animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">
              {isEdit ? "Edit Partner" : "Add Partner"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* General error */}
          {errors.general && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {errors.general}
            </p>
          )}

          {/* Logo upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Logo / Image
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="relative cursor-pointer group rounded-2xl border-2 border-dashed border-slate-200 hover:border-red-400 transition-colors overflow-hidden bg-slate-50 flex items-center justify-center"
              style={{ height: 160 }}
            >
              {preview ? (
                <>
                  <img
                    src={preview}
                    alt="preview"
                    className="max-h-full max-w-full object-contain p-4"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-sm font-semibold">
                      Change image
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <ImageOff className="w-8 h-8" />
                  <p className="text-sm">Click to upload</p>
                  <p className="text-xs">PNG, JPG, SVG, WebP — max 2 MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
            {errors.logo && (
              <p className="text-xs text-red-500 mt-1">{errors.logo}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Partner Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. BDO Unibank"
              className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all
                ${
                  errors.name
                    ? "border-red-400 focus:ring-red-100"
                    : "border-slate-200 focus:border-red-400 focus:ring-red-100"
                }`}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(CATEGORY_CONFIG) as PartnerCategory[]).map(
                (cat) => {
                  const cfg = CATEGORY_CONFIG[cat];
                  const selected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all
                      ${
                        selected
                          ? `${cfg.bg} ${cfg.color} ${cfg.border} ring-2 ring-offset-1 ${cat === "bank" ? "ring-blue-300" : cat === "developer" ? "ring-violet-300" : "ring-slate-300"}`
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {cfg.label.replace(/s$/, "")}
                    </button>
                  );
                },
              )}
            </div>
            {errors.category && (
              <p className="text-xs text-red-500 mt-1">{errors.category}</p>
            )}
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Active</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Visible on the public site when active
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-100
                ${isActive ? "bg-emerald-500" : "bg-slate-300"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                  ${isActive ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-1">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Partner"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Category Section ──────────────────────────────────────────────────────────
function CategorySection({
  category,
  partners,
  togglingId,
  onEdit,
  onDelete,
  onToggle,
}: {
  category: PartnerCategory;
  partners: Partner[];
  togglingId: number | null;
  onEdit: (p: Partner) => void;
  onDelete: (p: Partner) => void;
  onToggle: (p: Partner) => void;
}) {
  const cfg = CATEGORY_CONFIG[category];

  return (
    <div className="mb-2">
      {/* Section header */}
      <div
        className={`flex items-center gap-3 px-6 py-3 ${cfg.bg} border-b ${cfg.border}`}
      >
        <span
          className={`text-xs font-bold uppercase tracking-widest ${cfg.color}`}
        >
          {cfg.label}
        </span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}
        >
          {partners.length}
        </span>
      </div>

      {/* Rows */}
      <tbody
        className="divide-y divide-slate-100 block w-full"
        style={{ display: "table-row-group" }}
      >
        {partners.map((partner) => (
          <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
            {/* Logo */}
            <td className="px-6 py-4">
              <div className="w-12 h-12 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                {partner.logo_url ? (
                  <img
                    src={partner.logo_url}
                    alt={partner.name}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <ImageOff className="w-5 h-5 text-slate-300" />
                )}
              </div>
            </td>

            {/* Name */}
            <td className="px-6 py-4">
              <p className="font-semibold text-slate-900">{partner.name}</p>
            </td>

            {/* Category badge */}
            <td className="px-6 py-4">
              <CategoryBadge category={partner.category} />
            </td>

            {/* Status — clickable toggle */}
            <td className="px-6 py-4">
              <button
                onClick={() => onToggle(partner)}
                disabled={togglingId === partner.id}
                title={
                  partner.is_active
                    ? "Click to deactivate"
                    : "Click to activate"
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all
                  disabled:opacity-60 disabled:cursor-not-allowed
                  ${
                    partner.is_active
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
              >
                {togglingId === partner.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : partner.is_active ? (
                  <ToggleRight className="w-3.5 h-3.5" />
                ) : (
                  <ToggleLeft className="w-3.5 h-3.5" />
                )}
                {partner.is_active ? "Active" : "Inactive"}
              </button>
            </td>

            {/* Actions */}
            <td className="px-6 py-4">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => onEdit(partner)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-800"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(partner)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500 hover:text-red-700"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PartnersAdminPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filtered, setFiltered] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formModal, setFormModal] = useState<Partner | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    fetchPartners();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q ? partners.filter((p) => p.name.toLowerCase().includes(q)) : partners,
    );
  }, [search, partners]);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/partners");
      const data = await res.json();
      if (data.success) setPartners(data.data ?? []);
    } catch {
      addToast("Failed to load partners", "error");
    } finally {
      setLoading(false);
    }
  };

  const addToast = (message: string, type: "success" | "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  };

  const handleSaved = (saved: Partner) => {
    setPartners((prev) => {
      const exists = prev.find((p) => p.id === saved.id);
      return exists
        ? prev.map((p) => (p.id === saved.id ? saved : p))
        : [saved, ...prev];
    });
    addToast(
      formModal === "new" ? "Partner added!" : "Partner updated!",
      "success",
    );
    setFormModal(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/partners/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setPartners((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        addToast("Partner deleted", "success");
        setDeleteTarget(null);
      } else {
        addToast(data.message ?? "Failed to delete", "error");
      }
    } catch {
      addToast("Error deleting partner", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (partner: Partner) => {
    setTogglingId(partner.id);
    try {
      const res = await fetch(`/api/admin/partners/${partner.id}/toggle`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setPartners((prev) =>
          prev.map((p) => (p.id === partner.id ? data.data : p)),
        );
        addToast(
          data.data.is_active
            ? `${partner.name} is now active`
            : `${partner.name} set to inactive`,
          "success",
        );
      } else {
        addToast(data.message ?? "Failed to update status", "error");
      }
    } catch {
      addToast("Error updating status", "error");
    } finally {
      setTogglingId(null);
    }
  };

  // Group filtered partners by category, in a fixed order
  const CATEGORY_ORDER: PartnerCategory[] = ["bank", "developer", "other"];
  const grouped = CATEGORY_ORDER.reduce(
    (acc, cat) => {
      acc[cat] = filtered.filter((p) => p.category === cat);
      return acc;
    },
    {} as Record<PartnerCategory, Partner[]>,
  );

  // Only render sections that have at least one partner (or all if searching)
  const visibleCategories = CATEGORY_ORDER.filter(
    (cat) => grouped[cat].length > 0,
  );

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

      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-1">Partners</h1>
            <p className="text-slate-500">
              {partners.length} partner{partners.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setFormModal("new")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Partner
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search partners..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <AlertCircle className="w-10 h-10 mb-3 opacity-40" />
              <p className="font-medium">No partners found</p>
              {search && (
                <p className="text-sm mt-1">Try a different search term</p>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Logo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              {visibleCategories.map((cat) => (
                <tbody key={cat} className="divide-y divide-slate-100">
                  {/* Category section header row */}
                  <tr>
                    <td
                      colSpan={5}
                      className={`px-6 py-2.5 ${CATEGORY_CONFIG[cat].bg} border-y ${CATEGORY_CONFIG[cat].border}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold uppercase tracking-widest ${CATEGORY_CONFIG[cat].color}`}
                        >
                          {CATEGORY_CONFIG[cat].label}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_CONFIG[cat].bg} ${CATEGORY_CONFIG[cat].color} ${CATEGORY_CONFIG[cat].border}`}
                        >
                          {grouped[cat].length}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {grouped[cat].map((partner) => (
                    <tr
                      key={partner.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {/* Logo */}
                      <td className="px-6 py-4">
                        <div className="w-12 h-12 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {partner.logo_url ? (
                            <img
                              src={partner.logo_url}
                              alt={partner.name}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <ImageOff className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {partner.name}
                        </p>
                      </td>

                      {/* Category badge */}
                      <td className="px-6 py-4">
                        <CategoryBadge category={partner.category} />
                      </td>

                      {/* Status — clickable toggle */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggle(partner)}
                          disabled={togglingId === partner.id}
                          title={
                            partner.is_active
                              ? "Click to deactivate"
                              : "Click to activate"
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all
                            disabled:opacity-60 disabled:cursor-not-allowed
                            ${
                              partner.is_active
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                        >
                          {togglingId === partner.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : partner.is_active ? (
                            <ToggleRight className="w-3.5 h-3.5" />
                          ) : (
                            <ToggleLeft className="w-3.5 h-3.5" />
                          )}
                          {partner.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setFormModal(partner)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-800"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(partner)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          )}
        </div>
      </div>

      {formModal !== null && (
        <PartnerFormModal
          partner={formModal === "new" ? null : formModal}
          onClose={() => setFormModal(null)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Partner?"
          description={`"${deleteTarget.name}" will be permanently removed. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      <ToastList
        toasts={toasts}
        remove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}
