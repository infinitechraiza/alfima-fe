"use client";

import { useEffect, useRef, useState } from "react";
import {
  Save,
  Plus,
  Trash2,
  Loader2,
  Eye,
  Target,
  Flag,
  Compass,
  Shield,
  Star,
  Users,
  TrendingUp,
  MapPin,
  CheckCircle,
  Home,
  Zap,
  Building2,
  Award,
  Upload,
} from "lucide-react";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

interface PageSettings {
  hero_headline: string;
  hero_description: string;
  hero_image?: string;
  who_we_are_heading: string;
  who_we_are_body_1: string;
  who_we_are_body_2: string;
  who_we_are_body_3: string;
  vision: string;
  mission: string;
  goals: string;
  objectives: string;
}

interface ValueItem {
  id?: number;
  icon: string;
  title: string;
  description: string;
  sort_order: number;
  _dirty?: boolean;
  _new?: boolean;
}

interface WhyItem {
  id?: number;
  icon: string;
  number: string;
  title: string;
  description: string;
  accent_color: string;
  sort_order: number;
  _dirty?: boolean;
  _new?: boolean;
}

const ICON_CHOICES = [
  { value: "Shield", label: "🛡️  Trust / Security" },
  { value: "Star", label: "⭐  Excellence / Quality" },
  { value: "Users", label: "👥  Team / Community" },
  { value: "TrendingUp", label: "📈  Growth / Progress" },
  { value: "MapPin", label: "📍  Location / Local" },
  { value: "CheckCircle", label: "✅  Verified / Complete" },
  { value: "Home", label: "🏠  Home / Property" },
  { value: "Zap", label: "⚡  Speed / Energy" },
  { value: "Building2", label: "🏢  Business / Company" },
  { value: "Award", label: "🏆  Award / Achievement" },
];

const ICON_COMPONENTS: Record<string, React.ReactNode> = {
  Shield: <Shield className="w-4 h-4" />,
  Star: <Star className="w-4 h-4" />,
  Users: <Users className="w-4 h-4" />,
  TrendingUp: <TrendingUp className="w-4 h-4" />,
  MapPin: <MapPin className="w-4 h-4" />,
  CheckCircle: <CheckCircle className="w-4 h-4" />,
  Home: <Home className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  Building2: <Building2 className="w-4 h-4" />,
  Award: <Award className="w-4 h-4" />,
};

const TABS = [
  { key: "intro", label: "Introduction", emoji: "🏠" },
  { key: "whoweare", label: "Who We Are", emoji: "🏢" },
  { key: "vmgo", label: "VMGO", emoji: "🎯" },
  { key: "values", label: "Core Values", emoji: "💎" },
  { key: "why", label: "Why Choose Us", emoji: "✅" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function showToast(msg: string, type: "success" | "error" = "success") {
  const el = document.createElement("div");
  el.className = [
    "fixed bottom-6 right-6 z-[9999] flex items-center gap-3",
    "px-5 py-3.5 rounded-xl text-sm font-semibold shadow-lg text-white transition-opacity duration-300",
    type === "error" ? "bg-red-500" : "bg-gray-900",
  ].join(" ");
  el.innerHTML =
    type === "error"
      ? `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${msg}`
      : `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>${msg}`;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

async function apiFetch(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.message ?? data?.error ?? "Something went wrong.");
  return data;
}

const inputCls =
  "w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-50 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-all";

function Field({
  label,
  hint,
  value,
  onChange,
  textarea = false,
  rows = 3,
  placeholder = "",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
      </label>
      {hint && (
        <p className="text-gray-400 text-xs mb-2 leading-relaxed">{hint}</p>
      )}
      {textarea ? (
        <textarea
          rows={rows}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} resize-none`}
        />
      ) : (
        <input
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      )}
    </div>
  );
}

function IconSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        Icon
      </label>
      <p className="text-gray-400 text-xs mb-2">
        Choose an icon that matches the idea
      </p>
      <div className="relative">
        <select
          value={value ?? "Star"}
          onChange={(e) => onChange(e.target.value)}
          style={{ WebkitAppearance: "none", MozAppearance: "none" }}
          className="w-full appearance-none bg-white border border-gray-200 hover:border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-50 focus:outline-none rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-900 transition-all cursor-pointer"
        >
          {ICON_CHOICES.map(({ value: v, label }) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
      <div className="mt-2 inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
        <span className="text-red-500">
          {ICON_COMPONENTS[value] ?? ICON_COMPONENTS["Star"]}
        </span>
        <span className="text-gray-400 text-xs">Preview</span>
      </div>
    </div>
  );
}

function SaveBtn({
  onClick,
  saving,
  label = "Save Changes",
}: {
  onClick: () => void;
  saving: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 shadow-sm"
    >
      {saving ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Save className="w-4 h-4" />
      )}
      {saving ? "Saving…" : label}
    </button>
  );
}

export default function AdminAboutPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("intro");
  const [savingPage, setSavingPage] = useState(false);
  const [savingValues, setSavingValues] = useState(false);
  const [savingWhy, setSavingWhy] = useState(false);

  const [pg, setPg] = useState<PageSettings>({
    hero_headline: "",
    hero_description: "",
    hero_image: "",
    who_we_are_heading: "",
    who_we_are_body_1: "",
    who_we_are_body_2: "",
    who_we_are_body_3: "",
    vision: "",
    mission: "",
    goals: "",
    objectives: "",
  });

  const [values, setValues] = useState<ValueItem[]>([]);
  const [why, setWhy] = useState<WhyItem[]>([]);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch("/api/admin/about")
      .then((data) => {
        const p = data.page ?? {};
        setPg({
          hero_headline: p.hero_headline ?? "",
          hero_description: p.hero_description ?? "",
          hero_image: p.hero_image ?? "",
          who_we_are_heading: p.who_we_are_heading ?? "",
          who_we_are_body_1: p.who_we_are_body_1 ?? "",
          who_we_are_body_2: p.who_we_are_body_2 ?? "",
          who_we_are_body_3: p.who_we_are_body_3 ?? "",
          vision: p.vision ?? "",
          mission: p.mission ?? "",
          goals: p.goals ?? "",
          objectives: p.objectives ?? "",
        });
        setValues(data.values ?? []);
        setWhy(data.why_choose_us ?? []);
      })
      .catch((e) => showToast(e.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    return () => {
      if (heroPreview) URL.revokeObjectURL(heroPreview);
    };
  }, [heroPreview]);

  const set = (k: keyof PageSettings) => (v: string) =>
    setPg((prev) => ({ ...prev, [k]: v }));

  const patchValue = (idx: number, patch: Partial<ValueItem>) =>
    setValues((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch, _dirty: true } : it)),
    );

  const patchWhy = (idx: number, patch: Partial<WhyItem>) =>
    setWhy((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch, _dirty: true } : it)),
    );

  function handleHeroFile(file: File | undefined) {
    if (!file) return;
    setHeroFile(file);
    if (heroPreview) URL.revokeObjectURL(heroPreview);
    setHeroPreview(URL.createObjectURL(file));
  }

  async function savePageSettings() {
    setSavingPage(true);
    try {
      const fd = new FormData();
      (Object.entries(pg) as [string, string][]).forEach(([k, v]) => {
        if (k !== "hero_image") fd.append(k, v ?? "");
      });
      if (heroFile) fd.append("hero_image", heroFile);
      const data = await apiFetch("/api/admin/about", {
        method: "POST",
        body: fd,
      });
      setPg((prev) => ({ ...prev, ...data.page }));
      setHeroFile(null);
      showToast("Changes saved!");
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setSavingPage(false);
    }
  }

  async function saveValues() {
    setSavingValues(true);
    try {
      const updated: ValueItem[] = [];
      for (const item of values) {
        const { _dirty, _new, ...body } = item;
        const { id, ...bodyWithoutId } = body;
        if (_new) {
          updated.push(
            await apiFetch("/api/admin/about/values", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(bodyWithoutId),
            }),
          );
        } else if (_dirty && id) {
          updated.push(
            await apiFetch(`/api/admin/about/values/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(bodyWithoutId),
            }),
          );
        } else {
          updated.push(item);
        }
      }
      setValues(updated.map((it) => ({ ...it, _dirty: false, _new: false })));
      showToast("Core Values saved!");
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setSavingValues(false);
    }
  }

  async function saveWhy() {
    setSavingWhy(true);
    try {
      const updated: WhyItem[] = [];
      for (const item of why) {
        const { _dirty, _new, ...body } = item;
        const { id, ...bodyWithoutId } = body;
        if (_new) {
          updated.push(
            await apiFetch("/api/admin/about/why-choose-us", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(bodyWithoutId),
            }),
          );
        } else if (_dirty && id) {
          updated.push(
            await apiFetch(`/api/admin/about/why-choose-us/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(bodyWithoutId),
            }),
          );
        } else {
          updated.push(item);
        }
      }
      setWhy(updated.map((it) => ({ ...it, _dirty: false, _new: false })));
      showToast("Why Choose Us saved!");
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setSavingWhy(false);
    }
  }

  async function deleteValue(idx: number, id?: number) {
    if (id) {
      try {
        await apiFetch(`/api/admin/about/values/${id}`, { method: "DELETE" });
      } catch (e: any) {
        showToast(e.message, "error");
        return;
      }
    }
    setValues((prev) => prev.filter((_, i) => i !== idx));
    showToast("Removed.");
  }

  async function deleteWhy(idx: number, id?: number) {
    if (id) {
      try {
        await apiFetch(`/api/admin/about/why-choose-us/${id}`, {
          method: "DELETE",
        });
      } catch (e: any) {
        showToast(e.message, "error");
        return;
      }
    }
    setWhy((prev) => prev.filter((_, i) => i !== idx));
    showToast("Removed.");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <p className="text-gray-400 text-sm">Loading page content…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">
              About Page Editor
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">
              Changes here appear on the public About page
            </p>
          </div>
          {(activeTab === "intro" ||
            activeTab === "whoweare" ||
            activeTab === "vmgo") && (
            <SaveBtn
              onClick={savePageSettings}
              saving={savingPage}
              label="Save"
            />
          )}
          {activeTab === "values" && (
            <SaveBtn
              onClick={saveValues}
              saving={savingValues}
              label="Save Core Values"
            />
          )}
          {activeTab === "why" && (
            <SaveBtn
              onClick={saveWhy}
              saving={savingWhy}
              label="Save Why Choose Us"
            />
          )}
        </div>

        {/* ── Tab navigation ── */}
        <div className="max-w-4xl mx-auto mt-4 flex items-center gap-1 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all",
                activeTab === tab.key
                  ? "bg-red-500 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800",
              ].join(" ")}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* ── INTRO ── */}
        {activeTab === "intro" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-base font-bold text-gray-900 mb-1">
              Page Introduction
            </h2>
            <p className="text-gray-500 text-sm mb-7 pb-6 border-b border-gray-100">
              The title and short description visitors read first when they open
              the About page.
            </p>
            <Field
              label="Page Title"
              hint='The big headline at the top of the page. Example: "About Alfima Realty"'
              placeholder="About Alfima Realty"
              value={pg.hero_headline}
              onChange={set("hero_headline")}
            />
            <Field
              label="Short Description"
              hint="1–2 sentences about what Alfima Realty is. Keep it friendly and welcoming."
              placeholder="Alfima Realty Inc. is a trusted real estate company helping Filipinos find their dream homes…"
              value={pg.hero_description}
              onChange={set("hero_description")}
              textarea
              rows={3}
            />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Banner Photo
              </label>
              <p className="text-gray-400 text-xs mb-3">
                The photo shown beside the title. Best size: wide/landscape
                photo.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {(heroPreview || pg.hero_image) && (
                  <img
                    src={
                      heroPreview
                        ? heroPreview
                        : `${IMAGE_BASE}/${pg.hero_image}`
                    }
                    alt="Banner preview"
                    className="w-28 h-[72px] object-cover rounded-xl border border-gray-200"
                  />
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 hover:border-red-400 hover:bg-red-50 text-gray-500 hover:text-red-500 text-sm transition-all"
                >
                  <Upload className="w-4 h-4" />
                  {pg.hero_image || heroFile ? "Change Photo" : "Upload Photo"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleHeroFile(e.target.files?.[0])}
                />
                {(heroPreview || pg.hero_image) && (
                  <button
                    onClick={() => {
                      setHeroFile(null);
                      setHeroPreview(null);
                      setPg((prev) => ({ ...prev, hero_image: "" }));
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── WHO WE ARE ── */}
        {activeTab === "whoweare" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-base font-bold text-gray-900 mb-1">
              Who We Are
            </h2>
            <p className="text-gray-500 text-sm mb-7 pb-6 border-b border-gray-100">
              A short section about Alfima Realty's background. You can write up
              to 3 paragraphs — only fill what you need.
            </p>
            <Field
              label="Section Heading"
              hint='The title shown above the paragraphs. Example: "Your Trusted Partner in Real Estate"'
              placeholder="Your Trusted Partner in Real Estate"
              value={pg.who_we_are_heading}
              onChange={set("who_we_are_heading")}
            />
            <Field
              label="First Paragraph"
              value={pg.who_we_are_body_1}
              onChange={set("who_we_are_body_1")}
              textarea
              placeholder="At Alfima Realty Inc., we understand that a property is more than just a structure…"
            />
            <Field
              label="Second Paragraph (optional)"
              value={pg.who_we_are_body_2}
              onChange={set("who_we_are_body_2")}
              textarea
              placeholder="Our licensed brokers bring deep local knowledge…"
            />
            <Field
              label="Third Paragraph (optional)"
              value={pg.who_we_are_body_3}
              onChange={set("who_we_are_body_3")}
              textarea
              placeholder="First-time buyer, seasoned investor, or business owner…"
            />
          </div>
        )}

        {/* ── VMGO ── */}
        {activeTab === "vmgo" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-base font-bold text-gray-900 mb-1">
              Vision, Mission, Goals & Objectives
            </h2>
            <p className="text-gray-500 text-sm mb-7 pb-6 border-b border-gray-100">
              These four statements describe the company's purpose and
              direction.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {(
                [
                  {
                    key: "vision" as const,
                    Icon: Eye,
                    label: "Vision",
                    hint: "Where the company wants to be in the future.",
                    placeholder:
                      "To be the most trusted real estate partner in the Philippines.",
                  },
                  {
                    key: "mission" as const,
                    Icon: Target,
                    label: "Mission",
                    hint: "What the company does and who it serves.",
                    placeholder:
                      "To provide every Filipino with seamless, transparent real estate services.",
                  },
                  {
                    key: "goals" as const,
                    Icon: Flag,
                    label: "Goals",
                    hint: "Broad targets the company is working toward.",
                    placeholder:
                      "Expand to 50+ cities while maintaining 5-star client satisfaction.",
                  },
                  {
                    key: "objectives" as const,
                    Icon: Compass,
                    label: "Objectives",
                    hint: "Specific steps to achieve those goals.",
                    placeholder:
                      "Verify every listing and deliver end-to-end support for every transaction.",
                  },
                ] as const
              ).map(({ key, Icon, label, hint, placeholder }) => (
                <div key={key}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-700">
                      {label}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mb-2">{hint}</p>
                  <textarea
                    rows={4}
                    value={pg[key] ?? ""}
                    placeholder={placeholder}
                    onChange={(e) => set(key)(e.target.value)}
                    className={`${inputCls} resize-none`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CORE VALUES ── */}
        {activeTab === "values" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-base font-bold text-gray-900 mb-1">
              Core Values
            </h2>
            <p className="text-gray-500 text-sm mb-7 pb-6 border-b border-gray-100">
              These cards appear in a row on the page. Each one has an icon, a
              title, and a short description.
            </p>

            {values.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl mb-4">
                <p className="text-gray-400 text-sm">No core values yet.</p>
                <p className="text-gray-300 text-xs mt-1">
                  Click "Add Value" below to create your first one.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {values.map((v, i) => (
                <div
                  key={v.id ?? `new-${i}`}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                        Value #{i + 1}
                      </span>
                      {v._new && (
                        <span className="text-xs bg-yellow-100 text-yellow-600 font-medium px-2 py-0.5 rounded-full">
                          Unsaved
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteValue(i, v.id)}
                      className="inline-flex items-center gap-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                    <IconSelect
                      value={v.icon ?? "Star"}
                      onChange={(icon) => patchValue(i, { icon })}
                    />
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Title
                      </label>
                      <p className="text-gray-400 text-xs mb-2">
                        Short name, e.g. "Integrity"
                      </p>
                      <input
                        value={v.title ?? ""}
                        placeholder="Integrity"
                        onChange={(e) =>
                          patchValue(i, { title: e.target.value })
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Description
                      </label>
                      <p className="text-gray-400 text-xs mb-2">
                        One sentence about this value
                      </p>
                      <textarea
                        rows={3}
                        value={v.description ?? ""}
                        placeholder="Full transparency and honesty in every deal."
                        onChange={(e) =>
                          patchValue(i, { description: e.target.value })
                        }
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100 flex-wrap gap-3">
              <button
                onClick={() =>
                  setValues((prev) => [
                    ...prev,
                    {
                      icon: "Star",
                      title: "",
                      description: "",
                      sort_order: prev.length,
                      _new: true,
                    },
                  ])
                }
                className="inline-flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 px-4 py-2.5 rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" /> Add Value
              </button>
            </div>
          </div>
        )}

        {/* ── WHY CHOOSE US ── */}
        {activeTab === "why" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-base font-bold text-gray-900 mb-1">
              Why Choose Us
            </h2>
            <p className="text-gray-500 text-sm mb-7 pb-6 border-b border-gray-100">
              These cards show the top reasons clients should choose Alfima.
              Each card has a number, a title, and a short explanation.
            </p>

            {why.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl mb-4">
                <p className="text-gray-400 text-sm">No cards yet.</p>
                <p className="text-gray-300 text-xs mt-1">
                  Click "Add Card" below to create your first one.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {why.map((w, i) => (
                <div
                  key={w.id ?? `new-${i}`}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                        Card #{i + 1}
                      </span>
                      {w._new && (
                        <span className="text-xs bg-yellow-100 text-yellow-600 font-medium px-2 py-0.5 rounded-full">
                          Unsaved
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteWhy(i, w.id)}
                      className="inline-flex items-center gap-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Card Number
                      </label>
                      <p className="text-gray-400 text-xs mb-2">
                        A label shown on the card, e.g. 01, 02, 03
                      </p>
                      <input
                        value={w.number ?? ""}
                        placeholder="01"
                        onChange={(e) =>
                          patchWhy(i, { number: e.target.value })
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Title
                      </label>
                      <p className="text-gray-400 text-xs mb-2">
                        Short name, e.g. "Local Expertise"
                      </p>
                      <input
                        value={w.title ?? ""}
                        placeholder="Local Expertise"
                        onChange={(e) => patchWhy(i, { title: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Explanation
                      </label>
                      <p className="text-gray-400 text-xs mb-2">
                        1–2 sentences telling clients why this matters to them
                      </p>
                      <textarea
                        rows={3}
                        value={w.description ?? ""}
                        placeholder="Deep knowledge of Philippine real estate markets, from Metro Manila to provincial hotspots."
                        onChange={(e) =>
                          patchWhy(i, { description: e.target.value })
                        }
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <IconSelect
                        value={w.icon ?? "CheckCircle"}
                        onChange={(icon) => patchWhy(i, { icon })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100 flex-wrap gap-3">
              <button
                onClick={() =>
                  setWhy((prev) => [
                    ...prev,
                    {
                      icon: "CheckCircle",
                      number: String(prev.length + 1).padStart(2, "0"),
                      title: "",
                      description: "",
                      accent_color: "#c0392b",
                      sort_order: prev.length,
                      _new: true,
                    },
                  ])
                }
                className="inline-flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 px-4 py-2.5 rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" /> Add Card
              </button>
            </div>
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
