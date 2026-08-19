import type { Metadata } from "next";
import PropertiesPageClient from "@/components/property/properties-client";

interface PageProps {
  searchParams: Promise<{ name?: string }>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { name } = await searchParams;

  const title = name
    ? `${name} | Alfima Realty Inc.`
    : "Property Listings | Alfima Realty Inc.";

  const description = name
    ? `Browse listings matching "${name}" from Alfima Realty Inc.`
    : "Browse property listings for sale and rent across the Philippines from Alfima Realty Inc.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default function PropertiesPage() {
  return <PropertiesPageClient />;
}