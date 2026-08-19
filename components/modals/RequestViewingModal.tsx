"use client";

import { useState, useEffect } from "react";
import {
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const TIME_SLOTS = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
];

interface PropertyOption {
  id: number | string;
  title: string;
  city?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// ── Validation helpers ─────────────────────────────────────────────────────
function validateEmail(email: string): string {
  if (!email.trim()) return "Email address is required.";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim())
    ? ""
    : "Please enter a valid email address (e.g. juan@email.com).";
}

function validatePhone(phone: string): string {
  if (!phone.trim()) return "Phone number is required.";
  if (!/^\d+$/.test(phone))
    return "Phone number must contain digits only — no letters or symbols.";
  if (phone.length !== 11) return "Phone number must be exactly 11 digits.";
  return "";
}
// ──────────────────────────────────────────────────────────────────────────

type FormField = "name" | "email" | "phone";

export function RequestViewingModal({ isOpen, onClose }: Props) {
  const today = new Date();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedProps, setSelectedProps] = useState<PropertyOption[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FormField, string>>
  >({});
  const [touched, setTouched] = useState<Partial<Record<FormField, boolean>>>(
    {},
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [propsLoading, setPropsLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || properties.length > 0) return;
    setPropsLoading(true);
    fetch("/api/properties?per_page=100&sort=priority")
      .then((r) => r.json())
      .then((data) => {
        const list: PropertyOption[] = (data.data ?? []).map((p: any) => ({
          id: p.id,
          title: p.title,
          city: p.city,
        }));
        setProperties(list);
      })
      .catch(console.error)
      .finally(() => setPropsLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const addProperty = (id: string) => {
    const prop = properties.find((p) => String(p.id) === id);
    if (prop && !selectedProps.find((p) => p.id === prop.id))
      setSelectedProps((prev) => [...prev, prop]);
  };

  const removeProperty = (id: number | string) =>
    setSelectedProps((prev) => prev.filter((p) => p.id !== id));

  const reset = () => {
    setSubmitted(false);
    setSubmitError(null);
    setSelectedDay(null);
    setSelectedTime("");
    setSelectedProps([]);
    setForm({ name: "", email: "", phone: "" });
    setFieldErrors({});
    setTouched({});
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Run validation for a single field and update state
  function runValidation(field: FormField, value: string): string {
    if (field === "email") return validateEmail(value);
    if (field === "phone") return validatePhone(value);
    return "";
  }

  const handleFieldChange = (field: FormField, rawValue: string) => {
    // Strip non-digits for phone as the user types
    const value = field === "phone" ? rawValue.replace(/\D/g, "") : rawValue;
    setForm((f) => ({ ...f, [field]: value }));
    if (touched[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: runValidation(field, value),
      }));
    }
  };

  const handleBlur = (field: FormField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({
      ...prev,
      [field]: runValidation(field, form[field]),
    }));
  };

  // Border colour helper
  const fieldBorderColor = (field: FormField) => {
    if (!touched[field]) return "rgba(0,0,0,0.12)";
    return fieldErrors[field] ? "rgba(231,76,60,0.7)" : "rgba(39,174,96,0.6)";
  };

  const handleSubmit = async () => {
    // Touch all validated fields and run full validation
    const emailErr = validateEmail(form.email);
    const phoneErr = validatePhone(form.phone);
    const nameErr = !form.name.trim() ? "Full name is required." : "";

    setTouched({ name: true, email: true, phone: true });
    setFieldErrors({ name: nameErr, email: emailErr, phone: phoneErr });

    if (nameErr || emailErr || phoneErr) {
      setSubmitError("Please fix the errors above before submitting.");
      return;
    }
    if (!selectedDay) {
      setSubmitError("Please select a preferred viewing date.");
      return;
    }
    if (!selectedTime) {
      setSubmitError("Please select a preferred time slot.");
      return;
    }
    if (selectedProps.length === 0) {
      setSubmitError("Please select at least one property to view.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const preferred_date = [
        selectedDay.getFullYear(),
        String(selectedDay.getMonth() + 1).padStart(2, "0"),
        String(selectedDay.getDate()).padStart(2, "0"),
      ].join("-");

      const res = await fetch("/api/request-viewing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          preferred_date,
          preferred_time: selectedTime,
          properties: selectedProps,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = json?.errors
          ? Object.values(json.errors as Record<string, string[]>)
              .flat()
              .join(" ")
          : (json?.error ?? "Something went wrong. Please try again.");
        setSubmitError(msg);
        return;
      }

      setSubmitted(true);
    } catch {
      setSubmitError(
        "Network error. Please check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inline field error element
  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? (
      <div
        style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}
      >
        <AlertCircle size={12} color="#c0392b" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: "#c0392b", fontWeight: 600 }}>
          {msg}
        </span>
      </div>
    ) : null;

  return (
    <>
      <style>{`
        .rv-scroll::-webkit-scrollbar{width:4px}
        .rv-scroll::-webkit-scrollbar-track{background:transparent}
        .rv-scroll::-webkit-scrollbar-thumb{background:rgba(100,100,100,0.3);border-radius:4px}
        .rv-input{
          width:100%;padding:12px 16px;border-radius:12px;
          background:rgba(0,0,0,0.06);
          color:#1a1a1a;font-size:14px;font-family:inherit;outline:none;transition:border-color .2s,background .2s;
          box-sizing:border-box;
        }
        .rv-input::placeholder{color:rgba(0,0,0,0.3)}
        .rv-input:focus{background:#fff}
        .rv-cal-day{
          text-align:center;padding:7px 2px;border-radius:8px;font-size:12px;
          cursor:pointer;transition:all .15s;background:transparent;
          border:1px solid transparent;color:rgba(0,0,0,0.5);font-family:inherit;
        }
        .rv-cal-day:hover:not(:disabled){background:rgba(231,76,60,0.1);color:#c0392b;border-color:rgba(231,76,60,0.2)}
        .rv-cal-day:disabled{color:rgba(0,0,0,0.2);cursor:not-allowed}
        .rv-cal-day.sel{background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;font-weight:700;border-color:rgba(231,76,60,0.6)}
        .rv-cal-day.tod:not(.sel){color:#e74c3c;font-weight:600}
        .rv-time{
          padding:9px 6px;border-radius:10px;font-size:12px;font-family:inherit;
          cursor:pointer;text-align:center;transition:all .15s;
          background:rgba(0,0,0,0.04);border:1px solid rgba(0,0,0,0.1);
          color:rgba(0,0,0,0.5);
        }
        .rv-time:hover{background:rgba(231,76,60,0.08);color:#c0392b;border-color:rgba(231,76,60,0.25)}
        .rv-time.sel{background:rgba(231,76,60,0.12);border-color:rgba(231,76,60,0.45);color:#c0392b;font-weight:600}
        .rv-select{
          width:100%;padding:12px 16px;border-radius:12px;
          background:rgba(0,0,0,0.04);border:1px solid rgba(0,0,0,0.12);
          color:rgba(0,0,0,0.6);font-size:13px;font-family:inherit;
          outline:none;cursor:pointer;transition:border-color .2s;
        }
        .rv-select:focus{border-color:rgba(231,76,60,0.5)}
        .rv-select option{background:#fff;color:#1a1a1a}
        .rv-submit{
          width:100%;padding:15px;border-radius:14px;
          background:linear-gradient(135deg,#e74c3c,#c0392b);border:none;
          color:#fff;font-size:15px;font-weight:700;font-family:inherit;cursor:pointer;
          display:flex;align-items:center;justify-content:center;gap:8px;transition:all .2s;
        }
        .rv-submit:hover:not(:disabled){opacity:.9;transform:translateY(-1px)}
        .rv-submit:active:not(:disabled){transform:scale(.99)}
        .rv-submit:disabled{opacity:.55;cursor:not-allowed}
        .rv-label{
          display:block;font-size:10px;font-weight:700;
          color:rgba(0,0,0,0.4);letter-spacing:.15em;
          text-transform:uppercase;margin-bottom:8px;
        }
        @keyframes rvFadeIn{
          from{opacity:0;transform:scale(.96) translateY(8px)}
          to{opacity:1;transform:scale(1) translateY(0)}
        }
        .rv-animate{animation:rvFadeIn .22s ease-out both}
        @media(max-width:480px){
          .rv-two-col{grid-template-columns:1fr !important}
          .rv-time-grid{grid-template-columns:repeat(2,1fr) !important}
        }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        {/* Modal panel */}
        <div
          className="rv-animate rv-scroll"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 560,
            maxHeight: "92vh",
            overflowY: "auto",
            borderRadius: 20,
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
          }}
        >
          {/* ── Sticky Header ── */}
          <div
            style={{
              background: "#ffffff",
              borderBottom: "1px solid rgba(0,0,0,0.08)",
              padding: "24px 28px 20px",
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            <button
              onClick={handleClose}
              style={{
                position: "absolute",
                top: 18,
                right: 18,
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.1)",
                color: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={14} />
            </button>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(231,76,60,0.08)",
                border: "1px solid rgba(231,76,60,0.25)",
                borderRadius: 100,
                padding: "4px 12px",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  background: "#e74c3c",
                  borderRadius: "50%",
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#e74c3c",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Alfima Realty
              </span>
            </div>
            <h2
              style={{
                color: "#1a1a1a",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              Connect to an Agent
            </h2>
            <p
              style={{ color: "rgba(0,0,0,0.45)", fontSize: 13, marginTop: 4 }}
            >
              Fill in your details and we'll confirm your schedule
            </p>
          </div>

          {/* ── Success State ── */}
          {submitted ? (
            <div style={{ padding: "64px 28px", textAlign: "center" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(39,174,96,0.1)",
                  border: "1px solid rgba(39,174,96,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Check size={24} color="#27ae60" />
              </div>
              <h3
                style={{
                  color: "#1a1a1a",
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Request Sent!
              </h3>
              <p
                style={{
                  color: "rgba(0,0,0,0.45)",
                  fontSize: 14,
                  lineHeight: 1.7,
                  marginBottom: 28,
                }}
              >
                Our agents will reach out within 24 hours to confirm your
                viewing schedule.
              </p>
              <button
                onClick={reset}
                style={{
                  padding: "12px 28px",
                  borderRadius: 14,
                  background: "linear-gradient(135deg,#e74c3c,#c0392b)",
                  border: "none",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <>
              {/* ── Form Body ── */}
              <div
                style={{
                  padding: "24px 28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                {/* Name + Phone */}
                <div
                  className="rv-two-col"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                  }}
                >
                  {/* Full Name */}
                  <div>
                    <label className="rv-label">Full Name</label>
                    <input
                      className="rv-input"
                      type="text"
                      placeholder="Juan dela Cruz"
                      value={form.name}
                      onChange={(e) =>
                        handleFieldChange("name", e.target.value)
                      }
                      onBlur={() => handleBlur("name")}
                      style={{
                        border: `1px solid ${fieldBorderColor("name")}`,
                      }}
                    />
                    <FieldError msg={fieldErrors.name} />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="rv-label">
                      Phone Number
                      <span
                        style={{
                          fontWeight: 400,
                          letterSpacing: 0,
                          textTransform: "none",
                          color: "rgba(0,0,0,0.3)",
                          marginLeft: 4,
                        }}
                      >
                        (11 digits)
                      </span>
                    </label>
                    <input
                      className="rv-input"
                      type="tel"
                      inputMode="numeric"
                      placeholder="09171234567"
                      maxLength={11}
                      value={form.phone}
                      onChange={(e) =>
                        handleFieldChange("phone", e.target.value)
                      }
                      onBlur={() => handleBlur("phone")}
                      style={{
                        border: `1px solid ${fieldBorderColor("phone")}`,
                      }}
                    />
                    <FieldError msg={fieldErrors.phone} />
                    {/* Character counter */}
                    {form.phone.length > 0 && (
                      <div
                        style={{
                          textAlign: "right",
                          fontSize: 11,
                          marginTop: 4,
                          fontWeight: 600,
                          color:
                            form.phone.length === 11
                              ? "rgba(39,174,96,0.8)"
                              : "rgba(0,0,0,0.3)",
                        }}
                      >
                        {form.phone.length}/11
                      </div>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="rv-label">Email Address</label>
                  <input
                    className="rv-input"
                    type="email"
                    placeholder="juan@email.com"
                    value={form.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    style={{ border: `1px solid ${fieldBorderColor("email")}` }}
                  />
                  <FieldError msg={fieldErrors.email} />
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(0,0,0,0.07)" }} />

                {/* Calendar */}
                <div>
                  <label className="rv-label">Preferred Viewing Date</label>
                  <div
                    style={{
                      background: "rgba(0,0,0,0.02)",
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 14,
                      padding: 16,
                    }}
                  >
                    {/* Month nav */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 14,
                      }}
                    >
                      <button
                        onClick={prevMonth}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: "rgba(0,0,0,0.05)",
                          border: "1px solid rgba(0,0,0,0.1)",
                          color: "rgba(0,0,0,0.5)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span
                        style={{
                          color: "#1a1a1a",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {MONTHS[viewMonth]} {viewYear}
                      </span>
                      <button
                        onClick={nextMonth}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: "rgba(0,0,0,0.05)",
                          border: "1px solid rgba(0,0,0,0.1)",
                          color: "rgba(0,0,0,0.5)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    {/* Day-of-week headers */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7,1fr)",
                        gap: 3,
                      }}
                    >
                      {DAYS.map((d) => (
                        <div
                          key={d}
                          style={{
                            textAlign: "center",
                            fontSize: 10,
                            color: "rgba(0,0,0,0.35)",
                            fontWeight: 600,
                            padding: "4px 0",
                            letterSpacing: ".06em",
                          }}
                        >
                          {d}
                        </div>
                      ))}
                      {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`e${i}`} />
                      ))}
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                        (d) => {
                          const dt = new Date(viewYear, viewMonth, d);
                          const isPast =
                            dt <
                            new Date(
                              today.getFullYear(),
                              today.getMonth(),
                              today.getDate(),
                            );
                          const isSel =
                            selectedDay?.getDate() === d &&
                            selectedDay?.getMonth() === viewMonth &&
                            selectedDay?.getFullYear() === viewYear;
                          const isToday =
                            d === today.getDate() &&
                            viewMonth === today.getMonth() &&
                            viewYear === today.getFullYear();
                          return (
                            <button
                              key={d}
                              disabled={isPast}
                              onClick={() => setSelectedDay(dt)}
                              className={[
                                "rv-cal-day",
                                isSel ? "sel" : "",
                                isToday ? "tod" : "",
                              ].join(" ")}
                            >
                              {d}
                            </button>
                          );
                        },
                      )}
                    </div>

                    {/* Time slots */}
                    <div
                      style={{
                        marginTop: 14,
                        paddingTop: 12,
                        borderTop: "1px solid rgba(0,0,0,0.07)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "rgba(0,0,0,0.35)",
                          letterSpacing: ".12em",
                          textTransform: "uppercase",
                          marginBottom: 8,
                        }}
                      >
                        Preferred Time Slot
                      </div>
                      <div
                        className="rv-time-grid"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4,1fr)",
                          gap: 8,
                        }}
                      >
                        {TIME_SLOTS.map((t) => (
                          <button
                            key={t}
                            onClick={() => setSelectedTime(t)}
                            className={`rv-time${selectedTime === t ? " sel" : ""}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {selectedDay && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "rgba(192,57,43,0.8)",
                        marginTop: 8,
                        paddingLeft: 4,
                      }}
                    >
                      Selected:{" "}
                      {selectedDay.toLocaleDateString("en-PH", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      {selectedTime && ` · ${selectedTime}`}
                    </p>
                  )}
                </div>

                {/* Properties to View */}
                <div>
                  <label className="rv-label">Properties to View</label>
                  {propsLoading ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "12px 16px",
                        borderRadius: 12,
                        background: "rgba(0,0,0,0.04)",
                        border: "1px solid rgba(0,0,0,0.1)",
                      }}
                    >
                      <Loader2
                        size={14}
                        color="rgba(0,0,0,0.3)"
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                      <span style={{ fontSize: 13, color: "rgba(0,0,0,0.35)" }}>
                        Loading properties…
                      </span>
                    </div>
                  ) : (
                    <select
                      className="rv-select"
                      onChange={(e) => {
                        addProperty(e.target.value);
                        e.currentTarget.value = "";
                      }}
                    >
                      <option value="">— Select a property —</option>
                      {properties.map((p) => (
                        <option key={p.id} value={String(p.id)}>
                          {p.title}
                          {p.city ? ` · ${p.city}` : ""}
                        </option>
                      ))}
                    </select>
                  )}

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      marginTop: 8,
                      minHeight: 30,
                    }}
                  >
                    {selectedProps.length === 0 ? (
                      <span
                        style={{
                          fontSize: 11,
                          color: "rgba(0,0,0,0.25)",
                          padding: "4px 0",
                        }}
                      >
                        No properties selected yet
                      </span>
                    ) : (
                      selectedProps.map((p) => (
                        <span
                          key={p.id}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            background: "rgba(231,76,60,0.08)",
                            border: "1px solid rgba(231,76,60,0.25)",
                            borderRadius: 100,
                            padding: "4px 10px",
                            fontSize: 11,
                            color: "#c0392b",
                          }}
                        >
                          {p.title}
                          <button
                            onClick={() => removeProperty(p.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#c0392b",
                              cursor: "pointer",
                              fontSize: 13,
                              lineHeight: 1,
                              padding: 0,
                              opacity: 0.7,
                            }}
                          >
                            ✕
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* ── Error banner ── */}
                {submitError && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "12px 16px",
                      borderRadius: 12,
                      background: "rgba(231,76,60,0.06)",
                      border: "1px solid rgba(231,76,60,0.3)",
                      fontSize: 13,
                      color: "#c0392b",
                      lineHeight: 1.5,
                    }}
                  >
                    <AlertCircle
                      size={15}
                      style={{ flexShrink: 0, marginTop: 1 }}
                    />
                    <span>{submitError}</span>
                  </div>
                )}
              </div>

              {/* ── Footer ── */}
              <div style={{ padding: "0 28px 28px" }}>
                <button
                  className="rv-submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        size={16}
                        style={{ animation: "spin 1s linear infinite" }}
                      />{" "}
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Check size={16} /> Confirm Viewing Request
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
