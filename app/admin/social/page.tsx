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
  Link2,
  Mail,
  Phone,
} from "lucide-react";
import { ICON_MAP, SocialLink } from "@/components/global/floating-social";

// ── Types ─────────────────────────────────────────────────────────────────────

type ActionType = "link" | "email" | "phone";

interface SocialLinkWithAction extends SocialLink {
  action_type: ActionType;
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

// Each type shows ONLY its own relevant platforms — no cross-contamination
const PLATFORM_BY_TYPE: Record<ActionType, string[]> = {
  link: [
    "facebook",
    "instagram",
    "twitter",
    "youtube",
    "tiktok",
    "linkedin",
    "pinterest",
    "website",
  ],
  email: ["email"],
  phone: ["whatsapp", "viber", "telegram", "phone", "sms"],
};

const ACTION_TABS: {
  type: ActionType;
  label: string;
  icon: typeof Link2;
  hint: string;
}[] = [
  {
    type: "link",
    label: "Link",
    icon: Link2,
    hint: "A regular URL (social media, website, etc.)",
  },
  {
    type: "email",
    label: "Email",
    icon: Mail,
    hint: "Opens the mail app (Gmail, Outlook, etc.)",
  },
  {
    type: "phone",
    label: "Phone",
    icon: Phone,
    hint: "Opens a call or messaging app (WhatsApp, Viber, etc.)",
  },
];

const DEFAULT_FORM = {
  platform: "facebook",
  action_type: "link" as ActionType,
  raw_value: "",
  gradient_from: "#1877f2",
  gradient_to: "#0d5dc7",
  is_active: true,
};

const inp =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all";
const lbl =
  "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5";

// ── Helpers ───────────────────────────────────────────────────────────────────

function rawFromUrl(url: string, actionType: ActionType): string {
  if (actionType === "email") return url.replace(/^mailto:/i, "");
  if (actionType === "phone") return url.replace(/^tel:/i, "");
  return url;
}

function resolveUrl(actionType: ActionType, raw: string): string {
  const v = raw.trim();
  if (actionType === "email") return `mailto:${v.replace(/^mailto:/i, "")}`;
  if (actionType === "phone") return `tel:${v.replace(/^tel:/i, "")}`;
  return v;
}

// Returns ONLY the platforms relevant to the given action type
function platformsFor(type: ActionType): string[] {
  return PLATFORM_BY_TYPE[type].filter((p) => p in ICON_MAP);
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

// ── Platform Icon Preview ──────────────────────────────────────────────────────

function PlatformPreview({
  platform,
  gradientFrom,
  gradientTo,
}: {
  platform: string;
  gradientFrom: string;
  gradientTo: string;
}) {
  const entry = ICON_MAP[platform] ?? ICON_MAP["website"];
  const IconComp = entry.icon;
  const gradient =
    gradientFrom && gradientTo
      ? `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`
      : entry.defaultGradient;
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow flex-shrink-0"
      style={{ background: gradient }}
    >
      <IconComp className="w-5 h-5" />
    </div>
  );
}

// ── Action Type Tabs ──────────────────────────────────────────────────────────

function ActionTypeTabs({
  value,
  onChange,
}: {
  value: ActionType;
  onChange: (t: ActionType) => void;
}) {
  return (
    <div>
      <label className={lbl}>Type</label>
      <div className="flex gap-2">
        {ACTION_TABS.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-semibold transition-all
              ${
                value === type
                  ? "bg-red-600 border-red-600 text-white shadow-md"
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-1.5">
        {ACTION_TABS.find((t) => t.type === value)?.hint}
      </p>
    </div>
  );
}

// ── URL / Value Field ─────────────────────────────────────────────────────────

function ValueField({
  actionType,
  value,
  onChange,
}: {
  actionType: ActionType;
  value: string;
  onChange: (v: string) => void;
}) {
  if (actionType === "email") {
    return (
      <div>
        <label className={lbl}>Email Address</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="email"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inp + " pl-11"}
            placeholder="you@gmail.com"
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Stored as{" "}
          <code className="bg-slate-100 px-1 rounded">
            mailto:{value || "…"}
          </code>
        </p>
      </div>
    );
  }

  if (actionType === "phone") {
    return (
      <div>
        <label className={lbl}>Phone / Mobile Number</label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="tel"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inp + " pl-11"}
            placeholder="+63 912 345 6789"
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Include country code. Stored as{" "}
          <code className="bg-slate-100 px-1 rounded">tel:{value || "…"}</code>
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className={lbl}>URL</label>
      <div className="relative">
        <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inp + " pl-11"}
          placeholder="https://..."
        />
      </div>
    </div>
  );
}

// ── View Details Modal ────────────────────────────────────────────────────────

function ViewModal({
  link,
  onClose,
}: {
  link: SocialLinkWithAction;
  onClose: () => void;
}) {
  const entry = ICON_MAP[link.platform] ?? ICON_MAP["website"];
  const gradient =
    link.gradient_from && link.gradient_to
      ? `linear-gradient(135deg, ${link.gradient_from}, ${link.gradient_to})`
      : entry.defaultGradient;

  const actionMeta = {
    link: { icon: Link2, label: "Link", cls: "bg-blue-50 text-blue-600" },
    email: { icon: Mail, label: "Email", cls: "bg-violet-50 text-violet-600" },
    phone: {
      icon: Phone,
      label: "Phone",
      cls: "bg-emerald-50 text-emerald-700",
    },
  }[link.action_type ?? "link"];

  const ActionIcon = actionMeta.icon;

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
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow flex-shrink-0"
                style={{ background: gradient }}
              >
                {(() => {
                  const IC = entry.icon;
                  return <IC className="w-5 h-5" />;
                })()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 capitalize">
                  {link.platform}
                </h2>
                <p className="text-xs text-slate-400">Link details</p>
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
          <div className="p-8 space-y-4">
            <div>
              <p className={lbl}>Type</p>
              <span
                className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium ${actionMeta.cls}`}
              >
                <ActionIcon className="w-3.5 h-3.5" />
                {actionMeta.label}
              </span>
            </div>

            <div>
              <p className={lbl}>
                {link.action_type === "email"
                  ? "Email Address"
                  : link.action_type === "phone"
                    ? "Phone Number"
                    : "URL"}
              </p>
              <p className="text-sm font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 break-all">
                {link.url}
              </p>
            </div>

            <div>
              <p className={lbl}>Button Gradient</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <div
                    className="w-6 h-6 rounded-md border border-slate-200 flex-shrink-0"
                    style={{ background: link.gradient_from }}
                  />
                  <span className="text-sm font-mono text-slate-600">
                    {link.gradient_from}
                  </span>
                </div>
                <span className="text-slate-300 text-sm">→</span>
                <div className="flex items-center gap-2 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <div
                    className="w-6 h-6 rounded-md border border-slate-200 flex-shrink-0"
                    style={{ background: link.gradient_to }}
                  />
                  <span className="text-sm font-mono text-slate-600">
                    {link.gradient_to}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className={lbl}>Status</p>
              <span
                className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium ${
                  link.is_active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${link.is_active ? "bg-emerald-500" : "bg-slate-400"}`}
                />
                {link.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Footer */}
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

// ── Add / Edit Modal ───────────────────────────────────────────────────────────

function LinkModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Partial<SocialLinkWithAction>;
  onClose: () => void;
  onSave: (
    data: Omit<SocialLinkWithAction, "id" | "sort_order">,
  ) => Promise<void>;
}) {
  const initActionType: ActionType = initial?.action_type ?? "link";

  const [form, setForm] = useState({
    platform: initial?.platform ?? DEFAULT_FORM.platform,
    action_type: initActionType,
    raw_value: initial?.url
      ? rawFromUrl(initial.url, initActionType)
      : DEFAULT_FORM.raw_value,
    gradient_from: initial?.gradient_from ?? DEFAULT_FORM.gradient_from,
    gradient_to: initial?.gradient_to ?? DEFAULT_FORM.gradient_to,
    is_active: initial?.is_active ?? DEFAULT_FORM.is_active,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleActionTypeChange = (type: ActionType) => {
    const platforms = platformsFor(type);
    const firstPlatform = platforms[0] ?? "website";
    const entry = ICON_MAP[firstPlatform];
    const match = entry?.defaultGradient.match(/#[a-fA-F0-9]{3,8}/g);
    setForm((p) => ({
      ...p,
      action_type: type,
      platform: firstPlatform,
      gradient_from: match?.[0] ?? p.gradient_from,
      gradient_to: match?.[1] ?? p.gradient_to,
      raw_value: "",
    }));
  };

  const handlePlatformChange = (platform: string) => {
    const entry = ICON_MAP[platform];
    const match = entry?.defaultGradient.match(/#[a-fA-F0-9]{3,8}/g);
    setForm((p) => ({
      ...p,
      platform,
      gradient_from: match?.[0] ?? p.gradient_from,
      gradient_to: match?.[1] ?? p.gradient_to,
    }));
  };

  const handleSubmit = async () => {
    if (!form.raw_value.trim()) {
      setError("Value is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSave({
        platform: form.platform,
        action_type: form.action_type,
        label: form.platform.charAt(0).toUpperCase() + form.platform.slice(1),
        url: resolveUrl(form.action_type, form.raw_value),
        gradient_from: form.gradient_from,
        gradient_to: form.gradient_to,
        is_active: form.is_active,
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  const availablePlatforms = platformsFor(form.action_type);

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
              <PlatformPreview
                platform={form.platform}
                gradientFrom={form.gradient_from}
                gradientTo={form.gradient_to}
              />
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {initial?.id ? "Edit Social Link" : "Add Social Link"}
                </h2>
                <p className="text-xs text-slate-400">
                  Configure the link details
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

            <ActionTypeTabs
              value={form.action_type}
              onChange={handleActionTypeChange}
            />

            {/* Only show platform selector if there's more than one option */}
            {availablePlatforms.length > 1 && (
              <div>
                <label className={lbl}>Platform / Icon</label>
                <select
                  value={form.platform}
                  onChange={(e) => handlePlatformChange(e.target.value)}
                  className={inp}
                >
                  {availablePlatforms.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <ValueField
              actionType={form.action_type}
              value={form.raw_value}
              onChange={(v) => setForm((p) => ({ ...p, raw_value: v }))}
            />

            <div>
              <label className={lbl}>Button Gradient</label>
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <p className="text-xs text-slate-400 mb-1">From</p>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50">
                    <input
                      type="color"
                      value={form.gradient_from}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          gradient_from: e.target.value,
                        }))
                      }
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <span className="text-sm text-slate-600 font-mono">
                      {form.gradient_from}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400 mb-1">To</p>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50">
                    <input
                      type="color"
                      value={form.gradient_to}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, gradient_to: e.target.value }))
                      }
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <span className="text-sm text-slate-600 font-mono">
                      {form.gradient_to}
                    </span>
                  </div>
                </div>
                <div className="w-16 flex flex-col items-center gap-1">
                  <p className="text-xs text-slate-400">Preview</p>
                  <PlatformPreview
                    platform={form.platform}
                    gradientFrom={form.gradient_from}
                    gradientTo={form.gradient_to}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">Active</p>
                <p className="text-xs text-slate-400">
                  Show this link on the website
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
                  <Save className="w-4 h-4" /> Save Link
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Confirm Dialog ─────────────────────────────────────────────────────────────

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

// ── Action Type Badge ─────────────────────────────────────────────────────────

function ActionBadge({ type }: { type: ActionType }) {
  const cfg = {
    link: { icon: Link2, label: "Link", cls: "bg-blue-50 text-blue-600" },
    email: { icon: Mail, label: "Email", cls: "bg-violet-50 text-violet-600" },
    phone: {
      icon: Phone,
      label: "Phone",
      cls: "bg-emerald-50 text-emerald-700",
    },
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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SocialLinksAdminPage() {
  const [links, setLinks] = useState<SocialLinkWithAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SocialLinkWithAction | null>(
    null,
  );
  const [viewTarget, setViewTarget] = useState<SocialLinkWithAction | null>(
    null,
  );
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const addToast = (type: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, type, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 5000);
  };
  const removeToast = (id: number) =>
    setToasts((p) => p.filter((t) => t.id !== id));

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/social-links");
      const data = await res.json();
      setLinks(data);
    } catch {
      addToast("error", "Failed to load social links.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleSave = async (
    data: Omit<SocialLinkWithAction, "id" | "sort_order">,
  ) => {
    const isEdit = !!editTarget;
    const url = isEdit
      ? `/api/admin/social-links/${editTarget!.id}`
      : "/api/admin/social-links";
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

    addToast("success", isEdit ? "Social link updated." : "Social link added.");
    fetchLinks();
    setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/social-links/${deleteConfirm}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setLinks((p) => p.filter((l) => l.id !== deleteConfirm));
      addToast("success", "Social link deleted.");
    } catch {
      addToast("error", "Failed to delete social link.");
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm(null);
    }
  };

  const handleReorder = async (id: number, direction: "up" | "down") => {
    const idx = links.findIndex((l) => l.id === id);
    if (
      (direction === "up" && idx === 0) ||
      (direction === "down" && idx === links.length - 1)
    )
      return;

    const newLinks = [...links];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newLinks[idx], newLinks[swapIdx]] = [newLinks[swapIdx], newLinks[idx]];
    const reordered = newLinks.map((l, i) => ({ ...l, sort_order: i + 1 }));
    setLinks(reordered);

    try {
      await fetch("/api/admin/social-links/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: reordered.map((l) => ({ id: l.id, sort_order: l.sort_order })),
        }),
      });
    } catch {
      addToast("error", "Failed to reorder.");
      fetchLinks();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @keyframes modalIn { 0% { opacity:0; transform:scale(0.95); } 100% { opacity:1; transform:scale(1); } }
        @keyframes toastIn { 0% { opacity:0; transform:translateY(-10px); } 100% { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 lg:px-8 py-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Social Links</h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage the floating social widget on your website
            </p>
          </div>
          <button
            onClick={() => {
              setEditTarget(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-red-200"
          >
            <Plus className="w-4 h-4" /> Add Link
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              Supports links, email & phone
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              Add regular URLs, email addresses (Gmail, etc.), or phone numbers
              (WhatsApp, Viber, Telegram, etc.).
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
              <p className="text-slate-600 text-sm">Loading social links…</p>
            </div>
          </div>
        ) : links.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              No social links yet
            </h3>
            <p className="text-slate-500 mb-6">
              Add your first social, email, or phone link
            </p>
            <button
              onClick={() => {
                setEditTarget(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Add First Link
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((link, idx) => {
              const entry = ICON_MAP[link.platform] ?? ICON_MAP["website"];
              const IconComp = entry.icon;
              const gradient =
                link.gradient_from && link.gradient_to
                  ? `linear-gradient(135deg, ${link.gradient_from}, ${link.gradient_to})`
                  : entry.defaultGradient;

              return (
                <div
                  key={link.id}
                  className={`bg-white rounded-2xl border shadow-sm flex items-center gap-4 px-5 py-4 transition-all ${
                    link.is_active
                      ? "border-slate-200"
                      : "border-slate-100 opacity-60"
                  }`}
                >
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => handleReorder(link.id, "up")}
                      disabled={idx === 0}
                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-20 transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReorder(link.id, "down")}
                      disabled={idx === links.length - 1}
                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-20 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: gradient }}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-800 capitalize">
                        {link.platform}
                      </p>
                      <ActionBadge type={link.action_type ?? "link"} />
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5 max-w-xs font-mono">
                      {link.url}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setViewTarget(link)}
                      title="View details"
                      className="p-2 rounded-lg transition-colors text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditTarget(link);
                        setModalOpen(true);
                      }}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(link.id)}
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
        <ViewModal link={viewTarget} onClose={() => setViewTarget(null)} />
      )}

      {modalOpen && (
        <LinkModal
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
          title="Delete Social Link"
          description="This social link will be permanently removed. This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
          loading={deleteLoading}
        />
      )}

      <ToastList toasts={toasts} remove={removeToast} />
    </div>
  );
}
