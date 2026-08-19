"use client";

import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Home,
  Megaphone,
  Newspaper,
  TrendingUp,
  Zap,
} from "lucide-react";
import { NewsItem, EventItem } from "@/types/news-events";

// String
export function truncate(text: string, len = 160) {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > len ? clean.slice(0, len).trimEnd() + "…" : clean;
}

export function getExcerpt(n: NewsItem): string {
  const raw = n.excerpt || n.summary || n.description || n.content || "";
  const stripped = raw.replace(/<[^>]*>/g, "").trim();
  return stripped.length > 110 ? `${stripped.slice(0, 110)}…` : stripped;
}

// Base URL of the Laravel API. Leave empty to hit same-origin Next.js API
// routes instead (e.g. if you proxy these through app/api/news-events/*).
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

// Public, unauthenticated endpoint — a single combined route that returns
// { page, news, events }.
export const NEWS_EVENTS_API = `${API_BASE}/api/news-and-events`;

// Image in News & Event Page
// Image URL helper
export const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

export function imgUrl(src?: string) {
  if (!src) return "/placeholder-property.jpg";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${IMAGE_BASE}/${src}`;
}

// Image in Home Page
export const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=500&fit=crop&auto=format&q=80";

// Base path of your News & Events listing page. Individual articles don't
// have their own route — they open as a modal on this page — so we link
// here with a query param and let the page auto-open the right modal.
export const NEWS_EVENTS_PAGE = "/news&events";

export function getImage(n: NewsItem): string {
  return (
    n.cover_image || n.featured_image || n.image || n.thumbnail || FALLBACK_IMG
  );
}

// Date formatting
export function formatDate(d: string) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(d: string) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return { day: "--", month: "---" };
  return {
    day: date.toLocaleDateString("en-PH", { day: "2-digit" }),
    month: date.toLocaleDateString("en-PH", { month: "short" }).toUpperCase(),
  };
}

export function getDate(n: NewsItem): string {
  const raw = n.published_at || n.date || n.created_at;
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Icon map (by category)
export const CATEGORY_ICON: Record<string, React.ReactNode> = {
  "Market Insights": <TrendingUp className="w-5 h-5" />,
  "Company News": <Building2 className="w-5 h-5" />,
  "Property Alerts": <Home className="w-5 h-5" />,
  Announcements: <Megaphone className="w-5 h-5" />,
  Promos: <Zap className="w-5 h-5" />,
};

export function categoryIcon(cat?: string) {
  if (!cat) return <Newspaper className="w-5 h-5" />;
  return CATEGORY_ICON[cat] ?? <Newspaper className="w-5 h-5" />;
}

export function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${3 + (i % 4) * 2}px`,
            height: `${3 + (i % 4) * 2}px`,
            left: `${(i * 10.3) % 100}%`,
            top: `${(i * 13.7) % 100}%`,
            background:
              i % 2 === 0 ? "rgba(232,168,160,0.4)" : "rgba(255,255,255,0.15)",
            animation: `float-p${i % 3} ${4 + (i % 3) * 2}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Reveal helper ────────────────────────────────────────────────────────────
export function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

export function Reveal({
  children,
  delay = 0,
  dir = "up",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  dir?: "up" | "left" | "right";
  className?: string;
}) {
  const { ref, visible } = useReveal();
  const t =
    dir === "left"
      ? "translateX(-50px)"
      : dir === "right"
        ? "translateX(50px)"
        : "translateY(45px)";
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : t,
        transition: `opacity .7s ease ${delay}ms, transform .7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// New & Event Home Page's Content

export function getCategory(n: NewsItem): string {
  return n.category || n.type || "News";
}

export function isFeatured(n: NewsItem): boolean {
  return Boolean(n.is_featured || n.featured);
}

export function articleHref(
  item: NewsItem | EventItem,
  type?: "news" | "events",
): string {
  const identifier = item.slug ?? item.id;
  const resolvedType = type ?? ("event_date" in item ? "events" : "news");
  const param = resolvedType === "events" ? "event" : "article";

  return `${NEWS_EVENTS_PAGE}?${param}=${encodeURIComponent(String(identifier))}`;
}
