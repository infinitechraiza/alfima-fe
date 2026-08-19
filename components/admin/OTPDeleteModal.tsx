"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";

interface OTPDeleteModalProps {
  propertyId: number;
  propertyTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function OTPDeleteModal({
  propertyId,
  propertyTitle,
  isOpen,
  onClose,
  onSuccess,
  onError,
}: OTPDeleteModalProps) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [expiresIn, setExpiresIn] = useState(600); // 10 minutes
  const [attempts, setAttempts] = useState(3);
  const [step, setStep] = useState<"initial" | "verify">("initial");
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || step !== "verify") return;

    const interval = setInterval(() => {
      setExpiresIn((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleInitiate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/delete-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error ?? data.message ?? "Failed to initiate deletion"
        );
      }

      const data = await res.json();

      // Call frontend API to send email
      const emailRes = await fetch("/api/send-otp-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otp: data.otp,
          propertyTitle,
          adminEmail: process.env.ADMIN_EMAIL,
        }),
      });

      if (!emailRes.ok) {
        console.error("Email sending failed, but OTP was generated");
        // Don't throw - OTP is still valid even if email failed
      }

      setGeneratedOtp(data.otp);
      setExpiresIn(data.expires_in);
      setAttempts(3);
      setStep("verify");
    } catch (err: any) {
      onError(err.message ?? "Failed to initiate deletion");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      onError("Please enter the OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/properties/${propertyId}/verify-delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otp }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.attempts_remaining !== undefined) {
          setAttempts(data.attempts_remaining);
        }
        throw new Error(
          data.error ?? data.message ?? "Invalid OTP. Please try again."
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      onError(err.message ?? "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4"
          style={{ animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-slate-800 font-bold text-base">
                  Delete Property
                </h3>
                <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                  &quot;{propertyTitle}&quot; will be permanently deleted.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step: Initial */}
          {step === "initial" && (
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleInitiate}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Sending OTP..." : "Continue"}
              </button>
            </div>
          )}

          {/* Step: Verify OTP */}
          {step === "verify" && (
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-800">
                  Enter OTP Code
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
                  }
                  maxLength={6}
                  disabled={loading}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-widest text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                />
              </div>

              {/* Timer and Attempts */}
              <div className="flex justify-between items-center text-xs">
                <span className={`font-semibold ${expiresIn < 60 ? "text-red-600" : "text-slate-600"}`}>
                  Expires: {formatTime(expiresIn)}
                </span>
                <span className="text-slate-500">
                  Attempts remaining: {attempts}
                </span>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                OTP sent to admin email. Check your inbox and spam folder.
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => {
                    setStep("initial");
                    setOtp("");
                  }}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6 || expiresIn === 0}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Verifying..." : "Delete Property"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
