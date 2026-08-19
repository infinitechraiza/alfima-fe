"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Award,
  ArrowRight,
  Building2,
  CheckCircle,
  Compass,
  Eye,
  Flag,
  Home,
  MapPin,
  Target,
  TrendingUp,
  Shield,
  Star,
  Phone,
  Users,
  Zap,
} from "lucide-react";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PageSettings {
  hero_headline: string;
  hero_description: string;
  hero_image?: string;
  who_we_are_heading: string;
  who_we_are_body_1: string;
  who_we_are_body_2: string;
  who_we_are_body_3: string;
  vision: string;
  mission: string;
  goals: string;
  objectives: string;
}

interface ValueItem {
  id: number;
  icon: string;
  title: string;
  description: string;
  sort_order: number;
}

interface WhyItem {
  id: number;
  icon: string;
  number: string;
  title: string;
  description: string;
  accent_color: string;
  sort_order: number;
}

// ─── Icon map ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  Shield: <Shield className="w-7 h-7" />,
  Star: <Star className="w-7 h-7" />,
  Users: <Users className="w-7 h-7" />,
  TrendingUp: <TrendingUp className="w-7 h-7" />,
  MapPin: <MapPin className="w-7 h-7" />,
  CheckCircle: <CheckCircle className="w-7 h-7" />,
  Home: <Home className="w-7 h-7" />,
  Zap: <Zap className="w-7 h-7" />,
  Building2: <Building2 className="w-7 h-7" />,
  Award: <Award className="w-7 h-7" />,
};

const ICON_SM: Record<string, React.ReactNode> = {
  Shield: <Shield className="w-6 h-6" />,
  Star: <Star className="w-6 h-6" />,
  Users: <Users className="w-6 h-6" />,
  TrendingUp: <TrendingUp className="w-6 h-6" />,
  MapPin: <MapPin className="w-6 h-6" />,
  CheckCircle: <CheckCircle className="w-6 h-6" />,
  Home: <Home className="w-6 h-6" />,
  Zap: <Zap className="w-6 h-6" />,
  Building2: <Building2 className="w-6 h-6" />,
  Award: <Award className="w-6 h-6" />,
};

// ─── Reveal helper ────────────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
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

function Reveal({
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

function FloatingParticles() {
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AboutPage() {
  const [heroIn, setHeroIn] = useState(false);
  const [pg, setPg] = useState<PageSettings | null>(null);
  const [values, setValues] = useState<ValueItem[]>([]);
  const [why, setWhy] = useState<WhyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setHeroIn(true), 80);
  }, []);

  useEffect(() => {
    fetch("/api/about")
      .then((r) => r.json())
      .then((data) => {
        setPg(data.page ?? null);
        setValues(data.values ?? []);
        setWhy(data.why_choose_us ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // const trustBadges = [
  //   { icon: <Shield className="w-3 h-3" />, text: "PRC Licensed" },
  //   { icon: <Star className="w-3 h-3" />, text: "4.9★ Rated" },
  //   { icon: <CheckCircle className="w-3 h-3" />, text: "HLURB Accredited" },
  //   { icon: <Award className="w-3 h-3" />, text: "Award-Winning" },
  // ];

  // const quickInfo = [
  //   {
  //     icon: <Building2 className="w-3.5 h-3.5" />,
  //     text: "1+ Years in Business",
  //   },
  //   { icon: <MapPin className="w-3.5 h-3.5" />, text: "20+ Cities" },
  //   { icon: <Zap className="w-3.5 h-3.5" />, text: "Philippines-Wide" },
  // ];

  // Hero image src
  const heroSrc = pg?.hero_image
    ? `${IMAGE_BASE}/${pg.hero_image}`
    : "/hero-background.jpg";

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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* LEFT */}
            <div>
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
                    Est. Since Day One
                  </span>
                </div>
              </div>

              <div
                style={{
                  opacity: heroIn ? 1 : 0,
                  transform: heroIn ? "none" : "translateY(35px)",
                  transition:
                    "opacity .8s ease 150ms, transform .8s ease 150ms",
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
                      About
                      <br />
                      <span className="text-red-300">Alfima</span>{" "}
                      <span className="text-white/50">Realty</span>
                    </>
                  )}
                </h1>
              </div>

              <div
                style={{
                  opacity: heroIn ? 1 : 0,
                  transform: heroIn ? "none" : "translateY(35px)",
                  transition:
                    "opacity .8s ease 250ms, transform .8s ease 250ms",
                }}
              >
                <p className="text-white/80 text-lg leading-relaxed max-w-lg mb-5">
                  {pg?.hero_description ||
                    "Alfima Realty Inc. is a trusted real estate company dedicated to helping Filipinos find their dream homes, investment properties, and commercial spaces — with integrity, expertise, and a personal touch."}
                </p>
              </div>

              <div
                style={{
                  opacity: heroIn ? 1 : 0,
                  transform: heroIn ? "none" : "translateY(35px)",
                  transition:
                    "opacity .8s ease 330ms, transform .8s ease 330ms",
                }}
              >
                {/* <div className="flex flex-wrap gap-2 mb-5">
                  {trustBadges.map(({ icon, text }) => (
                    <span
                      key={text}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white/90 border border-white/20 hover:border-white/40 transition-all cursor-default"
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <span className="text-red-300">{icon}</span>
                      {text}
                    </span>
                  ))}
                </div> */}
              </div>

              <div
                style={{
                  opacity: heroIn ? 1 : 0,
                  transform: heroIn ? "none" : "translateY(35px)",
                  transition:
                    "opacity .8s ease 410ms, transform .8s ease 410ms",
                }}
              >
                {/* <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-7">
                  {quickInfo.map(({ icon, text }, i) => (
                    <span
                      key={text}
                      className="inline-flex items-center gap-1.5 text-white/55 text-sm"
                    >
                      <span className="text-red-300/80">{icon}</span>
                      {text}
                      {i < quickInfo.length - 1 && (
                        <span className="ml-4 text-white/20 hidden sm:inline">
                          ·
                        </span>
                      )}
                    </span>
                  ))}
                </div> */}
              </div>

              <div
                style={{
                  opacity: heroIn ? 1 : 0,
                  transform: heroIn ? "none" : "translateY(35px)",
                  transition:
                    "opacity .8s ease 490ms, transform .8s ease 490ms",
                }}
              >
                <div className="flex gap-4 flex-wrap">
                  <Link href="/services">
                    <button className="inline-flex items-center gap-2 bg-white text-red-800 font-black px-7 py-3.5 rounded-full hover:bg-red-50 shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-200">
                      Browse Services <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                  <Link href="/contact">
                    <button className="inline-flex items-center gap-2 border-2 border-white/50 hover:border-white text-white font-bold px-7 py-3.5 rounded-full hover:bg-white/10 hover:scale-105 transition-all duration-200">
                      Contact Us
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* RIGHT — hero image */}
            <div
              style={{
                opacity: heroIn ? 1 : 0,
                transform: heroIn ? "none" : "translateX(50px)",
                transition: "opacity .8s ease 400ms, transform .8s ease 400ms",
              }}
            >
              <img
                src={heroSrc}
                alt="Alfima Realty"
                className="w-full h-auto rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-300"
              />
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

      {/* ══ WHO WE ARE ══ */}
      <section className="py-24 bg-gradient-to-b from-[#8b1a1a] from-[40%] to-red-800/30 to-[100%]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <Reveal dir="left">
              <div className="relative">
                <div
                  className="rounded-3xl p-10 border-2 border-red-400/40 hover:border-red-400/60 transition-all duration-500 shadow-lg hover:shadow-xl"
                  style={{
                    background: "rgba(61,24,24,0.5)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div
                    className="h-1 w-20 rounded-full mb-8"
                    style={{
                      background: "linear-gradient(90deg,#e74c3c,#ff8080)",
                    }}
                  />
                  <div className="w-28 h-28 rounded-full overflow-hidden mb-6 shadow-xl ring-2 ring-red-400/60 hover:scale-110 transition-transform duration-300 bg-white flex items-center justify-center p-2">
                    <img
                      src="/alfima.png"
                      alt="Alfima"
                      className="w-full h-full object-contain"
                    />
                  </div>
                 <p className="text-white text-xs font-black tracking-[0.2em] uppercase mb-2">
  Who We Are
</p>
<h3 className="text-2xl font-black text-white mb-4">
  Alfima Realty Inc.
</h3>
                  <p className="text-white/70 leading-relaxed mb-6">
                    An accredited real estate brokerage company serving clients
                    across the Philippines.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "PRC Licensed",
                      "HLURB Accredited",
                      "Trusted Since Day One",
                    ].map((t) => (
                      <span
                        key={t}
                        className="px-3 py-1.5 rounded-full text-xs font-bold border"
                        style={{
  background: "rgba(231,76,60,0.3)",
  color: "#ffffff",
  borderColor: "rgba(231,76,60,0.5)",
}}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div
                  className="absolute -bottom-4 -right-4 w-40 h-40 rounded-full -z-10"
                  style={{
                    background:
                      "radial-gradient(circle,rgba(200,40,40,0.08) 0%,transparent 70%)",
                  }}
                />
              </div>
            </Reveal>

            <Reveal dir="right" delay={150}>
              <div>
                <div className="inline-flex items-center gap-2 mb-5">
                  <div className="h-px w-8 bg-red-500" />
            <span className="text-white text-xs font-black tracking-[0.2em] uppercase">
  Who We Are
</span>
                </div>
                <h2 className="text-4xl font-black text-white mb-6 leading-tight">
                  {pg?.who_we_are_heading ||
                    "Your Trusted Partner\nin Real Estate"}
                </h2>
                <div className="space-y-4 text-white/70 text-base leading-relaxed">
                  {pg?.who_we_are_body_1 && <p>{pg.who_we_are_body_1}</p>}
                  {pg?.who_we_are_body_2 && <p>{pg.who_we_are_body_2}</p>}
                  {pg?.who_we_are_body_3 && <p>{pg.who_we_are_body_3}</p>}
                  {/* fallback if nothing is set yet */}
                  {!pg?.who_we_are_body_1 &&
                    !pg?.who_we_are_body_2 &&
                    !pg?.who_we_are_body_3 && (
                      <>
                        <p>
                          At Alfima Realty Inc., we understand that a property
                          is more than just a structure — it&apos;s a home, a
                          milestone, and a legacy.
                        </p>
                        <p>
                          Our licensed brokers bring deep local knowledge to
                          guide you through every step — buying, selling, or
                          leasing.
                        </p>
                        <p>
                          First-time buyer, seasoned investor, or business owner
                          — Alfima has the network to get it done right.
                        </p>
                      </>
                    )}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
      {/* ══ VISION MISSION GOALS OBJECTIVES ══ */}
      <section className="py-24 bg-gradient-to-b from-[#3d1818] to-[#8b1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-3 mb-4 justify-center">
                <div className="h-px w-10 bg-red-400/60" />
             <span className="text-white text-xs font-black tracking-[0.2em] uppercase">
  Our Direction
</span>
                <div className="h-px w-10 bg-red-400/60" />
              </div>
              <h2 className="text-4xl font-black text-white">
                Vision, Mission, Goals &amp; Objectives
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(
              [
                {
                  key: "vision" as const,
                  Icon: Eye,
                  label: "Vision",
                  fallback:
                    "To be the most trusted real estate partner in the Philippines.",
                  accent: "#ff8080",
                },
                {
                  key: "mission" as const,
                  Icon: Target,
                  label: "Mission",
                  fallback:
                    "To provide every Filipino with seamless, transparent real estate services.",
                  accent: "#e87070",
                },
                {
                  key: "goals" as const,
                  Icon: Flag,
                  label: "Goals",
                  fallback:
                    "Expand to 50+ cities while maintaining 5-star client satisfaction.",
                  accent: "#d46060",
                },
                {
                  key: "objectives" as const,
                  Icon: Compass,
                  label: "Objectives",
                  fallback:
                    "Verify every listing and deliver end-to-end support for every transaction.",
                  accent: "#c05050",
                },
              ] as const
            ).map(({ key, Icon, label, fallback, accent }, i) => (
              <Reveal key={key} delay={i * 120}>
                <div
                  className="group rounded-2xl p-8 border border-white/20 hover:border-white/40 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 h-full"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: "rgba(255,255,255,0.15)" }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p
                    className="text-xs font-black tracking-[0.2em] uppercase mb-2"
                    style={{ color: accent }}
                  >
                    {label}
                  </p>
                  <p className="text-white/85 text-sm leading-relaxed">
                    {pg?.[key] || fallback}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      {/* ══ CORE VALUES ══ */}
      <section className="py-24 relative bg-gradient-to-t from-[#8b1a1a] from-[20%] to-red-800/30 to-[100%] backdrop-blur-sm overflow-hidden">
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
                  What Drives Us
                </span>
                <div className="h-px w-10 bg-white/60" />
              </div>
              <h2 className="text-4xl font-black text-white drop-shadow-lg">
                Our Core Values
              </h2>
            </div>
          </Reveal>

          {/* Dynamic values — fallback to static if empty */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${values.length >= 3 ? "lg:grid-cols-4" : values.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}
          >
            {(values.length > 0
              ? values
              : [
                  {
                    id: 0,
                    icon: "Shield",
                    title: "Integrity",
                    description:
                      "Full transparency and honesty in every deal we make.",
                    sort_order: 0,
                  },
                  {
                    id: 1,
                    icon: "Star",
                    title: "Excellence",
                    description:
                      "Highest professional standards in service and expertise.",
                    sort_order: 1,
                  },
                  {
                    id: 2,
                    icon: "Users",
                    title: "Client-First",
                    description:
                      "Your goals are our goals. We listen, then deliver.",
                    sort_order: 2,
                  },
                  {
                    id: 3,
                    icon: "TrendingUp",
                    title: "Growth",
                    description:
                      "Continuously improving to get you the best outcomes.",
                    sort_order: 3,
                  },
                ]
            ).map((v, i) => (
              <Reveal key={v.id} delay={i * 120}>
                <div
                  className="group rounded-2xl p-8 hover:-translate-y-3 hover:shadow-2xl transition-all duration-300 cursor-default border border-white/25 hover:border-white/50"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-white/25 text-white group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    {ICON_MAP[v.icon] ?? <Star className="w-7 h-7" />}
                  </div>
                  <h3 className="text-white font-black text-lg mb-3">
                    {v.title}
                  </h3>
                  <p className="text-white/85 text-sm leading-relaxed">
                    {v.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
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

      {/* ══ WHY CHOOSE US ══ */}
      <section className="py-24 bg-gradient-to-b from-[#8b1a1a] from-[20%] to-red-800/30 to-[100%] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-3 mb-4 justify-center">
                <div className="h-px w-10 bg-red-500" />
               <span className="text-white text-xs font-black tracking-[0.2em] uppercase">
  Why Alfima
</span>
                <div className="h-px w-10 bg-red-500" />
              </div>
              <h2 className="text-4xl font-black text-white">Why Choose Us</h2>
            </div>
          </Reveal>

          {/* Dynamic why items — fallback to static if empty */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {(why.length > 0
              ? why
              : [
                  {
                    id: 0,
                    number: "01",
                    title: "Local Expertise",
                    description:
                      "Deep knowledge of Philippine real estate markets, from Metro Manila to provincial hotspots.",
                    icon: "MapPin",
                    accent_color: "#c0392b",
                    sort_order: 0,
                  },
                  {
                    id: 1,
                    number: "02",
                    title: "Verified Listings",
                    description:
                      "Every property is verified by our team to ensure accuracy, legality, and fair pricing.",
                    icon: "CheckCircle",
                    accent_color: "#e74c3c",
                    sort_order: 1,
                  },
                  {
                    id: 2,
                    number: "03",
                    title: "End-to-End Support",
                    description:
                      "From property search to title transfer, we guide you through every step of the process.",
                    icon: "Home",
                    accent_color: "#a93226",
                    sort_order: 2,
                  },
                ]
            ).map((w, i) => (
              <Reveal
                key={w.id}
                delay={i * 150}
                dir={
                  i === 0
                    ? "left"
                    : i === (why.length > 0 ? why.length - 1 : 2)
                      ? "right"
                      : "up"
                }
              >
                <div
                  className="group rounded-2xl p-8 hover:-translate-y-3 hover:shadow-2xl transition-all duration-300 cursor-default border border-white/25 hover:border-white/50 h-full flex flex-col"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="text-red-200/60 text-sm font-black mb-4">
                    {w.number}
                  </div>
                  <h3 className="text-white font-black text-lg mb-3">
                    {w.title}
                  </h3>
                  <p className="text-white/85 text-sm leading-relaxed mb-6 flex-grow">
                    {w.description}
                  </p>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      color: "#ffffff",
                    }}
                  >
                    {ICON_SM[w.icon] ?? <CheckCircle className="w-6 h-6" />}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
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
                Ready to Find Your Dream Property?
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
                Let our team of licensed professionals guide you through the
                journey. Whether you&apos;re buying, selling, or investing,
                we&apos;re here to help.
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
    </div>
  );
}
