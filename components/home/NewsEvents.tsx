import { Calendar, Newspaper, ArrowUpRight, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { NewsItem, PageSettings } from "@/types/news-events";
import {
  getDate,
  imgUrl,
  FALLBACK_IMG,
  getCategory,
  isFeatured,
  articleHref,
  getExcerpt,
  NEWS_EVENTS_API,
} from "@/components/news-events/functions";

import { EventItem } from "@/types/news-events";
import "@/styles/news-events.css";

type FeedData =
  | (NewsItem & { type: "news" })
  | (EventItem & { type: "events" });

export function NewsEvents() {
  const [loading, setLoading] = useState(true);

  const [pg, setPg] = useState<PageSettings | null>(null);

  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    fetch(NEWS_EVENTS_API)
      .then((r) => r.json())
      .then((data) => {
        const newsData: NewsItem[] = data.news ?? [];
        const eventsData: EventItem[] = data.events ?? [];

        setPg(data.page ?? null);
        setNews(newsData);
        setEvents(eventsData);
      })
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  }, []);

  const feed: FeedData[] = [
    ...news.map((item) => ({ ...item, type: "news" as const })),
    ...events.map((item) => ({ ...item, type: "events" as const })),
  ].sort((a, b) => b.id - a.id);

  if (loading || !feed.length) return null;

  const featured = news.find(isFeatured) ?? news[0];
  const latest = feed.filter((item) => item.id !== featured?.id).slice(0, 3);

  return (
    <div
      className="hidden lg:block"
      style={{ position: "relative", width: "100%", height: 620, margin: "20px auto" }}
    >
      <div className="ne-panel">
        {/* Eyebrow */}
        <div
          className="ne-eyebrow"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(196, 30, 58, 0.9)", // solid-ish red, not translucent-on-dark
            padding: "6px 14px",
            borderRadius: 20,
            width: "fit-content",
          }}
        >
          <Newspaper size={14} color="#ffffff" />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            News & Events
          </span>
        </div>

        {/* Featured */}
        {loading ? (
          <div className="ne-skel" style={{ height: 320 }} />
        ) : featured ? (
          <a
            href={articleHref(featured, featured.type as "news" | "events")}
            className="ne-featured-wrapper"
          >
            <div className="ne-featured" style={{ position: "relative" }}>
              <div className="ne-featured-accent" />
              <img
                src={imgUrl(
                  featured.cover_image ??
                    featured.featured_image ??
                    featured.image ??
                    featured.thumbnail,
                )}
                alt={featured.title}
                className="ne-featured-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_IMG;
                }}
              />
              <div className="ne-featured-overlay" />

              {/* Category badge — top-right corner, out of the text flow */}
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  zIndex: 2,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(196, 30, 58, 0.9)",
                  borderRadius: 20,
                  padding: "4px 12px",
                  backdropFilter: "blur(4px)",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#ffffff",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  Featured · {getCategory(featured)}
                </span>
              </div>

              <div className="ne-featured-body">
                <p
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#fff",
                    lineHeight: 1.25,
                    margin: "0 0 8px",
                    textShadow: "0 2px 10px rgba(0,0,0,0.65)",
                  }}
                >
                  {featured.title}
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.88)",
                    lineHeight: 1.5,
                    margin: "0 0 12px",
                    maxWidth: 460,
                    textShadow: "0 1px 5px rgba(0,0,0,0.55)",
                  }}
                >
                  {getExcerpt(featured)}
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Calendar size={13} color="rgba(255,255,255,0.6)" />
                    <span
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.6)",
                        textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                      }}
                    >
                      {getDate(featured)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#ff8a80",
                      textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                    }}
                  >
                    Read more <ArrowUpRight size={14} />
                  </div>
                </div>
              </div>
            </div>
          </a>
        ) : (
          <div className="ne-featured-wrapper" style={{ display: "block" }}>
            <div
              className="ne-featured"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                No news available yet.
              </p>
            </div>
          </div>
        )}

        {/* Latest list */}
        <div className="ne-latest-list">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="ne-skel" style={{ height: 84 }} />
              ))
            : latest.map((item) => (
                <a
                  key={item.title}
                  href={articleHref(item, item.type as "news" | "events")}
                  className="ne-latest-row"
                >
                  <img
                    src={imgUrl(item.image)}
                    alt={item.title}
                    className="ne-latest-thumb"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMG;
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        color: "#ff8a80",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        margin: "0 0 3px",
                      }}
                    >
                      {getCategory(item)}
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#fff",
                        margin: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.title}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.45)",
                        margin: "3px 0 0",
                      }}
                    >
                      {getDate(item)}
                    </p>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: 9,
                        fontWeight: 700,
                        color: "#fff",
                        background:
                          item.type === "news" ? "#c41e3a" : "#2563eb",
                      }}
                    >
                      {item.type === "news" ? (
                        <Newspaper size={10} />
                      ) : (
                        <CalendarDays size={10} />
                      )}

                      {item.type === "news" ? "News" : "Event"}
                    </span>
                  </div>
                  <ArrowUpRight
                    size={14}
                    color="rgba(255,255,255,0.35)"
                    style={{ flexShrink: 0 }}
                  />
                </a>
              ))}
        </div>
      </div>
    </div>
  );
}
