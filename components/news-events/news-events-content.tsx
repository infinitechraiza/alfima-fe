import { useSearchParams } from "next/navigation";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EventItem, NewsArticle, PageSettings } from "@/types/news-events";
import { truncate, imgUrl, formatDate, formatDateShort, NEWS_EVENTS_API, Reveal, categoryIcon, FloatingParticles } from "./functions";
import HeroSideImage from "./news-hero-image";
import {
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";

import ArticleModal from "./article-modal";
import EventModal from "./event-modal";


// ─── Page content (uses useSearchParams, so it must live inside <Suspense>) ──
export default function NewsAndEventsPageContent() {
  const searchParams = useSearchParams();

  const [heroIn, setHeroIn] = useState(false);
  const [pg, setPg] = useState<PageSettings | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(
    null,
  );

  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    setTimeout(() => setHeroIn(true), 80);
  }, []);

  useEffect(() => {
    fetch(NEWS_EVENTS_API)
      .then((r) => r.json())
      .then((data) => {
        const newsData: NewsArticle[] = data.news ?? [];
        const eventsData: EventItem[] = data.events ?? [];

        setPg(data.page ?? null);
        setNews(newsData);
        setEvents(eventsData);

        // Auto-open the matching modal if we arrived via a
        // "?article=slug-or-id" or "?event=slug-or-id" link
        // (e.g. from the homepage Newsroom widget).
        const wantedArticle = searchParams.get("article");
        if (wantedArticle) {
          const match = newsData.find(
            (a) =>
              String(a.slug) === wantedArticle ||
              String(a.id) === wantedArticle,
          );
          if (match) setSelectedArticle(match);
        }

        const wantedEvent = searchParams.get("event");
        if (wantedEvent) {
          const match = eventsData.find(
            (ev) =>
              String(ev.slug) === wantedEvent || String(ev.id) === wantedEvent,
          );
          if (match) setSelectedEvent(match);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    // Only re-run if the query string itself changes (e.g. user clicks
    // another Newsroom card while already on this page).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const newsToShow = news;
  const eventsToShow = events;

  const categories = [
    "All",
    ...Array.from(new Set(newsToShow.map((n) => n.category))),
  ];

  const filteredNews =
    activeCategory === "All"
      ? newsToShow
      : newsToShow.filter((n) => n.category === activeCategory);

  return (
    <div
      className="w-full min-h-screen"
      style={{
        background:
          "linear-gradient(145deg,#3d1818 0%,#4a1f1f 50%,#2d1212 100%)",
      }}
    >
      <style>{`
        @keyframes float-p0{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
        @keyframes float-p1{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes float-p2{0%,100%{transform:translateY(0)}50%{transform:translateY(-22px)}}
        @keyframes shimmer{0%{left:-100%}100%{left:200%}}
      `}</style>

      {/* ══ HERO ══ */}
      <section className="relative bg-gradient-to-bl from-red-800/80 from-[10%] via-[#3d0012]/90 via-[70%] to-red-800/60 to-[100%] pt-32 pb-28 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px,rgba(255,255,255,0.5) 1px,transparent 0)",
            backgroundSize: "30px 30px",
          }}
        />
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] opacity-30"
          style={{
            background: "radial-gradient(circle,#e74c3c 0%,transparent 65%)",
          }}
        />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "-100%",
              width: "50%",
              height: "100%",
              background:
                "linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)",
              animation: "shimmer 5s ease-in-out infinite",
            }}
          />
        </div>
        <FloatingParticles />

        {/* Right-side hero image */}
        <HeroSideImage heroIn={heroIn} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl lg:max-w-lg">
            <div
              style={{
                opacity: heroIn ? 1 : 0,
                transform: heroIn ? "none" : "translateY(35px)",
                transition: "opacity .8s ease 0ms, transform .8s ease 0ms",
              }}
            >
              <div className="inline-flex items-center gap-2 mb-5">
                <div
                  className="h-px w-10"
                  style={{
                    background: "linear-gradient(90deg,#e8a8a0,#d4a5a0)",
                  }}
                />
                <span className="text-red-200 text-xs font-black tracking-[0.2em] uppercase">
                  Stay In The Loop
                </span>
              </div>
            </div>

            <div
              style={{
                opacity: heroIn ? 1 : 0,
                transform: heroIn ? "none" : "translateY(35px)",
                transition: "opacity .8s ease 150ms, transform .8s ease 150ms",
              }}
            >
              <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-5 drop-shadow-xl">
                {pg?.hero_headline ? (
                  <>
                    {pg.hero_headline.split(" ").slice(0, 1).join(" ")}
                    <br />
                    <span className="text-red-300">
                      {pg.hero_headline.split(" ").slice(1, 2).join(" ")}
                    </span>{" "}
                    <span className="text-white/50">
                      {pg.hero_headline.split(" ").slice(2).join(" ")}
                    </span>
                  </>
                ) : (
                  <>
                    News
                    <br />
                    <span className="text-red-300">&amp; Events</span>
                  </>
                )}
              </h1>
            </div>

            <div
              style={{
                opacity: heroIn ? 1 : 0,
                transform: heroIn ? "none" : "translateY(35px)",
                transition: "opacity .8s ease 250ms, transform .8s ease 250ms",
              }}
            >
              <p className="text-white/80 text-lg leading-relaxed max-w-lg mb-8">
                {pg?.hero_description ||
                  "The latest market insights, company announcements, and upcoming events from Alfima Realty Inc. — all in one place."}
              </p>
            </div>

            <div
              style={{
                opacity: heroIn ? 1 : 0,
                transform: heroIn ? "none" : "translateY(35px)",
                transition: "opacity .8s ease 330ms, transform .8s ease 330ms",
              }}
            >
              <div className="flex gap-4 flex-wrap">
                <a href="#latest-news">
                  <button className="inline-flex items-center gap-2 bg-white text-red-800 font-black px-7 py-3.5 rounded-full hover:bg-red-50 shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-200">
                    Latest News <ArrowRight className="w-4 h-4" />
                  </button>
                </a>
                <a href="#upcoming-events">
                  <button className="inline-flex items-center gap-2 border-2 border-white/50 hover:border-white text-white font-bold px-7 py-3.5 rounded-full hover:bg-white/10 hover:scale-105 transition-all duration-200">
                    Upcoming Events
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg
            viewBox="0 0 1440 48"
            preserveAspectRatio="none"
            className="w-full h-12"
            fill="#ffffff"
          >
            <path d="M0,48 C480,0 960,48 1440,16 L1440,48 Z" />
          </svg>
        </div>
      </section>

      {/* ══ NEWS GRID + CATEGORY FILTER ══ */}
      <section
        id="latest-news"
        className="py-24 bg-gradient-to-b from-[#3d1818] to-[#8b1a1a]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-3 mb-4 justify-center">
                <div className="h-px w-10 bg-red-400/60" />
                <span className="text-white text-xs font-black tracking-[0.2em] uppercase">
                  Latest Updates
                </span>
                <div className="h-px w-10 bg-red-400/60" />
              </div>
              <h2 className="text-4xl font-black text-white">
                News &amp; Announcements
              </h2>
            </div>
          </Reveal>

          {/* Category filter */}
          <Reveal delay={100}>
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                    activeCategory === cat
                      ? "bg-white text-red-800 border-white"
                      : "bg-white/10 text-white border-white/25 hover:border-white/50 hover:bg-white/15"
                  }`}
                >
                  {cat !== "All" && categoryIcon(cat)}
                  {cat}
                </button>
              ))}
            </div>
          </Reveal>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl h-80 animate-pulse"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                />
              ))}
            </div>
          ) : filteredNews.length === 0 ? (
            <p className="text-white/60 text-center">
              No articles in this category yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map((article, i) => (
                <Reveal key={article.id} delay={i * 100}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedArticle(article)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        setSelectedArticle(article);
                    }}
                    className="group rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 h-full flex flex-col cursor-pointer"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={imgUrl(article.image)}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-red-700/90 text-white px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-sm">
                        {categoryIcon(article.category)}
                        {article.category}
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-center gap-2 text-white/55 text-xs mb-3">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(article.date)}
                      </div>
                      <h3 className="text-white font-black text-lg mb-3 leading-snug group-hover:text-red-200 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-white/70 text-sm leading-relaxed mb-4 flex-grow">
                        {truncate(article.content, 140)}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-red-300 font-bold text-xs group-hover:gap-2.5 transition-all">
                        Read More <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ UPCOMING EVENTS ══ */}
      <section
        id="upcoming-events"
        className="py-24 relative bg-gradient-to-t from-[#8b1a1a] from-[20%] to-red-800/30 to-[100%] backdrop-blur-sm overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px,rgba(255,255,255,0.5) 1px,transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <FloatingParticles />
        <div className="absolute top-0 left-0 w-full overflow-hidden rotate-180">
          <svg
            viewBox="0 0 1440 70"
            preserveAspectRatio="none"
            className="w-full h-14"
            fill="white"
          >
            <path d="M0,70 C480,0 960,70 1440,20 L1440,70 Z" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-3 mb-4 justify-center">
                <div className="h-px w-10 bg-white/60" />
                <span className="text-white text-xs font-black tracking-[0.2em] uppercase">
                  Mark Your Calendar
                </span>
                <div className="h-px w-10 bg-white/60" />
              </div>
              <h2 className="text-4xl font-black text-white drop-shadow-lg">
                Upcoming Events
              </h2>
            </div>
          </Reveal>

          {eventsToShow.length === 0 ? (
            <p className="text-white/70 text-center">
              No upcoming events at the moment. Check back soon!
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {eventsToShow.map((event, i) => {
                const { day, month } = formatDateShort(event.event_date);
                return (
                  <Reveal key={event.id} delay={i * 120}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedEvent(event)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          setSelectedEvent(event);
                      }}
                      className="group rounded-2xl overflow-hidden hover:-translate-y-3 hover:shadow-2xl transition-all duration-300 border border-white/25 hover:border-white/50 h-full flex flex-col cursor-pointer"
                      style={{
                        background: "rgba(255,255,255,0.15)",
                        backdropFilter: "blur(12px)",
                      }}
                    >
                      <div className="relative h-44 overflow-hidden">
                        <img
                          src={imgUrl(event.image)}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 bg-white rounded-lg px-3 py-1.5 text-center shadow-lg">
                          <p className="text-red-800 font-black text-lg leading-none">
                            {day}
                          </p>
                          <p className="text-red-800 font-bold text-[10px] tracking-wide uppercase">
                            {month}
                          </p>
                        </div>
                      </div>
                      <div className="p-7 flex flex-col flex-grow">
                        <h3 className="text-white font-black text-lg mb-3 leading-snug">
                          {event.title}
                        </h3>
                        <p className="text-white/85 text-sm leading-relaxed mb-5 flex-grow">
                          {event.description}
                        </p>
                        <div className="space-y-2">
                          {event.event_time && (
                            <div className="flex items-center gap-2 text-white/70 text-xs">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              {event.event_time}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-white/70 text-xs">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            {event.location}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 w-full overflow-hidden">
          <svg
            viewBox="0 0 1440 70"
            preserveAspectRatio="none"
            className="w-full h-14"
            fill="white"
          >
            <path d="M0,70 C480,0 960,70 1440,20 L1440,70 Z" />
          </svg>
        </div>
      </section>

      {/* ══ NEWSLETTER CTA ══ */}
      <section className="relative py-24 sm:py-38 bg-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://i.pinimg.com/1200x/e9/01/bf/e901bf2bed461c411f141c92b0344ecf.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-white opacity-60" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px,rgba(255,255,255,0.5) 1px,transparent 0)",
            backgroundSize: "30px 30px",
          }}
        />
        <FloatingParticles />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="bg-gradient-to-bl from-red-800 from-[10%] via-[#3d0012]/90 via-[80%] to-red-800 to-[100%] backdrop-blur-md border border-rose-300/30 rounded-3xl p-12 sm:p-16 text-center hover:bg-white/15 transition">
            <Reveal>
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
                Never Miss an Update
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
                Get the latest news, market insights, and event invites sent
                straight to your inbox.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/services">
                  <button className="inline-flex items-center gap-2 bg-white text-red-800 font-black px-8 py-4 rounded-full hover:bg-red-50 shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-200">
                    Explore Services <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link href="/contact">
                  <button className="inline-flex items-center gap-2 border-2 border-white/50 hover:border-white text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 hover:scale-105 transition-all duration-200">
                    Get in Touch
                  </button>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ ARTICLE DETAIL MODAL ══ */}
      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}

      {/* ══ EVENT DETAIL MODAL ══ */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
