"use client";

import {
  Home,
  TrendingUp,
  Users,
  MapPin,
  CheckCircle,
  Star,
  Shield,
  Zap,
  Building2,
  Award,
} from "lucide-react";
import { useEffect, useState } from "react";

interface WhyItem {
  id: number;
  icon: string;
  number: string;
  title: string;
  description: string;
  accent_color: string;
  sort_order: number;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Shield: <Shield className="w-6 h-6 text-white" />,
  Star: <Star className="w-6 h-6 text-white" />,
  Users: <Users className="w-6 h-6 text-white" />,
  TrendingUp: <TrendingUp className="w-6 h-6 text-white" />,
  MapPin: <MapPin className="w-6 h-6 text-white" />,
  CheckCircle: <CheckCircle className="w-6 h-6 text-white" />,
  Home: <Home className="w-6 h-6 text-white" />,
  Zap: <Zap className="w-6 h-6 text-white" />,
  Building2: <Building2 className="w-6 h-6 text-white" />,
  Award: <Award className="w-6 h-6 text-white" />,
};

export function WhyChooseUs() {
  const [items, setItems] = useState<WhyItem[]>([]);

  useEffect(() => {
    fetch("/api/about")
      .then((r) => r.json())
      .then((data) => setItems(data.why_choose_us ?? []))
      .catch(console.error);
  }, []);

  if (items.length === 0) return null;

  const gridCols =
    items.length === 1
      ? "lg:grid-cols-1"
      : items.length === 2
        ? "lg:grid-cols-2"
        : items.length === 3
          ? "lg:grid-cols-3"
          : "lg:grid-cols-4";

  return (
    <section className="py-24 sm:py-32 bg-gradient-to-t from-[#6b2d2d] from-[20%] to-rose-900/20 to-[100%]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Why Choose Us?
          </h2>
          <p className="text-rose-200 text-xl max-w-2xl mx-auto">
            Experience premium real estate services with cutting-edge technology
          </p>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-8`}>
          {items.map((item) => (
            <div
              key={item.id}
              className="border border-white/25 hover:border-white/50 p-8 rounded-2xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group"
              style={{
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition"
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "#ffffff",
                }}
              >
                {ICON_MAP[item.icon] ?? <Home className="w-6 h-6 text-white" />}
              </div>

              {item.number && (
                <span className="text-red-200/60 text-xs font-black tracking-widest mb-2 block">
                  {item.number}
                </span>
              )}

              <h3 className="font-bold text-xl text-white mb-3">
                {item.title}
              </h3>
              <p className="text-white/85">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex items-center gap-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-rose-700/50 to-rose-700/50" />
          <div className="flex gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600/60" />
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80" />
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600/60" />
          </div>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-rose-700/50 to-rose-700/50" />
        </div>
      </div>
    </section>
  );
}
