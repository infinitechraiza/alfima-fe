"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Property } from "@/lib/types";
import { PropertyCard } from "@/components/developer-property-card";
import { Button } from "@/components/ui/button";
import { PartnerDevelopers } from "@/components/partner-developers-section";

interface FeaturedPropertiesProps {
  properties: Property[];
  loading: boolean;
}

export function FeaturedProperties({
  properties,
  loading,
}: FeaturedPropertiesProps) {
  return (
    <section className="py-32 sm:py-44 bg-gradient-to-b from-[#8b1a1a] from-[20%] to-red-800/30 to-[100%]">
      <PartnerDevelopers />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Featured Properties
          </h2>
          <p className="text-rose-100 text-xl">
            Explore our handpicked selection of premium listings
          </p>
        </div>
      
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-md h-96 rounded-2xl animate-pulse border border-rose-300/30"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 items-stretch">
            {properties
              .sort((a, b) => {
                const aP = Number(a.priority);
                const bP = Number(b.priority);
                const aHas = !isNaN(aP) && aP >= 1;
                const bHas = !isNaN(bP) && bP >= 1;

                if (aHas && bHas) return aP - bP;
                if (aHas) return -1;
                if (bHas) return 1;
                return 0;
              })
              .slice(0, 9)
              .map((property, i) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  priority={i < 3}
                />
              ))}
          </div>
        )}

        <div className="text-center">
          <Link href="/developer">
            <Button className="bg-gradient-to-r from-rose-400 to-red-500 hover:from-rose-500 hover:to-red-600 text-red-950 font-bold gap-2 text-lg px-8 py-6">
              View All Properties <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
