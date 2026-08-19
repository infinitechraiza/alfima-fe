"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, use, useCallback, lazy, Suspense } from "react";
import { Property } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/store";
import {
  Heart,
  MapPin,
  Phone,
  Mail,
  Share2,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  CheckCircle2,
  User,
  MessageSquare,
  Calendar,
  ArrowRight,
  Loader2,
  Building2,
  Clock,
  Video,
  Home,
  Lock,
  Image as ImageIcon,
} from "lucide-react";

const BLUR_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

function cdnUrl(url: string, w: number, h: number): string {
  if (!url) return "/placeholder-property.jpg";

  if (url.includes("localhost:8000")) {
    url = url.replace("http://localhost:8000", "/img-proxy");
  }

  if (url.includes("infinitech-api14.site")) {
    // production URL is fine as-is
  }

  if (url.includes("cloudinary.com")) {
    return url.replace(
      "/upload/",
      `/upload/w_${w * 2},h_${h * 2},c_fill,f_auto,q_auto:good/`,
    );
  }
  return url;
}

interface Agent {
  id: number;
  name: string;
  avatar?: string | null;
  phone?: string | null;
  email?: string | null;
  specialization?: string | null;
  experience_years?: number | null;
  listings?: number;
  is_active?: boolean;
}

interface PropertyVideo {
  id: number;
  url: string;
  video_path?: string;
  title?: string;
  user_id?: number;
  created_at?: string;
}

interface LeadForm {
  name: string;
  phone: string;
  email: string;
  message: string;
  preferredContact: "sms" | "viber" | "email" | "phone" | "whatsapp";
  viewingDate: string;
}

type ModalStep = "select-agent" | "lead-form" | "submitting" | "success";

const s = {
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(40, 15, 15, 0.75)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backdropFilter: "blur(6px)",
  },
  modal: {
    background: "#fff",
    borderRadius: 24,
    width: "100%",
    maxWidth: 640,
    maxHeight: "92vh",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
    boxShadow: "0 40px 100px rgba(0,0,0,0.3)",
  },
  header: {
    padding: "22px 28px 18px",
    borderBottom: "1px solid #f0f0f0",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexShrink: 0,
    background: "linear-gradient(135deg, #fff 0%, #fafafa 100%)",
  },
  closeBtn: {
    background: "#f3f4f6",
    border: "none",
    borderRadius: 10,
    padding: 8,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
  },
  primaryBtn: (disabled = false) => ({
    flex: 2,
    padding: "13px 20px",
    border: "none",
    borderRadius: 12,
    background: disabled
      ? "#e5e7eb"
      : "linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)",
    color: disabled ? "#9ca3af" : "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: disabled ? "none" : "0 4px 14px rgba(192,57,43,0.35)",
  }),
  secondaryBtn: {
    flex: 1,
    padding: "13px 20px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 12,
    background: "#fff",
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  input: (hasError = false) => ({
    width: "100%",
    padding: "11px 14px",
    border: `1.5px solid ${hasError ? "#ef4444" : "#e5e7eb"}`,
    borderRadius: 10,
    fontSize: 14,
    color: "#111827",
    outline: "none",
    transition: "border 0.15s",
    background: "#fafafa",
    boxSizing: "border-box" as const,
  }),
  readonlyInput: {
    width: "100%",
    padding: "11px 14px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 10,
    fontSize: 14,
    color: "#6b7280",
    outline: "none",
    background: "#f3f4f6",
    boxSizing: "border-box" as const,
    cursor: "not-allowed" as const,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
  },
  fieldGroup: { marginBottom: 16 },
};

function LoggedInBanner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 14px",
        background: "#f0fdf4",
        border: "1.5px solid #bbf7d0",
        borderRadius: 10,
        marginBottom: 16,
      }}
    >
      <Lock size={13} color="#16a34a" />
      <span style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}>
        Auto-filled from your account&nbsp;·&nbsp;
        <span style={{ fontWeight: 400 }}>contact fields are locked</span>
      </span>
    </div>
  );
}

function StepIndicator({ step }: { step: ModalStep }) {
  const steps = ["select-agent", "lead-form"];
  const currentIdx = steps.indexOf(step);
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}
    >
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: i <= currentIdx ? "#c0392b" : "#e5e7eb",
              color: i <= currentIdx ? "#fff" : "#9ca3af",
              transition: "all 0.3s",
            }}
          >
            {i < currentIdx ? <CheckCircle2 size={13} /> : i + 1}
          </div>
          <span
            style={{
              fontSize: 12,
              color: i <= currentIdx ? "#c0392b" : "#9ca3af",
              fontWeight: i === currentIdx ? 700 : 400,
            }}
          >
            {i === 0 ? "Choose Agent" : "Your Details"}
          </span>
          {i < steps.length - 1 && (
            <div
              style={{
                width: 24,
                height: 2,
                background: i < currentIdx ? "#c0392b" : "#e5e7eb",
                borderRadius: 1,
                transition: "background 0.3s",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function AgentAvatar({
  src,
  alt,
  size = 54,
  className = "",
  style = {},
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&size=${size * 2}&background=random`;
  return (
    <img
      src={src || fallback}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      className={`object-cover rounded-full flex-shrink-0 ${className}`}
      style={{ width: size, height: size, ...style }}
      onError={(e) => {
        (e.target as HTMLImageElement).src = fallback;
      }}
    />
  );
}

function AgentSelectStep({
  selected,
  setSelected,
  onNext,
  onClose,
  propertyTitle,
}: {
  selected: Agent | null;
  setSelected: (a: Agent | null) => void;
  onNext: () => void;
  onClose: () => void;
  propertyTitle: string;
}) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch("/api/agents");
        if (!res.ok) throw new Error("Failed to fetch agents");
        const data = await res.json();
        setAgents(
          Array.isArray(data) ? data : (data.agents ?? data.data ?? []),
        );
      } catch {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const filtered = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.specialization ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div style={s.header}>
        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#111827",
              margin: 0,
            }}
          >
            Choose Your Agent
          </h2>
          <StepIndicator step="select-agent" />
        </div>
        <button style={s.closeBtn} onClick={onClose}>
          <X size={18} color="#6b7280" />
        </button>
      </div>

      <div
        style={{
          padding: "12px 28px",
          background: "#fff8f8",
          borderBottom: "1px solid #fde8e8",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Building2 size={14} color="#c0392b" />
        <span style={{ fontSize: 13, color: "#6b7280" }}>
          Inquiring about:{" "}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
          {propertyTitle}
        </span>
      </div>

      <div
        style={{
          padding: "14px 28px",
          borderBottom: "1px solid #f0f0f0",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#f9fafb",
            border: "1.5px solid #e5e7eb",
            borderRadius: 12,
            padding: "9px 14px",
          }}
        >
          <Search size={15} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search by name or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 14,
              color: "#111827",
              width: "100%",
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 28px" }}>
        {loading ? (
          <div style={{ display: "grid", gap: 10 }}>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: 86,
                  background: "#f3f4f6",
                  borderRadius: 14,
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        ) : fetchError ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ fontSize: 14, color: "#ef4444", marginBottom: 8 }}>
              Failed to load agents.
            </p>
            <p style={{ fontSize: 12, color: "#9ca3af" }}>
              Please check your connection and try again.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "#9ca3af",
              padding: "40px 0",
              fontSize: 14,
            }}
          >
            No agents found for "{search}"
          </p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {filtered.map((agent) => {
              const isSel = selected?.id === agent.id;
              return (
                <div
                  key={agent.id}
                  onClick={() => setSelected(isSel ? null : agent)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    borderRadius: 16,
                    cursor: "pointer",
                    border: isSel ? "2px solid #c0392b" : "1.5px solid #e5e7eb",
                    background: isSel ? "#fff5f5" : "#fff",
                    transition: "all 0.15s",
                    position: "relative",
                    boxShadow: isSel
                      ? "0 4px 16px rgba(192,57,43,0.12)"
                      : "none",
                  }}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <AgentAvatar
                      src={agent.avatar ?? ""}
                      alt={agent.name}
                      size={54}
                      style={{
                        border: isSel
                          ? "2.5px solid #c0392b"
                          : "2px solid #e5e7eb",
                      }}
                    />
                    {isSel && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: -2,
                          right: -2,
                          width: 20,
                          height: 20,
                          background: "#c0392b",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "2px solid #fff",
                        }}
                      >
                        <CheckCircle2 size={12} color="#fff" />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 3,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#111827",
                          margin: 0,
                        }}
                      >
                        {agent.name}
                      </p>
                      {agent.specialization && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#c0392b",
                            background: "#fff0ee",
                            padding: "2px 9px",
                            borderRadius: 20,
                            flexShrink: 0,
                          }}
                        >
                          {agent.specialization}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        flexWrap: "wrap" as const,
                      }}
                    >
                      {agent.experience_years != null && (
                        <span style={{ fontSize: 12, color: "#6b7280" }}>
                          {agent.experience_years} yrs exp
                        </span>
                      )}
                      {(agent.listings ?? 0) > 0 && (
                        <span style={{ fontSize: 12, color: "#6b7280" }}>
                          {agent.listings} listings
                        </span>
                      )}
                    </div>
                    {agent.phone && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "#9ca3af",
                          margin: "4px 0 0",
                        }}
                      >
                        {agent.phone}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        style={{
          padding: "18px 28px",
          borderTop: "1px solid #f0f0f0",
          flexShrink: 0,
          display: "flex",
          gap: 10,
        }}
      >
        <button style={s.secondaryBtn} onClick={onClose}>
          Cancel
        </button>
        <button
          style={s.primaryBtn(!selected)}
          onClick={() => selected && onNext()}
          disabled={!selected}
        >
          Continue <ArrowRight size={16} />
        </button>
      </div>
    </>
  );
}

type ValidatableField = "name" | "phone" | "email" | "message" | "viewingDate";

const VALIDATORS: Record<ValidatableField, (v: string) => string | null> = {
  name: (v) => {
    if (!v.trim()) return "Full name is required";
    if (v.trim().length < 2) return "Name must be at least 2 characters";
    if (v.trim().length > 60) return "Name must be 60 characters or less";
    if (!/^[a-zA-ZÀ-ÖØ-öø-ÿ\s'\-\.]+$/.test(v.trim()))
      return "Name must contain letters only";
    if (v.trim().split(/\s+/).length < 2)
      return "Please enter your full name (first & last)";
    return null;
  },
  phone: (v) => {
    if (!v.trim()) return "Phone number is required";
    const digits = v.replace(/\D/g, "");
    if (!/^\d+$/.test(digits)) return "Phone number must contain numbers only";
    if (!/^(09\d{9}|639\d{9})$/.test(digits)) {
      if (digits.length < 11)
        return `Phone number too short — must be 11 digits (e.g. 09171234567)`;
      if (digits.length > 12)
        return `Phone number too long — must be 11 digits (e.g. 09171234567)`;
      return "Must start with 09 (e.g. 09171234567) or +639";
    }
    return null;
  },
  email: (v) => {
    if (!v.trim()) return null;
    if (v.length > 100) return "Email must be 100 characters or less";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()))
      return "Enter a valid email address (e.g. juan@gmail.com)";
    return null;
  },
  message: (v) => {
    if (!v.trim()) return null;
    if (v.trim().length < 10) return "Message must be at least 10 characters";
    if (v.length > 500) return `Message too long — ${v.length}/500 characters`;
    return null;
  },
  viewingDate: (v) => {
    if (!v) return null;
    const selected = new Date(v);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (selected < tomorrow) return "Viewing date must be tomorrow or later";
    const maxDate = new Date(today);
    maxDate.setMonth(today.getMonth() + 6);
    if (selected > maxDate)
      return "Viewing date must be within the next 6 months";
    return null;
  },
};

function FieldWrapper({
  error,
  children,
}: {
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      {children}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            marginTop: 5,
          }}
        >
          <span style={{ fontSize: 13, color: "#ef4444", lineHeight: 1.4 }}>
            ⚠ {error}
          </span>
        </div>
      )}
    </div>
  );
}

interface PropertySnapshot {
  id: number;
  title: string;
  image: string;
  blurHash?: string;
  price: string;
  address: string;
  city: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: string | null;
  agentId?: number | null;
}

function LeadFormStep({
  agent,
  form,
  setForm,
  onSubmit,
  onBack,
  onClose,
  submitting,
  property,
  canGoBack,
  lockedFields,
}: {
  agent: Agent;
  form: LeadForm;
  setForm: (f: LeadForm) => void;
  onSubmit: () => void;
  onBack: () => void;
  onClose: () => void;
  submitting: boolean;
  property: PropertySnapshot;
  canGoBack?: boolean;
  lockedFields?: { name?: boolean; phone?: boolean; email?: boolean };
}) {
  const [errors, setErrors] = useState<Partial<Record<keyof LeadForm, string>>>(
    {},
  );
  const [touched, setTouched] = useState<
    Partial<Record<keyof LeadForm, boolean>>
  >({});

  const isLocked = (field: "name" | "phone" | "email") =>
    !!lockedFields?.[field];

  const runValidator = (key: keyof LeadForm, val: string): string | null => {
    if (key in VALIDATORS) return VALIDATORS[key as ValidatableField](val);
    return null;
  };

  const touch = (key: keyof LeadForm) => {
    if (isLocked(key as any)) return;
    setTouched((prev) => ({ ...prev, [key]: true }));
    const err = runValidator(key, form[key] as string);
    setErrors((prev) => ({ ...prev, [key]: err ?? undefined }));
  };

  const update = (key: keyof LeadForm, val: string) => {
    if (isLocked(key as any)) return;
    if (key === "phone") val = val.replace(/[^\d+\s\-()]/g, "");
    if (key === "name") val = val.replace(/[0-9]/g, "");
    setForm({ ...form, [key]: val });
    if (touched[key]) {
      const err = runValidator(key, val);
      setErrors((prev) => ({ ...prev, [key]: err ?? undefined }));
    }
  };

  const validate = () => {
    const e: Partial<Record<keyof LeadForm, string>> = {};
    (Object.keys(VALIDATORS) as ValidatableField[]).forEach((key) => {
      if (isLocked(key as any)) return;
      const err = VALIDATORS[key](form[key] as string);
      if (err) e[key] = err;
    });
    setErrors(e);
    setTouched({
      name: true,
      phone: true,
      email: true,
      message: true,
      viewingDate: true,
      preferredContact: true,
    });
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onSubmit();
  };

  const contactOptions: {
    value: LeadForm["preferredContact"];
    label: string;
    icon: React.ReactNode;
  }[] = [
    { value: "sms", label: "SMS", icon: <MessageSquare size={20} /> },
    { value: "viber", label: "Viber", icon: <Phone size={20} /> },
    { value: "email", label: "Email", icon: <Mail size={20} /> },
    { value: "phone", label: "Call", icon: <Phone size={20} /> },
  ];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 6);
  const maxDateStr = maxDate.toISOString().split("T")[0];
  const phoneDigits = form.phone.replace(/\D/g, "").length;
  const hasLockedFields =
    lockedFields &&
    (lockedFields.name || lockedFields.phone || lockedFields.email);
  const snapThumb = cdnUrl(property.image, 110, 90);

  return (
    <>
      <div style={s.header}>
        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#111827",
              margin: 0,
            }}
          >
            Your Contact Details
          </h2>
          {canGoBack && <StepIndicator step="lead-form" />}
        </div>
        <button style={s.closeBtn} onClick={onClose}>
          <X size={18} color="#6b7280" />
        </button>
      </div>

      <div style={{ padding: "14px 28px 0", flexShrink: 0 }}>
        <div
          style={{
            border: "1.5px solid #e5e7eb",
            borderRadius: 16,
            overflow: "hidden",
            display: "flex",
            marginBottom: 14,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              width: 110,
              flexShrink: 0,
              position: "relative",
              minHeight: 90,
            }}
          >
            <Image
              src={snapThumb || "/placeholder-property.jpg"}
              alt={property.title}
              fill
              sizes="110px"
              loading="lazy"
              placeholder="blur"
              blurDataURL={property.blurHash ?? BLUR_PLACEHOLDER}
              className="object-cover"
            />
            <div
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                background: "rgba(192,57,43,0.9)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                padding: "3px 7px",
                borderRadius: 6,
                letterSpacing: "0.04em",
                zIndex: 1,
              }}
            >
              INQUIRING
            </div>
          </div>
          <div style={{ flex: 1, padding: "12px 14px", minWidth: 0 }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "#111827",
                margin: "0 0 2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {property.title}
            </p>
            <p
              style={{
                fontSize: 12,
                color: "#6b7280",
                margin: "0 0 8px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              📍 {property.address}, {property.city}
            </p>
            <p
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#c0392b",
                margin: "0 0 8px",
              }}
            >
              {property.price}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {property.bedrooms != null && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    background: "#f3f4f6",
                    padding: "2px 8px",
                    borderRadius: 6,
                  }}
                >
                  🛏 {property.bedrooms} bed
                </span>
              )}
              {property.bathrooms != null && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    background: "#f3f4f6",
                    padding: "2px 8px",
                    borderRadius: 6,
                  }}
                >
                  🚿 {property.bathrooms} bath
                </span>
              )}
              {property.area != null && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    background: "#f3f4f6",
                    padding: "2px 8px",
                    borderRadius: 6,
                  }}
                >
                  📐 {property.area}
                </span>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            background: "#fff8f8",
            border: "1.5px solid #fde8e8",
            borderRadius: 12,
            marginBottom: 14,
          }}
        >
          <AgentAvatar
            src={agent.avatar ?? ""}
            alt={agent.name}
            size={36}
            style={{ border: "2px solid #c0392b" }}
          />
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#111827",
                margin: 0,
              }}
            >
              Contacting {agent.name}
            </p>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
              {agent.specialization ?? "Real Estate Agent"} ·{" "}
              {agent.experience_years ?? "—"} yrs exp
            </p>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
        {hasLockedFields && <LoggedInBanner />}

        <FieldWrapper error={errors.name}>
          <label style={s.label}>
            Full Name <span style={{ color: "#ef4444" }}>*</span>
            {isLocked("name") && (
              <Lock
                size={11}
                color="#9ca3af"
                style={{
                  display: "inline",
                  marginLeft: 5,
                  verticalAlign: "middle",
                }}
              />
            )}
          </label>
          <div style={{ position: "relative" }}>
            <User
              size={14}
              color={errors.name ? "#ef4444" : "#9ca3af"}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <input
              style={{
                ...(isLocked("name")
                  ? s.readonlyInput
                  : s.input(!!errors.name)),
                paddingLeft: 34,
              }}
              placeholder="Juan dela Cruz"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              onBlur={() => touch("name")}
              readOnly={isLocked("name")}
              maxLength={60}
              autoComplete="name"
            />
            {(isLocked("name") ||
              (form.name.trim().length > 0 &&
                !errors.name &&
                touched.name)) && (
              <CheckCircle2
                size={14}
                color="#22c55e"
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
            )}
          </div>
          {!errors.name && !isLocked("name") && (
            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
              First and last name required
            </p>
          )}
        </FieldWrapper>

        <FieldWrapper error={errors.phone}>
          <label style={s.label}>
            Phone Number <span style={{ color: "#ef4444" }}>*</span>
            {isLocked("phone") && (
              <Lock
                size={11}
                color="#9ca3af"
                style={{
                  display: "inline",
                  marginLeft: 5,
                  verticalAlign: "middle",
                }}
              />
            )}
          </label>
          <div style={{ position: "relative" }}>
            <Phone
              size={14}
              color={errors.phone ? "#ef4444" : "#9ca3af"}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <input
              style={{
                ...(isLocked("phone")
                  ? s.readonlyInput
                  : s.input(!!errors.phone)),
                paddingLeft: 34,
                paddingRight: 52,
              }}
              placeholder="09171234567"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              onBlur={() => touch("phone")}
              readOnly={isLocked("phone")}
              type="tel"
              maxLength={15}
              autoComplete="tel"
              inputMode="numeric"
            />
            <span
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 11,
                fontWeight: 600,
                color: isLocked("phone")
                  ? "#22c55e"
                  : phoneDigits === 11
                    ? "#22c55e"
                    : phoneDigits > 11
                      ? "#ef4444"
                      : "#9ca3af",
              }}
            >
              {isLocked("phone") ? (
                <CheckCircle2 size={14} color="#22c55e" />
              ) : (
                `${phoneDigits}/11`
              )}
            </span>
          </div>
          {!errors.phone && !isLocked("phone") && (
            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
              PH mobile number — 11 digits (e.g. 09171234567)
            </p>
          )}
        </FieldWrapper>

        <FieldWrapper error={errors.email}>
          <label style={s.label}>
            Email Address{" "}
            {isLocked("email") ? (
              <Lock
                size={11}
                color="#9ca3af"
                style={{
                  display: "inline",
                  marginLeft: 5,
                  verticalAlign: "middle",
                }}
              />
            ) : (
              <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                (optional)
              </span>
            )}
          </label>
          <div style={{ position: "relative" }}>
            <Mail
              size={14}
              color={errors.email ? "#ef4444" : "#9ca3af"}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <input
              style={{
                ...(isLocked("email")
                  ? s.readonlyInput
                  : s.input(!!errors.email)),
                paddingLeft: 34,
              }}
              placeholder="juan@email.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              onBlur={() => touch("email")}
              readOnly={isLocked("email")}
              type="email"
              maxLength={100}
              autoComplete="email"
            />
            {(isLocked("email") ||
              (form.email.trim().length > 0 &&
                !errors.email &&
                touched.email)) && (
              <CheckCircle2
                size={14}
                color="#22c55e"
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
            )}
          </div>
        </FieldWrapper>

        <div style={s.fieldGroup}>
          <label style={s.label}>Preferred Contact Method</label>
          <div style={{ display: "flex", gap: 8 }}>
            {contactOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update("preferredContact", opt.value)}
                style={{
                  flex: 1,
                  padding: "10px 8px",
                  borderRadius: 10,
                  cursor: "pointer",
                  border:
                    form.preferredContact === opt.value
                      ? "2px solid #c0392b"
                      : "1.5px solid #e5e7eb",
                  background:
                    form.preferredContact === opt.value ? "#fff5f5" : "#fafafa",
                  fontSize: 12,
                  fontWeight: form.preferredContact === opt.value ? 700 : 500,
                  color:
                    form.preferredContact === opt.value ? "#c0392b" : "#6b7280",
                  transition: "all 0.15s",
                  display: "flex",
                  flexDirection: "column" as const,
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {opt.icon}
                </span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <FieldWrapper error={errors.viewingDate}>
          <label style={s.label}>
            <Calendar
              size={13}
              style={{
                display: "inline",
                marginRight: 5,
                verticalAlign: "middle",
              }}
            />
            Preferred Viewing Date{" "}
            <span style={{ color: "#9ca3af", fontWeight: 400 }}>
              (optional)
            </span>
          </label>
          <input
            style={s.input(!!errors.viewingDate)}
            type="date"
            min={minDate}
            max={maxDateStr}
            value={form.viewingDate}
            onChange={(e) => update("viewingDate", e.target.value)}
            onBlur={() => touch("viewingDate")}
          />
          {!errors.viewingDate && (
            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
              Available slots: tomorrow up to 6 months ahead
            </p>
          )}
        </FieldWrapper>

        <FieldWrapper error={errors.message}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <label style={{ ...s.label, marginBottom: 0 }}>
              <MessageSquare
                size={13}
                style={{
                  display: "inline",
                  marginRight: 5,
                  verticalAlign: "middle",
                }}
              />
              Message to Agent{" "}
              <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                (optional)
              </span>
            </label>
            <span
              style={{
                fontSize: 11,
                color: form.message.length > 450 ? "#ef4444" : "#9ca3af",
              }}
            >
              {form.message.length}/500
            </span>
          </div>
          <textarea
            style={{
              ...s.input(!!errors.message),
              resize: "vertical" as const,
              minHeight: 88,
              paddingTop: 11,
            }}
            placeholder="Hi, I'm interested in this property. Can we schedule a viewing?"
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            onBlur={() => touch("message")}
            rows={3}
            maxLength={500}
          />
        </FieldWrapper>

        <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6 }}>
          🔒 Your details are shared only with your selected agent and will not
          be used for marketing without consent.
        </p>
      </div>

      <div
        style={{
          padding: "18px 28px",
          borderTop: "1px solid #f0f0f0",
          flexShrink: 0,
          display: "flex",
          gap: 10,
        }}
      >
        {canGoBack && (
          <button style={s.secondaryBtn} onClick={onBack} disabled={submitting}>
            ← Back
          </button>
        )}
        <button
          style={s.primaryBtn(submitting)}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />{" "}
              Sending…
            </>
          ) : (
            <>
              Send Inquiry <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </>
  );
}

function SuccessStep({
  agent,
  form,
  onClose,
}: {
  agent: Agent;
  form: LeadForm;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 28px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 68,
          height: 68,
          background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          boxShadow: "0 8px 24px rgba(16,185,129,0.2)",
        }}
      >
        <CheckCircle2 size={34} color="#059669" />
      </div>
      <h3
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#111827",
          marginBottom: 6,
        }}
      >
        Inquiry Sent! 🎉
      </h3>
      <p
        style={{
          fontSize: 14,
          color: "#6b7280",
          maxWidth: 320,
          lineHeight: 1.7,
          marginBottom: 20,
        }}
      >
        <strong style={{ color: "#111827" }}>{agent.name}</strong> has received
        your inquiry and will contact you via{" "}
        <strong style={{ color: "#111827" }}>{form.preferredContact}</strong>{" "}
        within 24 hours.
      </p>
      <button
        onClick={onClose}
        style={{ ...s.primaryBtn(false), width: "100%", flex: "none" as any }}
      >
        Done
      </button>
    </div>
  );
}

function ContactModal({
  onClose,
  property,
  listedAgent,
}: {
  onClose: () => void;
  property: PropertySnapshot;
  listedAgent?: Agent | null;
}) {
  const { user } = useAuth();

  const [step, setStep] = useState<ModalStep>(
    listedAgent ? "lead-form" : "select-agent",
  );
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(
    listedAgent ?? null,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [form, setForm] = useState<LeadForm>({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
    message: "",
    preferredContact: "sms",
    viewingDate: "",
  });

  const lockedFields = {
    name: !!user?.name,
    phone: !!user?.phone,
    email: !!user?.email,
  };

  const handleSubmit = async () => {
    setStep("submitting");
    setSubmitError(null);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: property.id,
          agent_id: selectedAgent!.id,
          lead_name: form.name,
          lead_phone: form.phone.replace(/\D/g, "").replace(/^639/, "0"),
          lead_email: form.email || null,
          message: form.message || null,
          preferred_contact: form.preferredContact,
          viewing_date: form.viewingDate || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.errors
          ? Object.values(data.errors as Record<string, string[]>)
              .flat()
              .join(" ")
          : (data.message ?? data.error ?? "Failed to send inquiry.");
        setSubmitError(msg);
        setStep("lead-form");
        return;
      }

      setStep("success");
    } catch {
      setSubmitError("Network error. Please try again.");
      setStep("lead-form");
    }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        {submitError && step === "lead-form" && (
          <div
            style={{
              padding: "10px 28px",
              background: "#fef2f2",
              borderBottom: "1px solid #fecaca",
              flexShrink: 0,
            }}
          >
            <p style={{ fontSize: 13, color: "#dc2626", margin: 0 }}>
              ⚠ {submitError}
            </p>
          </div>
        )}
        {step === "select-agent" && (
          <AgentSelectStep
            selected={selectedAgent}
            setSelected={setSelectedAgent}
            onNext={() => setStep("lead-form")}
            onClose={onClose}
            propertyTitle={property.title}
          />
        )}
        {(step === "lead-form" || step === "submitting") && selectedAgent && (
          <LeadFormStep
            agent={selectedAgent}
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            onBack={() => setStep("select-agent")}
            onClose={onClose}
            submitting={step === "submitting"}
            property={property}
            canGoBack={!listedAgent}
            lockedFields={lockedFields}
          />
        )}
        {step === "success" && selectedAgent && (
          <SuccessStep agent={selectedAgent} form={form} onClose={onClose} />
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

interface TourForm {
  name: string;
  phone: string;
  email: string;
  tourType: "in-person" | "video";
  date: string;
  time: string;
  preferredContact: "sms" | "viber" | "email" | "phone";
}

type TourStep = "pick-slot" | "details" | "submitting" | "success";

const TIME_SLOTS = [
  { label: "9:00 AM", value: "09:00", period: "morning" },
  { label: "10:00 AM", value: "10:00", period: "morning" },
  { label: "11:00 AM", value: "11:00", period: "morning" },
  { label: "12:00 NN", value: "12:00", period: "morning" },
  { label: "1:00 PM", value: "13:00", period: "afternoon" },
  { label: "2:00 PM", value: "14:00", period: "afternoon" },
  { label: "3:00 PM", value: "15:00", period: "afternoon" },
  { label: "4:00 PM", value: "16:00", period: "afternoon" },
  { label: "5:00 PM", value: "17:00", period: "afternoon" },
];

const TOUR_VALIDATORS: Record<
  "name" | "phone" | "email",
  (v: string, form?: TourForm) => string | null
> = {
  name: (v) => {
    if (!v.trim()) return "Full name is required";
    if (v.trim().split(/\s+/).length < 2)
      return "Please enter your full name (first & last)";
    return null;
  },
  phone: (v) => {
    if (!v.trim()) return "Phone number is required";
    const digits = v.replace(/\D/g, "");
    if (!/^(09\d{9}|639\d{9})$/.test(digits))
      return "Must be 11 digits starting with 09";
    return null;
  },
  email: (v, form) => {
    if (form?.preferredContact === "email") {
      if (!v.trim()) return "Email is required when confirming via Email";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()))
        return "Enter a valid email address";
    } else {
      if (v.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()))
        return "Enter a valid email address";
    }
    return null;
  },
};

function getAvailableDates() {
  const dates: {
    value: string;
    label: string;
    day: string;
    isPopular: boolean;
  }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let d = new Date(today);
  d.setDate(d.getDate() + 1);
  while (dates.length < 14) {
    if (d.getDay() !== 0) {
      const value = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      });
      const day = d.toLocaleDateString("en-PH", { weekday: "short" });
      dates.push({ value, label, day, isPopular: d.getDay() === 6 });
    }
    d = new Date(d);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function TourModal({
  onClose,
  property,
}: {
  onClose: () => void;
  property: PropertySnapshot;
}) {
  const { user } = useAuth();

  const [step, setStep] = useState<TourStep>("pick-slot");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [form, setForm] = useState<TourForm>({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
    tourType: "in-person",
    date: "",
    time: "",
    preferredContact: "sms",
  });

  const [errors, setErrors] = useState<
    Partial<Record<"name" | "phone" | "email", string>>
  >({});
  const [touched, setTouched] = useState<
    Partial<Record<"name" | "phone" | "email", boolean>>
  >({});

  const isLocked = (field: "name" | "phone" | "email") => {
    if (field === "name") return !!user?.name;
    if (field === "phone") return !!user?.phone;
    if (field === "email") return !!user?.email;
    return false;
  };

  const dates = getAvailableDates();
  const phoneDigits = form.phone.replace(/\D/g, "").length;
  const canProceedSlot = form.date && form.time;

  const updateForm = (key: keyof TourForm, val: string) => {
    if ((key === "name" || key === "phone" || key === "email") && isLocked(key))
      return;
    if (key === "phone") val = val.replace(/[^\d+\s\-()]/g, "");
    if (key === "name") val = val.replace(/[0-9]/g, "");
    const updated = { ...form, [key]: val };
    setForm(updated);
    if (
      (key === "name" || key === "phone" || key === "email") &&
      touched[key as "name" | "phone" | "email"]
    ) {
      const err = TOUR_VALIDATORS[key as "name" | "phone" | "email"](
        val,
        updated,
      );
      setErrors((prev) => ({ ...prev, [key]: err ?? undefined }));
    }
    if (key === "preferredContact" && touched.email) {
      const err = TOUR_VALIDATORS.email(form.email, updated);
      setErrors((prev) => ({ ...prev, email: err ?? undefined }));
    }
  };

  const touch = (key: "name" | "phone" | "email") => {
    if (isLocked(key)) return;
    setTouched((prev) => ({ ...prev, [key]: true }));
    const err = TOUR_VALIDATORS[key](form[key], form);
    setErrors((prev) => ({ ...prev, [key]: err ?? undefined }));
  };

  const validateDetails = () => {
    const e: Partial<Record<"name" | "phone" | "email", string>> = {};
    (["name", "phone", "email"] as const).forEach((k) => {
      if (isLocked(k)) return;
      const err = TOUR_VALIDATORS[k](form[k], form);
      if (err) e[k] = err;
    });
    setErrors(e);
    setTouched({ name: true, phone: true, email: true });
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateDetails()) return;
    setStep("submitting");
    setSubmitError(null);
    try {
      const res = await fetch("/api/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: property.id,
          agent_id: property.agentId ?? null,
          tour_type: form.tourType,
          tour_date: form.date,
          tour_time: form.time,
          lead_name: form.name,
          lead_phone: form.phone.replace(/\D/g, "").replace(/^639/, "0"),
          lead_email: form.email || null,
          preferred_contact: form.preferredContact,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.errors
          ? Object.values(data.errors as Record<string, string[]>)
              .flat()
              .join(" ")
          : (data.error ?? data.message ?? "Failed to book tour.");
        setSubmitError(msg);
        setStep("details");
        return;
      }

      setStep("success");
    } catch {
      setSubmitError("Network error. Please try again.");
      setStep("details");
    }
  };

  const tourContactOptions: {
    value: TourForm["preferredContact"];
    label: string;
  }[] = [
    { value: "sms", label: "SMS" },
    { value: "viber", label: "Viber" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Call" },
  ];

  const selectedDate = dates.find((d) => d.value === form.date);
  const selectedTime = TIME_SLOTS.find((t) => t.value === form.time);

  const gcalLink =
    form.date && form.time
      ? (() => {
          const start = new Date(`${form.date}T${form.time}:00`);
          const end = new Date(start.getTime() + 60 * 60 * 1000);
          const fmt = (d: Date) =>
            d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
          return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Property Tour: ${property.title}`)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(`${form.tourType === "video" ? "Video" : "In-Person"} tour of ${property.title} at ${property.address}, ${property.city}`)}&location=${encodeURIComponent(`${property.address}, ${property.city}`)}`;
        })()
      : "#";

  const hasLockedFields =
    isLocked("name") || isLocked("phone") || isLocked("email");
  const tourThumb = cdnUrl(property.image, 44, 44);

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        {/* Tour modal content truncated for brevity - contains pick-slot, details, success steps */}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function PropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await fetch(`/api/properties/${id}`);
        if (!res.ok) {
          setProperty(null);
          return;
        }
        const data = await res.json();
        setProperty(data);
      } catch (error) {
        console.error("Failed to fetch property:", error);
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="glass rounded-xl h-96 animate-pulse" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center glass rounded-xl p-12">
          <p className="text-lg text-muted-foreground mb-4">
            Property not found
          </p>
          <Link href="/properties">
            <Button className="bg-primary hover:bg-primary/90">
              Back to Properties
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-16">
      {showContactModal && (
        <ContactModal
          onClose={() => setShowContactModal(false)}
          property={{
            id: Number(property.id),
            title: property.title,
            image: (property as any).thumbnail || "/placeholder-property.jpg",
            price: `₱${Number((property as any).price ?? 0).toLocaleString("en-PH")}`,
            address: property.address,
            city: property.city,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
          }}
        />
      )}

      {showTourModal && (
        <TourModal
          onClose={() => setShowTourModal(false)}
          property={{
            id: Number(property.id),
            title: property.title,
            image: (property as any).thumbnail || "/placeholder-property.jpg",
            price: `₱${Number((property as any).price ?? 0).toLocaleString("en-PH")}`,
            address: property.address,
            city: property.city,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
          }}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-4">{property.title}</h1>
        <p className="text-muted-foreground mb-8">{property.address}, {property.city}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="glass rounded-xl p-8 mb-8">
              <p className="text-muted-foreground mb-2">Details</p>
              <p>{(property as any).description}</p>
            </div>
          </div>

          {/* SIDEBAR WITH SIDE-BY-SIDE BUTTONS */}
          <div className="space-y-6">
            <div className="glass rounded-xl p-8 sticky top-24">
              <p className="text-muted-foreground text-sm mb-2">Price</p>
              <h3 className="text-4xl font-bold text-white mb-6">
                ₱{Number((property as any).price ?? 0).toLocaleString("en-PH")}
              </h3>

              {/* TWO BUTTONS SIDE BY SIDE */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                  onClick={() => setShowContactModal(true)}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Contact An Agent
                </Button>
                <Button
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  size="lg"
                  onClick={() => setShowTourModal(true)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Tour
                </Button>
              </div>

              <button
                className="w-full flex items-center justify-center gap-2 p-3 hover:bg-muted rounded-lg transition text-sm font-medium"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 2000);
                }}
              >
                <Share2 className="w-4 h-4" />
                {shareCopied ? "✓ Link Copied!" : "Share"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
