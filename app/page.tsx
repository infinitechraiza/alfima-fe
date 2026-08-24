"use client";

import { useEffect, useState } from "react";
import { Property } from "@/lib/types";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedProperties } from "@/components/home/FeaturedProperties";
import { WhyChooseUs } from "@/components/home/WhyAndHow";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { CTASection } from "@/components/home/CTASection";
import { OurPartners } from "@/components/home/OurPartners";
import { HeroSearch } from "@/components/home/HeroSearch";

interface HeroSectionProps {
  onSearch: (filters: any) => void;
}

export default function HomePage({ onSearch }: HeroSectionProps) {
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch("/api/developers-properties");
        const data = await response.json();
        setFeaturedProperties(data.data ?? []);
      } catch (error) {
        console.error("Failed to fetch properties:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const handleSearch = (filters: any) => {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.listingType) params.append("listingType", filters.listingType);
    if (filters.type) params.append("type", filters.type);
    if (filters.minPrice) params.append("minPrice", filters.minPrice);
    if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
    if (filters.bedrooms) params.append("bedrooms", filters.bedrooms);
    if (filters.city) params.append("city", filters.city);
    window.location.href = `/properties?${params.toString()}`;
  };

  return (
    <div className="w-full">
      <HeroStyles />
     
      <HeroSection />

      {/* ── Search Bar ── */}
      <HeroSearch onSearch={onSearch} />
      
      {/* <StatsSection /> */}
      <FeaturedProperties properties={featuredProperties} loading={loading} />
      <TestimonialsSection />
      <WhyChooseUs />
      {/* <HowItWorks /> */}
      <CTASection />
      <OurPartners />
    </div>
  );
}

function HeroStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

      .hero-section {
        position: relative; min-height: 100vh;
        display: flex; flex-direction: column;
        overflow: hidden; font-family: 'DM Sans', sans-serif;
      }
      .hero-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }

      .hero-bg-video {
        position: absolute; inset: 0;
        width: 100%; height: 100%;
        object-fit: cover;
        filter: saturate(1.15) brightness(1.0);
        animation: kenBurns 30s ease-in-out infinite;
        transition: opacity 1.2s ease;
      }

      @keyframes kenBurns {
        0%   { transform: scale(1.04) translate(0, 0); }
        50%  { transform: scale(1.08) translate(-1%, -0.5%); }
        100% { transform: scale(1.04) translate(0, 0); }
      }

      .hero-bg-overlay {
        position: absolute; inset: 0;
        background:
          linear-gradient(105deg,
            rgba(5,5,15,0.72)  0%,
            rgba(5,5,15,0.52) 38%,
            rgba(5,5,15,0.22) 62%,
            rgba(5,5,15,0.05) 100%),
          linear-gradient(180deg,
            rgba(0,0,0,0.08) 0%,
            rgba(0,0,0,0.35) 100%);
      }

      .hero-vignette {
        position: absolute; inset: 0;
        background: radial-gradient(
          ellipse 120% 100% at 50% 50%,
          transparent 60%,
          rgba(0,0,0,0.28) 100%
        );
      }

      @keyframes badgePulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.55; transform: scale(1.45); }
      }
      .badge-dot-anim { animation: badgePulse 2s infinite; }

      .chrome-dot-r { background: #ff5f57; box-shadow: 0 0 4px rgba(255,95,87,0.6); }
      .chrome-dot-y { background: #ffbd2e; box-shadow: 0 0 4px rgba(255,189,46,0.5); }
      .chrome-dot-g { background: #28c840; box-shadow: 0 0 4px rgba(40,200,64,0.5); }

      .hero-btn-primary {
        background: #c62f2f; color: #fff; border: none; cursor: pointer;
        padding: 14px 28px; border-radius: 12px; font-size: 14px; font-weight: 600;
        font-family: 'DM Sans', sans-serif; transition: all 0.22s;
        display: inline-flex; align-items: center; gap: 8px;
      }
      .hero-btn-primary:hover {
        background: #da5454; transform: translateY(-2px);
        box-shadow: 0 8px 28px #8b1a1a;
      }
      .hero-btn-secondary {
        background: rgba(255,255,255,0.11); color: rgba(255,255,255,0.9);
        border: 1px solid rgba(255,255,255,0.22); cursor: pointer;
        padding: 14px 28px; border-radius: 12px; font-size: 14px; font-weight: 500;
        font-family: 'DM Sans', sans-serif; transition: all 0.22s;
        display: inline-flex; align-items: center; gap: 8px;
      }
      .hero-btn-secondary:hover { background: rgba(255,255,255,0.2); }

      .laptop-frame {
        background: #1e1e2e; border-radius: 14px 14px 0 0;
        border: 7px solid #4a4a6a; border-bottom: 4px solid #4a4a6a;
        overflow: hidden;
        box-shadow: 0 0 0 1px rgba(255,255,255,0.2), 0 25px 60px rgba(0,0,0,0.7);
        aspect-ratio: 16/10; display: flex; flex-direction: column;
      }
      .laptop-base-bar {
        background: linear-gradient(180deg, #4a4a6a 0%, #3a3a58 100%);
        height: 10px; border-radius: 0 0 3px 3px; box-shadow: 0 3px 0 #2a2a40;
      }
      .laptop-foot-bar {
        background: linear-gradient(180deg, #3a3a58 0%, #30305a 100%);
        height: 6px; border-radius: 0 0 8px 8px; margin: 0 -10px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.6);
      }
      .laptop-chrome {
        background: #2a2a42; padding: 8px 12px;
        display: flex; align-items: center; gap: 10px;
        border-bottom: 1px solid rgba(255,255,255,0.12); flex-shrink: 0;
      }
      .laptop-url-bar {
        flex: 1; background: #1a1a2e; border-radius: 6px;
        padding: 4px 12px; display: flex; align-items: center; gap: 6px;
        margin: 0 8px; border: 1px solid rgba(255,255,255,0.12);
      }
      .phone-outer {
        background: linear-gradient(145deg, #4a4a68, #35355a);
        border-radius: 30px; padding: 7px; position: relative;
        box-shadow:
          0 0 0 1px rgba(255,255,255,0.22),
          0 0 0 2px rgba(255,255,255,0.06),
          0 35px 70px rgba(0,0,0,0.7),
          inset 0 1px 0 rgba(255,255,255,0.2);
      }
      .phone-screen-wrap {
        background: #1a1a2e; border-radius: 24px; overflow: hidden;
        position: relative; border: 1px solid rgba(255,255,255,0.1);
      }
      .phone-island {
        position: absolute; top: 9px; left: 50%; transform: translateX(-50%);
        width: 58px; height: 17px; background: #050510;
        border-radius: 12px; z-index: 20;
      }
      .float-card {
        position: absolute; z-index: 10;
        background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.28);
        border-radius: 14px; padding: 12px 16px; display: flex; align-items: center; gap: 10px;
        box-shadow: 0 16px 40px rgba(0,0,0,0.4); backdrop-filter: blur(16px);
      }

      @media (prefers-reduced-motion: reduce) {
        .hero-bg-video { animation: none; }
      }
    `}</style>
  );
}
