"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Shield, Award, Star } from "lucide-react";
import { NewsEvents } from "./NewsEvents";
import { RequestViewingModal } from "@/components/modals/RequestViewingModal";

export function HeroSection() {
  const [viewingOpen, setViewingOpen] = useState(false);
  const [totalPropertiesListings, setTotalPropertiesListings] = useState<
    number | null
  >(null);
  const [totalDevelopersListings, setTotalDevelopersListings] = useState<
    number | null
  >(null);
  const [totalPartners, setTotalPartners] = useState<number | null>(null);

  useEffect(() => {
    // Fetch both property sources and sum them for total listings
    Promise.all([
      fetch("/api/properties?per_page=1")
        .then((r) => r.json())
        .catch(() => null),
      fetch("/api/developers-properties?per_page=1")
        .then((r) => r.json())
        .catch(() => null),
    ])
      .then(([propertiesData, devPropertiesData]) => {
        const extractTotal = (data: any): number => {
          if (!data) return 0;
          return (
            data?.total ??
            data?.meta?.total ??
            data?.pagination?.total ??
            data?.data?.total ??
            0
          );
        };

        const propertiesTotal = extractTotal(propertiesData);
        const devPropertiesTotal = extractTotal(devPropertiesData);

        if (propertiesTotal > 0) setTotalPropertiesListings(propertiesTotal);
        if (devPropertiesTotal > 0)
          setTotalDevelopersListings(devPropertiesTotal);
      })
      .catch(() => {});

    // Fetch partners count
    fetch("/api/partners")
      .then((r) => r.json())
      .then((data) => {
        const count =
          data?.total ??
          data?.meta?.total ??
          (Array.isArray(data?.data)
            ? data.data.filter((p: any) => p.is_active !== false).length
            : null) ??
          (Array.isArray(data)
            ? data.filter((p: any) => p.is_active !== false).length
            : null) ??
          null;
        if (count !== null) setTotalPartners(Number(count));
      })
      .catch(() => {});
  }, []);

  const propertyListingsValue =
    totalPropertiesListings !== null
      ? `${totalPropertiesListings.toLocaleString()}+`
      : "...";

  const developersListingsValue =
    totalDevelopersListings !== null
      ? `${totalDevelopersListings.toLocaleString()}+`
      : "...";

  const partnersValue =
    totalPartners !== null ? totalPartners.toLocaleString() : "...";

  return (
    <section className="hero-section">
      <style>{`
        .hero-content-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          padding: 80px 64px 220px;
          max-width: 1320px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
          align-items: center;
        }
        .hero-device-col {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .hero-headline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(40px, 4.5vw, 74px);
          font-weight: 900;
          line-height: 1.0;
          color: #fff;
          margin-bottom: 4px;
          letter-spacing: -0.02em;
        }
        .hero-headline-sub {
          display: block;
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(18px, 2.2vw, 30px);
          font-weight: 300;
          color: #ffffff;
          margin-top: 6px;
        }
        .hero-description {
          color: rgba(255,255,255,0.6);
          font-size: 15px;
          line-height: 1.75;
          margin: 22px 0 28px;
          max-width: 430px;
        }
        .hero-trust-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 32px;
        }
        .hero-ctas {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 36px;
        }
        .hero-stats {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .hero-stat-card {
          display: flex;
          flex-direction: column;
          gap: 4px;
         background: rgba(255, 255, 255, 0.18);  
          border: 1px solid rgba(255, 255, 255, 0.13);
          border-radius: 16px;
          padding: 16px 28px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: background 0.2s, border-color 0.2s;
          min-width: 120px;
        }
        .hero-stat-card:hover {
          background: rgba(255, 255, 255, 0.11);
          border-color: rgba(255, 255, 255, 0.22);
        }
        .hero-stat-value {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 700;
          color: #fff;
          line-height: 1;
        }
        .hero-stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          margin-top: 4px;
          font-family: 'DM Sans', sans-serif;
        }
        .hero-btn-viewing {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(231, 220, 220, 0.1);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 100px;
          padding: 14px 28px;
          color: rgba(255,255,255,0.85);
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all .2s;
        }
        .hero-btn-viewing:hover {
          background: rgba(255,255,255,0.14);
          border-color: rgba(255,255,255,0.28);
          color: #fff;
        }

        @media (max-width: 1024px) {
          .hero-content-grid {
            grid-template-columns: 1fr;
            gap: 32px;
            padding: 60px 32px 32px;
          }
          .hero-device-col { display: none; }
          .hero-description { max-width: 100%; }
        }
        @media (max-width: 768px) {
          .hero-content-grid { padding: 48px 20px 24px; gap: 24px; }
          .hero-description { font-size: 14px; margin: 16px 0 20px; }
          .hero-trust-badges { gap: 6px; margin-bottom: 24px; }
          .hero-ctas { gap: 10px; margin-bottom: 28px; }
          .hero-stats { gap: 10px; }
          .hero-stat-card { padding: 14px 22px; min-width: 100px; }
          .hero-stat-value { font-size: 22px; }
          .hero-stat-label { font-size: 11px; }
        }
        @media (max-width: 480px) {
          .hero-content-grid { padding: 40px 16px 20px; }
          .hero-stat-card { padding: 12px 18px; }
          .hero-btn-viewing { padding: 12px 20px; font-size: 13px; }
        }
      `}</style>

      {/* ── Video Background ── */}
      <div className="hero-bg">
        <video
          className="hero-bg-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="https://assets.mixkit.co/videos/44690/44690-thumb-720-0.jpg"
        >
          <source
            src="https://assets.mixkit.co/videos/44690/44690-1080.mp4"
            type="video/mp4"
          />
          <img
            src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1800&h=1000&fit=crop&auto=format&q=85"
            alt=""
          />
        </video>
        <div className="hero-bg-overlay" />
        <div className="hero-vignette" />
      </div>

      {/* ── Content Grid ── */}
      <div className="hero-content-grid">
        {/* LEFT: Copy */}
        <div>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(196, 30, 58, 0.9)",
              padding: "6px 14px",
              borderRadius: 20,
              width: "fit-content",
              marginBottom: 32,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Helping You Find More Than Just a Home
            </span>
          </div>

          {/* Headline */}
          <h1 className="hero-headline">
            Find Your
            <span
              style={{
                display: "block",
                background:
                  "linear-gradient(135deg, #b12b2b 10%, #c62f2f 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Dream Home
            </span>
            <span className="hero-headline-sub">with Alfima Realty</span>
          </h1>

          <p className="hero-description">
            We make your dreams come true. Discover thousands of premium
            properties across the Philippines — backed by licensed brokers and
            trusted by thousands of Filipino families.
          </p>

          {/* Trust badges */}
          <div className="hero-trust-badges">
            {[
              { icon: <Shield size={13} />, label: "Licensed Brokers" },
              { icon: <Award size={13} />, label: "Award-Winning" },
              { icon: <Star size={13} />, label: "Highly Rated" },
            ].map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-1.5"
                style={{
                  background: "rgba(255, 255, 255, 0.19)",
                  border: "1px solid rgba(255,255,255,0.16)",
                  borderRadius: 100,
                  padding: "7px 16px",
                }}
              >
                <span style={{ color: "#e74c3c" }}>{b.icon}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  {b.label}
                </span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="hero-ctas">
            <Link href="/properties">
              <button className="hero-btn-primary">
                Browse Properties <ArrowRight size={16} />
              </button>
            </Link>
            <button
              className="hero-btn-viewing"
              onClick={() => setViewingOpen(true)}
            >
              Connect to an Agent
            </button>
          </div>

          {/* Stats — glass cards */}
          <div className="hero-stats">
            {[
              { value: propertyListingsValue, label: "Property Listings" },
              { value: developersListingsValue, label: "Developer Listings" },
              { value: partnersValue, label: "Partner Brands" },
            ].map((s) => (
              <div key={s.label} className="hero-stat-card">
                <p className="hero-stat-value">{s.value}</p>
                <p className="hero-stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Featured & latest news (hidden on mobile/tablet) */}
        <div className="hero-device-col">
          <NewsEvents />
        </div>
      </div>


      {/* ── Request Viewing Modal ── */}
      <RequestViewingModal
        isOpen={viewingOpen}
        onClose={() => setViewingOpen(false)}
      />
    </section>
  );
}
