"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/store";

type Role = "buyer" | "agent";

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: Role;
}

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuth((state) => state.setUser);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FormData, string>>
  >({});
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "buyer",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const val =
      name === "phone" ? value.replace(/\D/g, "").slice(0, 11) : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    if (error) setError("");
  };

  const setRole = (role: Role) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const validate = () => {
    const e: typeof fieldErrors = {};
    if (!formData.name.trim()) e.name = "Full name is required";
    else if (formData.name.trim().split(/\s+/).length < 2)
      e.name = "Please enter first and last name";
    if (!formData.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email))
      e.email = "Enter a valid email";
    if (!formData.phone) e.phone = "Phone number is required";
    else if (!/^09\d{9}$/.test(formData.phone))
      e.phone = "Must be 11 digits starting with 09";
    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 8) e.password = "Minimum 8 characters";
    if (!formData.confirmPassword)
      e.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        return;
      }
      if (data.user) setUser(data.user);
      router.replace(formData.role === "agent" ? "/agent/dashboard" : "/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const phoneDigits = formData.phone.length;
  const passwordsMatch =
    formData.confirmPassword && formData.password === formData.confirmPassword;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "'Georgia', serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }

        .reg-wrap { display: flex; min-height: 100vh; width: 100%; background: #f5f0e8; }

        /* ── Hero panel — identical to login ── */
        .hero-panel {
          flex: 1; position: relative; overflow: hidden;
          background: #1a1208; display: none;
        }
        @media (min-width: 1024px) { .hero-panel { display: flex; flex-direction: column; justify-content: flex-end; } }

        .hero-bg {
          position: absolute; inset: 0;
          background:
            linear-gradient(to bottom, rgba(15,8,2,0.35) 0%, rgba(15,8,2,0.75) 100%),
            url('login-background.png') center/cover no-repeat;
        }
        .hero-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(201,168,76,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.06) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .hero-content { position: relative; z-index: 2; padding: 48px 52px; }

        /* ── Tag — same big size as login ── */
        .hero-tag {
          display: inline-block;
          font-family: 'DM Sans', sans-serif;
          font-size: 24px; font-weight: 500;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: #fff; border: 1px solid rgba(255,255,255,0.5);
          padding: 8px 18px; margin-bottom: 20px;
        }

        /* ── Headline — same two-line style as login ── */
        .hero-headline {
          font-family: 'Cormorant Garamond', serif;
          font-size: 54px; font-weight: 400; color: #fff;
          line-height: 1.2; margin: 0 0 16px;
        }
        .hero-sub {
          font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 300;
          color: rgba(255,255,255,0.45); letter-spacing: 0.04em; margin: 0;
        }

        /* ── Form panel ── */
  .form-panel {
  width: 100%; max-width: 520px; background: #faf7f2;
  display: flex; flex-direction: column; justify-content: flex-start;
  padding: 160px 44px 48px;  /* 160px top matches login's centered look */
  position: relative;
  border-left: 1px solid #e8e0d0; overflow-y: auto;
  min-height: 100vh;
}
        .top-accent {
          position: fixed; top: 0; right: 0; width: 520px; height: 3px;
          background: linear-gradient(90deg, #b8892e, #e8c96a, #b8892e); z-index: 10;
        }
        @media (max-width: 1023px) { .top-accent { width: 100%; } }

        /* ── Logo row — same as login (72px box) ── */
        .logo-row { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  margin-bottom: 36px;   /* was 32px in old register */
  margin-top: 8px; 
}
.logo-box { 
  width: 72px;           /* was 48px in old register */
  height: 72px;          /* was 48px in old register */
  border-radius: 10px; 
  overflow: hidden; 
  flex-shrink: 0; 
}
        .logo-box img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .logo-text {
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          color: #1a1208; letter-spacing: 0.12em; text-transform: uppercase;
        }

        .heading-block { margin-bottom: 28px; }
        .heading-block h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 38px; font-weight: 400; color: #1a1208;
          margin: 0 0 6px; line-height: 1.15;
        }
        .heading-block h1 em { color: #b8892e; font-style: italic; }
        .heading-block p {
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 300;
          color: #8a7c6a; margin: 0; letter-spacing: 0.02em;
        }
        .heading-block p a { color: #b8892e; text-decoration: none; font-weight: 500; }
        .heading-block p a:hover { text-decoration: underline; }

        .error-box {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px;
          background: rgba(220,38,38,0.06);
          border: 1px solid rgba(220,38,38,0.18);
          border-radius: 2px; margin-bottom: 20px;
        }
        .error-box p { font-family: 'DM Sans', sans-serif; font-size: 13px; color: #dc2626; margin: 0; }

        .section-divider { display: flex; align-items: center; gap: 12px; margin: 4px 0 20px; }
        .div-line { flex: 1; height: 1px; background: #e4dace; }
        .div-text {
          font-family: 'DM Sans', sans-serif; font-size: 10px;
          color: #b0a090; letter-spacing: 0.14em; text-transform: uppercase;
        }

        .role-grid { display: flex; gap: 10px; margin-bottom: 24px; }
        .role-btn {
          flex: 1; padding: 14px 12px; background: #fff;
          border: 1px solid #ddd5c4; border-radius: 2px;
          cursor: pointer; transition: all 0.2s; text-align: left;
        }
        .role-btn.active {
          border-color: #b8892e; background: rgba(184,137,46,0.04);
          box-shadow: 0 0 0 3px rgba(184,137,46,0.1);
        }
        .role-btn:hover:not(.active) { border-color: #c2b8a8; }
        .role-icon { font-size: 18px; margin-bottom: 6px; }
        .role-title {
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          color: #1a1208; margin: 0 0 2px; letter-spacing: 0.02em;
        }
        .role-btn.active .role-title { color: #b8892e; }
        .role-sub {
          font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 300;
          color: #a89880; margin: 0; letter-spacing: 0.02em;
        }

        .field { margin-bottom: 18px; }
        .field-label {
          display: block; font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: #8a7c6a; margin-bottom: 6px;
        }
        .field-label .req { color: #b8892e; }
        .field-input {
          width: 100%; background: #fff;
          border: 1px solid #ddd5c4; border-radius: 2px;
          padding: 11px 14px;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 400;
          color: #1a1208; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          letter-spacing: 0.02em;
        }
        .field-input::placeholder { color: #c2b8a8; }
        .field-input:focus { border-color: #b8892e; box-shadow: 0 0 0 3px rgba(184,137,46,0.1); }
        .field-input.has-error { border-color: rgba(220,38,38,0.4); }
        .field-input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
          -webkit-text-fill-color: #1a1208 !important;
        }
        .field-err { font-family: 'DM Sans', sans-serif; font-size: 11px; color: #dc2626; margin-top: 5px; }
        .field-hint { font-family: 'DM Sans', sans-serif; font-size: 11px; color: #b0a090; margin-top: 5px; }
        .field-ok {
          font-family: 'DM Sans', sans-serif; font-size: 11px; color: #b8892e;
          margin-top: 5px; display: flex; align-items: center; gap: 4px;
        }

        .pw-wrap { position: relative; }
        .pw-toggle {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #a89880; padding: 0; display: flex;
        }
        .phone-counter {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500;
          pointer-events: none;
        }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .submit-btn {
          width: 100%; padding: 13px; background: #1a1208; border: none;
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: #c9a84c; cursor: pointer;
          transition: background 0.2s, opacity 0.2s;
          margin-top: 20px; margin-bottom: 16px;
          border-radius: 2px; position: relative; overflow: hidden;
        }
        .submit-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, transparent 40%, rgba(201,168,76,0.12) 100%);
        }
        .submit-btn:hover:not(:disabled) { background: #2c2010; }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .spinner {
          width: 12px; height: 12px;
          border: 1.5px solid rgba(201,168,76,0.3);
          border-top-color: #c9a84c; border-radius: 50%;
          display: inline-block; animation: spin 0.8s linear infinite;
        }

        .divider { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .divider-line { flex: 1; height: 1px; background: #e4dace; }
        .divider-text {
          font-family: 'DM Sans', sans-serif; font-size: 10px;
          color: #b0a090; letter-spacing: 0.14em; text-transform: uppercase;
        }

        .signin-row {
          text-align: center; font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 300; color: #8a7c6a; margin: 0;
        }
        .signin-row a { color: #b8892e; text-decoration: none; font-weight: 500; }
        .signin-row a:hover { text-decoration: underline; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
      `}</style>

      <div className="reg-wrap">
        {/* ── Hero panel — matches login exactly ── */}
        <div className="hero-panel">
          <div className="hero-bg" />
          <div className="hero-grid" />
          <div className="hero-content">
            <div className="hero-tag">Alfima Realty Inc.</div>
            <h2 className="hero-headline">
              <span
                style={{
                  fontSize: 24,
                  letterSpacing: "0.22em",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 500,
                }}
              >
                PREMIUM PROPERTIES
              </span>
              <br />
              <em style={{ fontStyle: "italic", color: "#c9a84c" }}>
                Across the Philippines
              </em>
            </h2>
            <p className="hero-sub">
              Your trusted partner in luxury real estate
            </p>
          </div>
        </div>

        {/* ── Form panel ── */}
        <div className="form-panel">
          <div className="top-accent" />
          <div className="fade-up">
            {/* Logo — same 72px size and margin as login */}
            <div className="logo-row">
              <div className="logo-box">
                <img src="/alfima.png" alt="Alfima" />
              </div>
              <span className="logo-text">Alfima Realty Inc.</span>
            </div>

            <div className="heading-block">
              <h1>
                Create <em>account.</em>
              </h1>
              <p>
                Already have one? <Link href="/login">Sign in</Link>
              </p>
            </div>

            {error && (
              <div className="error-box">
                <AlertCircle size={14} color="#dc2626" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Role selector */}
              <div style={{ marginBottom: 24 }}>
                <label className="field-label">I am a</label>
                <div className="role-grid">
                  {[
                    {
                      value: "buyer" as Role,
                      label: "Buyer / Renter",
                      sub: "Browse & inquire",
                      icon: "🏠",
                    },
                    {
                      value: "agent" as Role,
                      label: "Real Estate Agent",
                      sub: "List & manage",
                      icon: "🏢",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      className={`role-btn ${formData.role === opt.value ? "active" : ""}`}
                    >
                      <div className="role-icon">{opt.icon}</div>
                      <p className="role-title">{opt.label}</p>
                      <p className="role-sub">{opt.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="section-divider">
                <div className="div-line" />
                <span className="div-text">Personal Details</span>
                <div className="div-line" />
              </div>

              <div className="field">
                <label className="field-label">
                  Full Name <span className="req">*</span>
                </label>
                <input
                  className={`field-input${fieldErrors.name ? " has-error" : ""}`}
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Juan dela Cruz"
                  autoComplete="name"
                />
                {fieldErrors.name ? (
                  <p className="field-err">⚠ {fieldErrors.name}</p>
                ) : (
                  <p className="field-hint">First and last name required</p>
                )}
              </div>

              <div className="field">
                <label className="field-label">
                  Email Address <span className="req">*</span>
                </label>
                <input
                  className={`field-input${fieldErrors.email ? " has-error" : ""}`}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="juan@example.com"
                  autoComplete="email"
                />
                {fieldErrors.email && (
                  <p className="field-err">⚠ {fieldErrors.email}</p>
                )}
              </div>

              <div className="field">
                <label className="field-label">
                  Phone Number <span className="req">*</span>
                </label>
                <div className="pw-wrap">
                  <input
                    className={`field-input${fieldErrors.phone ? " has-error" : ""}`}
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="09171234567"
                    inputMode="numeric"
                    style={{ paddingRight: 52 }}
                  />
                  <span
                    className="phone-counter"
                    style={{
                      color: phoneDigits === 11 ? "#b8892e" : "#c2b8a8",
                    }}
                  >
                    {phoneDigits}/11
                  </span>
                </div>
                {fieldErrors.phone ? (
                  <p className="field-err">⚠ {fieldErrors.phone}</p>
                ) : (
                  <p className="field-hint">
                    PH mobile — 11 digits (e.g. 09171234567)
                  </p>
                )}
              </div>

              <div className="section-divider" style={{ marginTop: 8 }}>
                <div className="div-line" />
                <span className="div-text">Security</span>
                <div className="div-line" />
              </div>

              <div className="field-row">
                <div className="field">
                  <label className="field-label">
                    Password <span className="req">*</span>
                  </label>
                  <div className="pw-wrap">
                    <input
                      className={`field-input${fieldErrors.password ? " has-error" : ""}`}
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      style={{ paddingRight: 40 }}
                    />
                    <button
                      type="button"
                      className="pw-toggle"
                      onClick={() => setShowPassword((p) => !p)}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="field-err">⚠ {fieldErrors.password}</p>
                  )}
                </div>

                <div className="field">
                  <label className="field-label">
                    Confirm <span className="req">*</span>
                  </label>
                  <div className="pw-wrap">
                    <input
                      className={`field-input${fieldErrors.confirmPassword ? " has-error" : ""}`}
                      type={showConfirm ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      style={{ paddingRight: 40 }}
                    />
                    <button
                      type="button"
                      className="pw-toggle"
                      onClick={() => setShowConfirm((p) => !p)}
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword ? (
                    <p className="field-err">⚠ {fieldErrors.confirmPassword}</p>
                  ) : passwordsMatch ? (
                    <p className="field-ok">
                      <CheckCircle2 size={11} /> Match
                    </p>
                  ) : null}
                </div>
              </div>

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                    }}
                  >
                    <span className="spinner" />
                    Creating account…
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">or</span>
              <div className="divider-line" />
            </div>

            <p className="signin-row">
              Already have an account? <Link href="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
