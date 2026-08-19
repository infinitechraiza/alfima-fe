"use client";

import { useEffect, useState } from "react";
import { imgUrl, formatDate, categoryIcon } from "./functions";
import {
  Calendar,
  X,
} from "lucide-react";

interface NewsArticle {
  id: number;
  title: string;
  content: string;
  image?: string;
  category: string;
  date: string;
  slug: string;
  featured?: boolean;
  sort_order?: number;
}


// ─── Article Detail Modal ─────────────────────────────────────────────────────
export default function ArticleModal({
  article,
  onClose,
}: {
  article: NewsArticle;
  onClose: () => void;
}) {

  // Close on Escape, lock body scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        style={{ animation: "fadeIn .2s ease" }}
      />

      {/* Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-3xl border-2 border-red-400/30 shadow-2xl"
        style={{
          background:
            "linear-gradient(160deg,#3d1818 0%,#4a1f1f 50%,#2d1212 100%)",
          animation: "modalIn .25s cubic-bezier(.16,1,.3,1)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors backdrop-blur-sm"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative h-64 sm:h-80 overflow-hidden">
          <img
            src={imgUrl(article.image)}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg,transparent 40%,rgba(45,18,18,0.9) 100%)",
            }}
          />
          <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-red-700/90 text-white px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm">
            {categoryIcon(article.category)}
            {article.category}
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-4">
            <Calendar className="w-4 h-4" />
            {formatDate(article.date)}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-6 leading-tight">
            {article.title}
          </h2>
          <div className="text-white/80 leading-relaxed whitespace-pre-line">
            {article.content}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(20px) scale(.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
