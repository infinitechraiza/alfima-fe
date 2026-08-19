"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  X,
  Upload,
  Users,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  TriangleAlert,
  ShieldCheck,
  ShieldOff,
  Star,
  Briefcase,
  EyeOff,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Agent {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  specialization: string | null;
  experience_years: number | null;
  listings: number;
  is_active: boolean;
}

interface PaginatedResponse {
  data: Agent[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

type ModalMode = "create" | "edit" | "view" | null;
interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

const inp =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all";
const lbl =
  "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2";
const ACCEPT_IMAGES = "image/jpeg,image/png,image/webp,image/gif";

const JOB_TITLES = [
  "Management",
  "Sales Agent",
  "Property Consultant",
  "Real Estate Broker",
  "Real Estate Salesperson",
  "Leasing Agent",
  "Rental Agent",
  "Property Specialist",
  "Investment Consultant",
  "Account Manager",
  "Team Leader",
  "Branch Manager",
];

// ── Field ─────────────────────────────────────────────────────────────────────

function Field({
  k,
  label,
  required,
  hint,
  children,
  fieldErrors,
}: {
  k: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  fieldErrors: Partial<Record<string, string>>;
}) {
  return (
    <div>
      <label className={lbl}>
        {label}
        {required && (
          <span className="text-red-500 normal-case tracking-normal font-normal ml-1">
            *
          </span>
        )}
      </label>
      {children}
      {fieldErrors[k] ? (
        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {fieldErrors[k]}
        </p>
      ) : hint ? (
        <p className="text-xs text-slate-400 mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  variant = "red",
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "red" | "amber";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const btnCls =
    variant === "amber"
      ? "bg-amber-500 hover:bg-amber-600"
      : "bg-red-600 hover:bg-red-700";
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
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${variant === "amber" ? "bg-amber-50" : "bg-red-50"}`}
            >
              <TriangleAlert
                className={`w-5 h-5 ${variant === "amber" ? "text-amber-500" : "text-red-500"}`}
              />
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
              className={`px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2 ${btnCls}`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Please wait..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
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

// ── Agent Form Modal ──────────────────────────────────────────────────────────

function AgentFormModal({
  initial,
  mode,
  onClose,
  onSaved,
}: {
  initial?: Agent | null;
  mode: "create" | "edit";
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const isCreate = mode === "create";

  const [loading, setLoading] = useState(false);
  const [fetchingDetail, setFetchingDetail] = useState(!isCreate); // fetching full detail on edit
  const [error, setError] = useState("");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initial?.avatar ?? null,
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [useCustomSpecialization, setUseCustomSpecialization] = useState(
    initial?.specialization
      ? !JOB_TITLES.includes(initial.specialization)
      : false,
  );

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    specialization: initial?.specialization ?? "",
    experience_years: String(initial?.experience_years ?? ""),
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<string, string>>
  >({});

  // ── Fetch full agent detail when editing ────────────────────────────────────
  // The list endpoint may return partial data (null phone/specialization/etc.)
  // even when the agent actually has those values. Fetching the detail endpoint
  // guarantees we get the complete, up-to-date record.
  useEffect(() => {
    if (isCreate || !initial?.id) return;

    setFetchingDetail(true);
    fetch(`/api/agents/${initial.id}`)
      .then((r) => r.json())
      .then((data: Agent) => {
        // data may be nested under a key depending on your API shape
        const agent: Agent = (data as any).data ?? data;
        setForm({
          name: agent.name ?? "",
          email: agent.email ?? "",
          phone: agent.phone ?? "",
          specialization: agent.specialization ?? "",
          experience_years: String(agent.experience_years ?? ""),
          password: "",
          confirmPassword: "",
        });
        setAvatarPreview(agent.avatar ?? null);
      })
      .catch(() => setError("Failed to load agent details."))
      .finally(() => setFetchingDetail(false));
  }, [isCreate, initial?.id]);

  const setF = (k: string, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setFieldErrors((p) => ({ ...p, [k]: undefined }));
    if (error) setError("");
  };

  const validate = () => {
    const e: Record<string, string> = {};

    if (!form.name.trim()) e.name = "Full name is required";
    else if (form.name.trim().split(/\s+/).length < 2)
      e.name = "First and last name required";

    if (isCreate) {
      if (!form.email.trim()) e.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email))
        e.email = "Enter a valid email";

      if (!form.phone) e.phone = "Phone number is required";
      else if (!/^09\d{9}$/.test(form.phone.replace(/\D/g, "")))
        e.phone = "11 digits starting with 09";

      if (!form.password) e.password = "Password is required";
      else if (form.password.length < 8) e.password = "Minimum 8 characters";

      if (!form.confirmPassword) e.confirmPassword = "Please confirm password";
      else if (form.password !== form.confirmPassword)
        e.confirmPassword = "Passwords do not match";
    } else {
      if (form.phone && !/^09\d{9}$/.test(form.phone.replace(/\D/g, ""))) {
        e.phone = "11 digits starting with 09";
      }
    }

    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError("");

    try {
      if (isCreate) {
        const res = await fetch("/api/admin/agents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Create": "1",
          },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            phone: form.phone.replace(/\D/g, ""),
            password: form.password,
            confirmPassword: form.confirmPassword,
            role: "agent",
            specialization: form.specialization, // ← ADD THIS
            experience_years: form.experience_years // ← ADD THIS
              ? Number(form.experience_years)
              : null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to create agent.");
          return;
        }

        if (avatarFile && data.user?.id) {
          const fd = new FormData();
          fd.append("avatar", avatarFile);
          fd.append("_method", "PUT");
          await fetch(`/api/admin/agents/${data.user.id}`, {
            method: "POST",
            body: fd,
          }).catch(() => {});
        }
      } else {
        const fd = new FormData();
        fd.append("_method", "PUT");

        // Always send these fields — even empty string clears the value
        fd.append("name", form.name);
        fd.append("phone", form.phone.replace(/\D/g, ""));
        fd.append("specialization", form.specialization);
        fd.append("experience_years", form.experience_years);
        if (avatarFile) fd.append("avatar", avatarFile);

        const res = await fetch(`/api/admin/agents/${initial!.id}`, {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? data.message ?? "Failed to update agent.");
          return;
        }
      }

      onSaved(isCreate ? "Agent created successfully!" : "Agent updated!");
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const phoneDigits = form.phone.replace(/\D/g, "").length;
  const passwordsMatch =
    form.confirmPassword && form.password === form.confirmPassword;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 lg:p-8">
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          style={{ animation: "modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {isCreate ? "Add New Agent" : "Edit Agent"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isCreate
                  ? "Create a new agent account."
                  : "Update agent profile details."}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Loading skeleton while fetching detail */}
          {fetchingDetail ? (
            <div className="flex-1 flex items-center justify-center py-24 gap-3">
              <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
              <p className="text-sm text-slate-400 font-medium">
                Loading agent details...
              </p>
            </div>
          ) : (
            <>
              {/* Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-5">
                  <div
                    className="relative group cursor-pointer"
                    onClick={() =>
                      document.getElementById("avatar-input")?.click()
                    }
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="w-20 h-20 rounded-2xl object-cover ring-2 ring-slate-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center ring-2 ring-slate-200">
                        <Users className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Profile Photo
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Click to upload · JPG, PNG, WebP
                    </p>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarPreview(null);
                          setAvatarFile(null);
                        }}
                        className="text-xs text-red-400 hover:text-red-600 mt-1 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    id="avatar-input"
                    type="file"
                    accept={ACCEPT_IMAGES}
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setAvatarFile(f);
                      setAvatarPreview(URL.createObjectURL(f));
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="col-span-2">
                    <Field
                      k="name"
                      label="Full Name"
                      required
                      fieldErrors={fieldErrors}
                    >
                      <input
                        className={`${inp} ${fieldErrors.name ? "border-red-300 ring-red-100" : ""}`}
                        value={form.name}
                        onChange={(e) => setF("name", e.target.value)}
                        placeholder="Juan dela Cruz"
                      />
                    </Field>
                  </div>

                  {/* Email — create only */}
                  {isCreate && (
                    <div className="col-span-2">
                      <Field
                        k="email"
                        label="Email Address"
                        required
                        fieldErrors={fieldErrors}
                      >
                        <input
                          type="email"
                          className={`${inp} ${fieldErrors.email ? "border-red-300 ring-red-100" : ""}`}
                          value={form.email}
                          onChange={(e) => setF("email", e.target.value)}
                          placeholder="juan@example.com"
                          autoComplete="off"
                        />
                      </Field>
                    </div>
                  )}

                  {/* Phone */}
                  <div>
                    <Field
                      k="phone"
                      label="Phone"
                      required={isCreate}
                      hint="11 digits e.g. 09171234567"
                      fieldErrors={fieldErrors}
                    >
                      <div className="relative">
                        <input
                          type="tel"
                          inputMode="numeric"
                          className={`${inp} pr-14 ${fieldErrors.phone ? "border-red-300 ring-red-100" : ""}`}
                          value={form.phone}
                          onChange={(e) =>
                            setF(
                              "phone",
                              e.target.value.replace(/\D/g, "").slice(0, 11),
                            )
                          }
                          placeholder="09171234567"
                        />
                        <span
                          className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold ${
                            phoneDigits === 11
                              ? "text-emerald-500"
                              : "text-slate-400"
                          }`}
                        >
                          {phoneDigits}/11
                        </span>
                      </div>
                    </Field>
                  </div>

                  {/* Specialization - Dropdown */}
                  <div>
                    <Field
                      k="specialization"
                      label="Job Title"
                      fieldErrors={fieldErrors}
                    >
                      <select
                        className={`${inp} appearance-none cursor-pointer`}
                        value={
                          useCustomSpecialization
                            ? "custom"
                            : form.specialization
                        }
                        onChange={(e) => {
                          if (e.target.value === "custom") {
                            setUseCustomSpecialization(true);
                            setF("specialization", "");
                          } else {
                            setUseCustomSpecialization(false);
                            setF("specialization", e.target.value);
                          }
                        }}
                      >
                        <option value="">Select a job title...</option>
                        {JOB_TITLES.map((title) => (
                          <option key={title} value={title}>
                            {title}
                          </option>
                        ))}
                        <option value="custom">+ Add Custom Title</option>
                      </select>
                    </Field>

                    {useCustomSpecialization && (
                      <div className="mt-3">
                        <Field
                          k="specialization_custom"
                          label="Custom Job Title"
                          fieldErrors={fieldErrors}
                        >
                          <input
                            className={inp}
                            value={form.specialization}
                            onChange={(e) =>
                              setF("specialization", e.target.value)
                            }
                            placeholder="Enter your job title"
                          />
                        </Field>
                      </div>
                    )}
                  </div>

                  {/* Experience */}
                  <div>
                    <Field
                      k="experience_years"
                      label="Years of Experience"
                      fieldErrors={fieldErrors}
                    >
                      <input
                        type="number"
                        min={0}
                        max={60}
                        className={inp}
                        value={form.experience_years}
                        onChange={(e) =>
                          setF("experience_years", e.target.value)
                        }
                        placeholder="0"
                      />
                    </Field>
                  </div>

                  {/* Password fields — create only */}
                  {isCreate && (
                    <>
                      <div className="col-span-2">
                        <div className="flex items-center gap-3 my-1">
                          <div className="flex-1 h-px bg-slate-100" />
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Security
                          </span>
                          <div className="flex-1 h-px bg-slate-100" />
                        </div>
                      </div>

                      <div>
                        <Field
                          k="password"
                          label="Password"
                          required
                          hint="Minimum 8 characters"
                          fieldErrors={fieldErrors}
                        >
                          <div className="relative">
                            <input
                              type={showPw ? "text" : "password"}
                              className={`${inp} pr-11 ${fieldErrors.password ? "border-red-300 ring-red-100" : ""}`}
                              value={form.password}
                              onChange={(e) => setF("password", e.target.value)}
                              placeholder="••••••••"
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPw((p) => !p)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {showPw ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </Field>
                      </div>

                      <div>
                        <Field
                          k="confirmPassword"
                          label="Confirm Password"
                          required
                          fieldErrors={fieldErrors}
                        >
                          <div className="relative">
                            <input
                              type={showCpw ? "text" : "password"}
                              className={`${inp} pr-11 ${fieldErrors.confirmPassword ? "border-red-300 ring-red-100" : ""}`}
                              value={form.confirmPassword}
                              onChange={(e) =>
                                setF("confirmPassword", e.target.value)
                              }
                              placeholder="••••••••"
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCpw((p) => !p)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {showCpw ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {!fieldErrors.confirmPassword && passwordsMatch && (
                            <p className="text-xs text-emerald-500 mt-1.5 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Passwords
                              match
                            </p>
                          )}
                        </Field>
                      </div>
                    </>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-8 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-red-200"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading
                    ? "Saving..."
                    : isCreate
                      ? "+ Create Agent"
                      : "Save Changes"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── View Modal ────────────────────────────────────────────────────────────────

function ViewModal({
  agent,
  onClose,
  onEdit,
}: {
  agent: Agent;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          style={{ animation: "modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          {/* Banner */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-8 pt-8 pb-6 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="flex items-center gap-4">
              {agent.avatar ? (
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-2xl font-bold ring-2 ring-white/20">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-white font-bold text-xl">{agent.name}</h2>
                {agent.specialization && (
                  <p className="text-white/60 text-sm mt-0.5">
                    {agent.specialization}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      agent.is_active
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {agent.is_active ? "● Active" : "● Inactive"}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/60 font-semibold">
                    {agent.listings} listings
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-3">
            {[
              { icon: Mail, label: "Email", value: agent.email },
              { icon: Phone, label: "Phone", value: agent.phone ?? "—" },
              {
                icon: Star,
                label: "Experience",
                value: agent.experience_years
                  ? `${agent.experience_years} years`
                  : "—",
              },
              {
                icon: Briefcase,
                label: "Listings",
                value: `${agent.listings} active listings`,
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
              >
                <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors"
            >
              Close
            </button>
            <button
              onClick={onEdit}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-bold shadow-lg shadow-red-200 hover:from-red-700 hover:to-red-800 transition-all"
            >
              Edit Agent
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminAgentsPage() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmData, setConfirmData] = useState<{
    id: number;
    action: "deactivate" | "activate" | "delete";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const toast = (type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, type, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: "12",
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/agents?${params}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (Array.isArray(json)) {
        setData({
          data: json,
          current_page: 1,
          last_page: 1,
          per_page: json.length,
          total: json.length,
        });
      } else {
        setData(json);
      }
    } catch {
      toast("error", "Failed to load agents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [page, search]);

  const handleToggleActive = async (id: number, currentlyActive: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentlyActive }),
      });
      if (!res.ok) throw new Error();
      toast(
        "success",
        currentlyActive ? "Agent deactivated." : "Agent activated.",
      );
      fetchAgents();
    } catch {
      toast("error", "Failed to update agent status.");
    } finally {
      setActionLoading(false);
      setConfirmData(null);
    }
  };

  const handleDelete = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("success", "Agent deleted.");
      fetchAgents();
    } catch {
      toast("error", "Failed to delete agent.");
    } finally {
      setActionLoading(false);
      setConfirmData(null);
    }
  };

  const handleConfirmAction = () => {
    if (!confirmData) return;
    if (confirmData.action === "delete") {
      handleDelete(confirmData.id);
    } else {
      const agent = data?.data.find((a) => a.id === confirmData.id);
      if (agent) handleToggleActive(agent.id, agent.is_active);
    }
  };

  const confirmConfig = confirmData
    ? {
        delete: {
          title: "Delete Agent",
          description:
            "This will permanently remove the agent account and all associated data. This cannot be undone.",
          label: "Delete Agent",
          variant: "red" as const,
        },
        deactivate: {
          title: "Deactivate Agent",
          description:
            "This agent will no longer be able to log in or manage listings.",
          label: "Deactivate",
          variant: "amber" as const,
        },
        activate: {
          title: "Activate Agent",
          description:
            "This agent will regain access to their account and listings.",
          label: "Activate",
          variant: "amber" as const,
        },
      }[confirmData.action]
    : null;

  return (
    <>
      <style>{`
        @keyframes toastIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .row-hover:hover { background: #f8fafc; }
      `}</style>

      <ToastList
        toasts={toasts}
        remove={(id) => setToasts((p) => p.filter((t) => t.id !== id))}
      />

      <div className="bg-slate-50 min-h-screen">
        {/* Page Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                Agents
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {data ? `${data.total} registered agents` : "Loading..."}
              </p>
            </div>
            {/* <button
              onClick={() => {
                setSelected(null);
                setModal("create");
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-red-200 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Agent
            </button> */}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all shadow-sm"
                placeholder="Search by name or specialization..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_130px] gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50">
              {[
                "Agent",
                "Contact",
                "Listings",
                "Experience",
                "Status",
                "Actions",
              ].map((h) => (
                <span
                  key={h}
                  className="text-xs font-bold text-slate-400 uppercase tracking-widest"
                >
                  {h}
                </span>
              ))}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">
                  Loading agents...
                </p>
              </div>
            ) : !data?.data?.length ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
                  <Users className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-base font-semibold text-slate-600">
                  No agents found
                </p>
                <p className="text-sm text-slate-400">
                  Add your first agent to get started.
                </p>
              </div>
            ) : (
              <div>
                {data.data.map((agent, idx) => (
                  <div
                    key={agent.id}
                    className={`row-hover grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_130px] gap-4 px-6 py-4 items-center transition-colors ${idx < data.data.length - 1 ? "border-b border-slate-50" : ""}`}
                    style={{
                      animation: `fadeUp 0.3s ease ${idx * 0.04}s both`,
                    }}
                  >
                    {/* Agent */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {agent.avatar ? (
                        <img
                          src={agent.avatar}
                          alt={agent.name}
                          className="w-11 h-11 rounded-2xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-slate-800 text-sm font-bold truncate">
                          {agent.name}
                        </p>
                        {agent.specialization ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold">
                            {agent.specialization}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            No specialization
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="min-w-0">
                      <p className="text-slate-600 text-xs truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        {agent.email}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        {agent.phone ?? "—"}
                      </p>
                    </div>

                    {/* Listings */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-sm font-bold ${agent.listings > 0 ? "text-slate-800" : "text-slate-400"}`}
                      >
                        {agent.listings}
                      </span>
                      <span className="text-xs text-slate-400">active</span>
                    </div>

                    {/* Experience */}
                    <p className="text-slate-600 text-sm">
                      {agent.experience_years != null
                        ? `${agent.experience_years} yrs`
                        : "—"}
                    </p>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${agent.is_active ? "bg-emerald-500" : "bg-slate-400"}`}
                      />
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${
                          agent.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}
                      >
                        {agent.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelected(agent);
                          setModal("view");
                        }}
                        className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelected(agent);
                          setModal("edit");
                        }}
                        className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setConfirmData({
                            id: agent.id,
                            action: agent.is_active ? "deactivate" : "activate",
                          })
                        }
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                          agent.is_active
                            ? "bg-slate-50 hover:bg-amber-50 border-slate-200 hover:border-amber-200 text-slate-500 hover:text-amber-600"
                            : "bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-emerald-200 text-slate-500 hover:text-emerald-600"
                        }`}
                        title={agent.is_active ? "Deactivate" : "Activate"}
                      >
                        {agent.is_active ? (
                          <ShieldOff className="w-4 h-4" />
                        ) : (
                          <ShieldCheck className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          setConfirmData({ id: agent.id, action: "delete" })
                        }
                        className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {data && data.last_page > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {(page - 1) * data.per_page + 1}–
                    {Math.min(page * data.per_page, data.total)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {data.total}
                  </span>
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: data.last_page }, (_, i) => i + 1)
                    .filter((n) => Math.abs(n - page) <= 2)
                    .map((n) => (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`w-9 h-9 rounded-xl border text-sm font-bold transition-all shadow-sm ${
                          n === page
                            ? "bg-red-600 border-red-600 text-white shadow-red-200"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(data.last_page, p + 1))
                    }
                    disabled={page === data.last_page}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {(modal === "create" || modal === "edit") && (
        <AgentFormModal
          mode={modal}
          initial={selected}
          onClose={() => {
            setModal(null);
            setSelected(null);
          }}
          onSaved={(msg) => {
            toast("success", msg);
            fetchAgents();
          }}
        />
      )}
      {modal === "view" && selected && (
        <ViewModal
          agent={selected}
          onClose={() => {
            setModal(null);
            setSelected(null);
          }}
          onEdit={() => setModal("edit")}
        />
      )}

      {/* Confirm dialog */}
      {confirmData && confirmConfig && (
        <ConfirmDialog
          title={confirmConfig.title}
          description={confirmConfig.description}
          confirmLabel={confirmConfig.label}
          variant={confirmConfig.variant}
          loading={actionLoading}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmData(null)}
        />
      )}
    </>
  );
}
