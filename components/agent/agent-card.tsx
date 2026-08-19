"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Agent, Tour } from "@/lib/types";
import {
  Star,
  Phone,
  MessageSquare,
  X,
  Send,
  CheckCircle,
  TrendingUp,
  Home,
} from "lucide-react";

interface AgentCardProps {
  agent: Agent;
  onReviewed?: () => void;
}

interface MessageOption {
  label: string;
  icon: string;
  href: string;
  bg: string;
}

// ── Message Modal ─────────────────────────────────────────────────────────────
function MessageModal({
  agent,
  onClose,
}: {
  agent: Agent;
  onClose: () => void;
}) {
  const raw = agent.phone?.replace(/\D/g, "") ?? "";
  const intl = raw.startsWith("0") ? `63${raw.slice(1)}` : raw;

  const options: MessageOption[] = [
    {
      label: "Viber",
      icon: "📱",
      href: `viber://chat?number=+${intl}`,
      bg: "hover:bg-purple-50 border border-purple-200 text-purple-700 bg-purple-50/50",
    },
    {
      label: "WhatsApp",
      icon: "💬",
      href: `https://wa.me/${intl}`,
      bg: "hover:bg-green-50 border border-green-200 text-green-700 bg-green-50/50",
    },
    {
      label: "SMS",
      icon: "✉️",
      href: `sms:${agent.phone}`,
      bg: "hover:bg-blue-50 border border-blue-200 text-blue-700 bg-blue-50/50",
    },
    {
      label: "Email",
      icon: "📧",
      href: `mailto:${agent.email}`,
      bg: "hover:bg-red-50 border border-red-200 text-red-700 bg-red-50/50",
    },
  ];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img
                src={agent.avatar ?? "/placeholder-avatar.png"}
                alt={agent.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 shadow-sm"
              />
              <div>
                <p className="font-black text-gray-900 text-sm">{agent.name}</p>
                <p className="text-xs text-gray-400">Choose how to reach out</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3 font-black">
            Choose a channel
          </p>
          <div className="grid grid-cols-2 gap-3">
            {options.map((opt) => (
              <a
                key={opt.label}
                href={opt.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm ${opt.bg}`}
              >
                <span className="text-xl">{opt.icon}</span>
                <span>{opt.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Rate Agent Modal ──────────────────────────────────────────────────────────
function RateAgentModal({
  agent,
  tour,
  onClose,
  onSubmitted,
}: {
  agent: Agent;
  tour: Tour;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labels: Record<number, string> = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very Good",
    5: "Excellent",
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tours/${tour.id}/review`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Failed to submit review.");
        return;
      }
      setSubmitted(true);
      onSubmitted();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <div className="flex justify-end mb-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {submitted ? (
            <div className="flex flex-col items-center py-6 gap-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
              <p className="text-gray-900 font-black text-lg">Thank you!</p>
              <p className="text-gray-500 text-sm text-center">
                Your review has been submitted.
              </p>
              <button
                className="mt-2 px-6 py-2.5 rounded-full text-white font-bold text-sm transition-all hover:scale-105"
                style={{
                  background: "linear-gradient(135deg,#c0392b,#96281b)",
                }}
                onClick={onClose}
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <img
                  src={agent.avatar ?? "/placeholder-avatar.png"}
                  alt={agent.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                />
                <div>
                  <p className="font-black text-gray-900 text-sm">
                    {agent.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    Tour on{" "}
                    {new Date(tour.tour_date).toLocaleDateString("en-PH", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-400 uppercase tracking-widest mb-3 font-black">
                Your Rating
              </p>
              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-9 h-9 transition-colors ${star <= (hovered || rating) ? "fill-yellow-400 stroke-yellow-400" : "stroke-gray-300"}`}
                    />
                  </button>
                ))}
              </div>
              {(hovered || rating) > 0 && (
                <p className="text-yellow-500 text-sm font-black mb-4">
                  {labels[hovered || rating]}
                </p>
              )}

              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2 font-black mt-2">
                Comment{" "}
                <span className="normal-case font-medium">(optional)</span>
              </p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this agent..."
                rows={3}
                className="w-full bg-gray-50 border-2 border-gray-200 focus:border-red-400 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none transition-colors"
              />

              {error && (
                <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>
              )}

              <button
                className="w-full mt-4 py-3 rounded-xl text-white font-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg,#c0392b,#96281b)",
                  boxShadow: "0 6px 20px rgba(192,57,43,0.3)",
                }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Review
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Agent Card ────────────────────────────────────────────────────────────────
export function AgentCard({ agent, onReviewed }: AgentCardProps) {
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [completedTour, setCompletedTour] = useState<Tour | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [checkingTour, setCheckingTour] = useState(true);

  useEffect(() => {
    const fetchCompletedTour = async () => {
      setCheckingTour(true);
      try {
        const res = await fetch(
          `/api/tours/my?agent_id=${agent.id}&status=completed`,
          { credentials: "include" },
        );
        if (!res.ok) return;
        const data = await res.json();
        const list: Tour[] = data.data ?? data ?? [];
        if (list.length === 0) return;
        const tour = list[0];
        setCompletedTour(tour);
        if ((tour as any).rating != null) {
          setAlreadyReviewed(true);
          return;
        }
        try {
          const stored = localStorage.getItem("reviewed_tours");
          const ids: number[] = stored ? JSON.parse(stored) : [];
          if (ids.includes(tour.id)) setAlreadyReviewed(true);
        } catch {
          /* */
        }
      } catch {
        /* silently fail */
      } finally {
        setCheckingTour(false);
      }
    };
    fetchCompletedTour();
  }, [agent.id]);

  const handleReviewSubmitted = () => {
    if (!completedTour) return;
    try {
      const stored = localStorage.getItem("reviewed_tours");
      const ids: number[] = stored ? JSON.parse(stored) : [];
      ids.push(completedTour.id);
      localStorage.setItem("reviewed_tours", JSON.stringify(ids));
    } catch {
      /* */
    }
    setAlreadyReviewed(true);
    setShowRateModal(false);
    onReviewed?.();
  };

  const ratingVal = Number(agent.rating ?? 0);

  return (
    <>
      <Link href={`/agents/${agent.id}`} className="block h-full">
        <div className="h-full relative bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col group cursor-pointer border border-gray-100/80">
          {/* ── Accent sidebar strip ── */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl"
            style={{
              background:
                "linear-gradient(180deg,#e74c3c 0%,#c0392b 60%,#96281b 100%)",
            }}
          />

          {/* ── Top section: avatar + badge ── */}
          <div className="pt-7 pb-5 px-7 flex items-center gap-5">
            {/* Avatar with ring */}
            <div className="relative flex-shrink-0">
              <div
                className="w-[72px] h-[72px] rounded-2xl p-[3px] transition-transform duration-300 group-hover:scale-105"
                style={{
                  background: "linear-gradient(135deg,#e74c3c,#c0392b)",
                }}
              >
                <img
                  src={agent.avatar ?? "/placeholder-avatar.png"}
                  alt={agent.name}
                  className="w-full h-full rounded-xl object-cover bg-gray-100"
                />
              </div>
              {/* Online dot */}
            </div>

            {/* Name + rating inline */}
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-gray-900 text-base leading-tight truncate group-hover:text-red-700 transition-colors duration-200">
                {agent.name}
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-0.5 mb-2">
                {agent.specialization || "Licensed Real Estate Agent"}
              </p>

              {/* Stars compact */}
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${i < Math.round(ratingVal) ? "fill-amber-400 stroke-amber-400" : "stroke-gray-200 fill-gray-100"}`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-bold text-gray-700">
                  {ratingVal.toFixed(1)}
                </span>
                <span className="text-[11px] text-gray-400">
                  ({agent.review_count ?? 0}{" "}
                  {(agent.review_count ?? 0) === 1 ? "review" : "reviews"})
                </span>
              </div>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="mx-7 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

          {/* ── Stats row ── */}
          <div className="flex mx-7 my-5 gap-3">
            {/* Properties */}
            <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3.5 flex flex-col gap-1 border border-gray-100 hover:border-red-100 transition-colors">
              <div className="flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-red-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Properties
                </span>
              </div>
              <p className="text-2xl font-black text-gray-900 leading-none">
                {agent.listings ?? 0}
              </p>
            </div>

            {/* Reviews */}
            <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3.5 flex flex-col gap-1 border border-gray-100 hover:border-red-100 transition-colors">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Reviews
                </span>
              </div>
              <p className="text-2xl font-black text-gray-900 leading-none">
                {agent.review_count ?? 0}
              </p>
            </div>
          </div>

          {/* ── Review banner ── */}
          <div className="px-7 pb-7 mt-auto">
            {!checkingTour &&
              completedTour &&
              (alreadyReviewed ? (
                <div className="flex items-center justify-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 border border-emerald-200 rounded-2xl py-2.5 px-3">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  You reviewed this agent
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowRateModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 text-xs font-bold rounded-2xl py-2.5 transition-all hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(135deg,#fef9c3,#fef08a)",
                    border: "1px solid #fde047",
                    color: "#a16207",
                  }}
                >
                  <Star className="w-3.5 h-3.5 flex-shrink-0 fill-yellow-500 stroke-yellow-500" />
                  Rate your experience
                </button>
              ))}
          </div>

          {/* ── CTA buttons (hidden, preserved) ── */}
          {/* <div className="flex gap-2 mt-auto">
            <a href={`tel:${agent.phone}`}
              className="flex-1"
              onClick={e => e.stopPropagation()}>
              <button
                className="w-full py-2.5 rounded-xl text-white text-sm font-black flex items-center justify-center gap-1.5 transition-all hover:scale-[1.03] hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg,#c0392b,#96281b)', boxShadow: '0 4px 14px rgba(192,57,43,0.3)' }}>
                <Phone className="w-4 h-4" /> Call
              </button>
            </a>
            <button
              className="flex-1 py-2.5 rounded-xl text-gray-700 text-sm font-black flex items-center justify-center gap-1.5 border-2 border-gray-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all"
              onClick={e => { e.preventDefault(); e.stopPropagation(); setShowMessageModal(true); }}>
              <MessageSquare className="w-4 h-4" /> Message
            </button>
          </div> */}
        </div>
      </Link>

      {showMessageModal && (
        <MessageModal
          agent={agent}
          onClose={() => setShowMessageModal(false)}
        />
      )}
      {showRateModal && completedTour && (
        <RateAgentModal
          agent={agent}
          tour={completedTour}
          onClose={() => setShowRateModal(false)}
          onSubmitted={handleReviewSubmitted}
        />
      )}
    </>
  );
}
