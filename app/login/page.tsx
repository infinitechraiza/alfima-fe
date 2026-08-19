"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/store";
import {
  getDeviceInfo,
  storeDeviceId,
  generateDeviceFingerprint,
} from "@/lib/device-utils";

// ── Forgot Password Modal ─────────────────────────────────────────────────────
type ModalStep = "form" | "done";

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<ModalStep>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          password_confirmation: confirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update password.");
      setStep("done");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; z-index: 999;
          background: rgba(15,8,2,0.55);
          backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: mFadeIn 0.18s ease;
        }
        .modal-box {
          background: #faf7f2;
          border-top: 3px solid #b8892e;
          width: 100%; max-width: 420px;
          padding: 36px 40px 32px;
          position: relative;
          animation: mSlideUp 0.22s ease;
        }
        .modal-close {
          position: absolute; top: 14px; right: 16px;
          background: none; border: none; cursor: pointer;
          color: #a89880; padding: 4px; display: flex;
          border-radius: 2px; transition: color 0.15s;
        }
        .modal-close:hover { color: #1a1208; }
        .modal-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px; font-weight: 400; color: #1a1208;
          margin: 0 0 6px; line-height: 1.2;
        }
        .modal-title em { color: #b8892e; font-style: italic; }
        .modal-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 300; color: #8a7c6a;
          margin: 0 0 24px;
        }
        .modal-error {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 10px 14px;
          background: rgba(220,38,38,0.06);
          border: 1px solid rgba(220,38,38,0.18);
          margin-bottom: 18px;
        }
        .modal-error p {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; color: #dc2626; margin: 0;
        }
        .modal-field { margin-bottom: 18px; }
        .modal-label {
          display: block;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: #8a7c6a; margin-bottom: 6px;
        }
        .modal-input {
          width: 100%; background: #fff;
          border: 1px solid #ddd5c4;
          padding: 10px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; color: #1a1208; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .modal-input::placeholder { color: #c2b8a8; }
        .modal-input:focus {
          border-color: #b8892e;
          box-shadow: 0 0 0 3px rgba(184,137,46,0.1);
        }
        .modal-input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
          -webkit-text-fill-color: #1a1208 !important;
        }
        .modal-pw-wrap { position: relative; }
        .modal-pw-toggle {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #a89880; padding: 0; display: flex;
        }
        .modal-btn {
          width: 100%; padding: 12px; background: #1a1208; border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: #c9a84c; cursor: pointer;
          transition: background 0.2s, opacity 0.2s;
          margin-top: 4px;
        }
        .modal-btn:hover:not(:disabled) { background: #2c2010; }
        .modal-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .modal-success { text-align: center; padding: 12px 0 8px; }
        .modal-success h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px; font-weight: 400; color: #1a1208;
          margin: 0 0 8px;
        }
        .modal-success p {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; color: #8a7c6a;
          margin: 0 0 24px;
        }
        @keyframes mFadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div
        className="modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="modal-box"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-heading"
        >
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>

          {/* ── Form step ── */}
          {step === "form" && (
            <>
              <h2 id="modal-heading" className="modal-title">
                Reset <em>password</em>
              </h2>
              <p className="modal-sub">
                Enter your email and choose a new password.
              </p>

              {error && (
                <div className="modal-error">
                  <AlertCircle
                    size={14}
                    color="#dc2626"
                    style={{ flexShrink: 0, marginTop: 1 }}
                  />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="modal-field">
                  <label className="modal-label">Email Address</label>
                  <input
                    className="modal-input"
                    type="email"
                    placeholder="juan@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="modal-field">
                  <label className="modal-label">New Password</label>
                  <div className="modal-pw-wrap">
                    <input
                      className="modal-input"
                      type={showPw ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      required
                      style={{ paddingRight: 40 }}
                    />
                    <button
                      type="button"
                      className="modal-pw-toggle"
                      onClick={() => setShowPw((p) => !p)}
                    >
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="modal-field">
                  <label className="modal-label">Confirm Password</label>
                  <div className="modal-pw-wrap">
                    <input
                      className="modal-input"
                      type={showCf ? "text" : "password"}
                      placeholder="Repeat new password"
                      value={confirm}
                      onChange={(e) => {
                        setConfirm(e.target.value);
                        setError("");
                      }}
                      required
                      style={{ paddingRight: 40 }}
                    />
                    <button
                      type="button"
                      className="modal-pw-toggle"
                      onClick={() => setShowCf((p) => !p)}
                    >
                      {showCf ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="modal-btn" disabled={loading}>
                  {loading ? (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <Loader2
                        size={13}
                        style={{ animation: "spin 1s linear infinite" }}
                      />{" "}
                      Saving…
                    </span>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </form>
            </>
          )}

          {/* ── Done step ── */}
          {step === "done" && (
            <div className="modal-success">
              <CheckCircle2
                size={48}
                color="#16a34a"
                style={{ marginBottom: 16 }}
              />
              <h3>Password updated!</h3>
              <p>You can now sign in with your new password.</p>
              <button className="modal-btn" onClick={onClose}>
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Inner component (uses useSearchParams) ────────────────────────────────────
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const reason = searchParams.get("reason");
  const { setUser, setCurrentDeviceId } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [forgotOpen, setForgotOpen] = useState(false);
  // ── NEW: remember me state ──────────────────────────────────────────────────
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (reason === "device_revoked") {
      setError("Your device was logged out. Please sign in again.");
    }
  }, [reason]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const deviceInfo = getDeviceInfo();
      const fingerprint = await generateDeviceFingerprint();

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-fingerprint": fingerprint,
          "x-device-name": deviceInfo.device_name,
          "x-device-type": deviceInfo.device_type,
        },
        body: JSON.stringify({
          ...formData,
          // ── passes remember_me to backend so it can set cookie maxAge ──
          remember_me: rememberMe,
          device_fingerprint: fingerprint,
          device_name: deviceInfo.device_name,
          device_type: deviceInfo.device_type,
        }),
        credentials: "include",
      });

      const data = await res.json();
      console.log("[login] API response:", data);

      if (!res.ok) {
        setError(
          data.message === "Maximum devices reached"
            ? "You have reached the maximum number of devices (3). Please log out from another device first."
            : (data.error ?? data.message ?? "Invalid email or password"),
        );
        return;
      }

      if (data.device_id) {
        storeDeviceId(data.device_id.toString());
        setCurrentDeviceId(data.device_id.toString());
      }

      const userData = data.user;
      if (!userData?.role) {
        setError("Login succeeded but user data is missing. Please try again.");
        return;
      }

      setUser(userData);

      const redirectMap: Record<string, string> = {
        admin: "/admin",
        agent: "/agent/dashboard",
        buyer: "/",
      };

      const destination = redirectMap[userData.role] ?? redirect ?? "/";
      console.log(
        "[login] Redirecting to:",
        destination,
        "| role:",
        userData.role,
      );
      router.push(destination);
    } catch (err) {
      console.error("[login] error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
        .login-wrap { display: flex; min-height: 100vh; width: 100%; background: #f5f0e8; }
        .hero-panel { flex: 1; position: relative; overflow: hidden; background: #1a1208; display: none; }
        @media (min-width: 1024px) { .hero-panel { display: flex; flex-direction: column; justify-content: flex-end; } }
        .hero-bg {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, rgba(15,8,2,0.35) 0%, rgba(15,8,2,0.75) 100%),
            url('login-background.png') center/cover no-repeat;
        }
        .hero-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(201,168,76,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.06) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .hero-content { position: relative; z-index: 2; padding: 48px 52px; }
        .hero-tag {
          display: inline-block;
          font-family: 'DM Sans', sans-serif; font-size: 24px; font-weight: 500;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: #fff; border: 1px solid rgba(255,255,255,0.5);
          padding: 8px 18px; margin-bottom: 20px;
        }
        .hero-headline {
          font-family: 'Cormorant Garamond', serif;
          font-size: 54px; font-weight: 400; color: #fff;
          line-height: 1.2; margin: 0 0 16px;
        }
        .hero-sub {
          font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 300;
          color: rgba(255,255,255,0.45); letter-spacing: 0.04em; margin: 0;
        }
       .form-panel {
  width: 100%; max-width: 480px; background: #faf7f2;
  display: flex; flex-direction: column; justify-content: flex-start;
  padding: 160px 44px 48px;  /* matches register's 160px top */
  position: relative;
  border-left: 1px solid #e8e0d0;
  min-height: 100vh;
}
        .logo-row { display: flex; align-items: center; gap: 12px; margin-bottom: 36px; }
        .logo-box { width: 72px; height: 72px; border-radius: 10px; overflow: hidden; flex-shrink: 0; }
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
        .error-box {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px;
          background: rgba(220,38,38,0.06);
          border: 1px solid rgba(220,38,38,0.18);
          border-radius: 2px; margin-bottom: 20px;
        }
        .error-box p { font-family: 'DM Sans', sans-serif; font-size: 13px; color: #dc2626; margin: 0; }
        .field { margin-bottom: 20px; }
        .field-label {
          display: block; font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: #8a7c6a; margin-bottom: 6px;
        }
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
        .field-input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
          -webkit-text-fill-color: #1a1208 !important;
        }
        .pw-wrap { position: relative; }
        .pw-toggle {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #a89880; padding: 0; display: flex;
        }
        .forgot-link {
          display: block; text-align: right;
          font-family: 'DM Sans', sans-serif; font-size: 12px;
          color: #b8892e; background: none; border: none;
          cursor: pointer; padding: 0;
          margin-top: 8px;
          letter-spacing: 0.02em;
        }
        .forgot-link:hover { text-decoration: underline; }
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

        /* ── Remember me row ── */
        .remember-row {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 20px; cursor: pointer;
          user-select: none;
        }
        .custom-check {
          width: 16px; height: 16px;
          border: 1.5px solid #c2b8a8; border-radius: 3px; flex-shrink: 0;
          background: #fff; display: flex; align-items: center; justify-content: center;
          transition: border-color 0.2s, background 0.2s;
        }
        .custom-check.checked {
          border-color: #b8892e;
          background: rgba(184,137,46,0.08);
        }
        .remember-row:hover .custom-check { border-color: #b8892e; }
        .remember-label {
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 300;
          color: #8a7c6a; letter-spacing: 0.03em;
        }

        .divider { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .divider-line { flex: 1; height: 1px; background: #e4dace; }
        .divider-text {
          font-family: 'DM Sans', sans-serif; font-size: 10px;
          color: #b0a090; letter-spacing: 0.14em; text-transform: uppercase;
        }
        .register-row {
          text-align: center; font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 300; color: #8a7c6a; margin: 0;
        }
        .register-row a { color: #b8892e; text-decoration: none; font-weight: 500; }
        .register-row a:hover { text-decoration: underline; }
        .top-accent {
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #b8892e, #e8c96a, #b8892e);
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
      `}</style>

      {/* Modal */}
      {forgotOpen && (
        <ForgotPasswordModal onClose={() => setForgotOpen(false)} />
      )}

      <div className="login-wrap">
        {/* ── Hero panel ── */}
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
            <div className="logo-row">
              <div className="logo-box">
                <img src="/alfima.png" alt="Alfima" />
              </div>
              <span className="logo-text">Alfima Realty Inc.</span>
            </div>

            <div className="heading-block">
              <h1>
                Welcome <em>back.</em>
              </h1>
              <p>Sign in to access your account</p>
            </div>

            {error && (
              <div className="error-box">
                <AlertCircle size={14} color="#dc2626" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label className="field-label">Email Address</label>
                <input
                  className="field-input"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="juan@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="field">
                <label className="field-label">Password</label>
                <div className="pw-wrap">
                  <input
                    className="field-input"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
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
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => setForgotOpen(true)}
                >
                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Loader2
                      size={14}
                      style={{ animation: "spin 1s linear infinite" }}
                    />{" "}
                    Signing in…
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>

              {/* ── Fixed Remember Me ── */}
              <div
                className="remember-row"
                onClick={() => setRememberMe((p) => !p)}
                role="checkbox"
                aria-checked={rememberMe}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    setRememberMe((p) => !p);
                  }
                }}
              >
                <div className={`custom-check${rememberMe ? " checked" : ""}`}>
                  {rememberMe && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="#b8892e"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className="remember-label">Keep me signed in</span>
              </div>
            </form>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">or</span>
              <div className="divider-line" />
            </div>

            <p className="register-row">
              Don't have an account? <Link href="/register">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#faf7f2",
          }}
        >
          <Loader2
            style={{
              width: 32,
              height: 32,
              color: "#b8892e",
              animation: "spin 1s linear infinite",
            }}
          />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
