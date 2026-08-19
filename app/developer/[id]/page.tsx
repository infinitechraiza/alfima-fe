import type { Metadata } from "next";
import PropertyDetailsPage from "@/components/property/property-details-page";
type Props = {
  params: Promise<{ id: string }>;
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/developers-properties/${id}`,
      {
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) {
      return {
        title: "Property Details",
      };
    }
    const property = await res.json();
    return {
      title: property.title || "Property Details",
      description:
        property.description ||
        `View details, photos, amenities, and unit offerings for ${property.title}.`,
    };
  } catch {
    return {
      title: "Property Details",
    };
  }
}
export default function Page({ params }: Props) {
  return <PropertyDetailsPage params={params} source="developer" />;
}
