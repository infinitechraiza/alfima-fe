import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Frontend display labels → Laravel property_type enum values
const PROPERTY_TYPE_MAP: Record<string, string> = {
  "House & Lot": "house",
  Condominium: "condo",
  Townhouse: "townhouse",
  Apartment: "apartment",
  Commercial: "commercial",
  "Lot Only": "lot",
  Warehouse: "warehouse",
};

// Frontend "For Sale" / "For Rent" → Laravel listing_type enum values
const LISTING_TYPE_MAP: Record<string, string> = {
  "For Sale": "sale",
  "For Rent": "rent",
};

// ── GET /api/properties ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const incoming = request.nextUrl.searchParams;
    const params = new URLSearchParams();

    const listingType =
      incoming.get("listingType") || incoming.get("listing_type");
    if (listingType) {
      params.set("listing_type", LISTING_TYPE_MAP[listingType] ?? listingType);
    }

    const propType = incoming.get("type") || incoming.get("property_type");
    if (propType) {
      params.set("property_type", PROPERTY_TYPE_MAP[propType] ?? propType);
    }

    if (incoming.get("developer"))
      params.set("developer", incoming.get("developer")!);
    if (incoming.get("minPrice"))
      params.set("min_price", incoming.get("minPrice")!);
    if (incoming.get("min_price"))
      params.set("min_price", incoming.get("min_price")!);
    if (incoming.get("maxPrice"))
      params.set("max_price", incoming.get("maxPrice")!);
    if (incoming.get("max_price"))
      params.set("max_price", incoming.get("max_price")!);
    if (incoming.get("bedrooms"))
      params.set("bedrooms", incoming.get("bedrooms")!);
    if (incoming.get("bathrooms"))
      params.set("bathrooms", incoming.get("bathrooms")!);
    if (incoming.get("city")) params.set("city", incoming.get("city")!);
    if (incoming.get("search")) params.set("search", incoming.get("search")!);
    // FIX: was never forwarded, so ?scope=all from the Hero search bar
    // (which asks the backend to include developer_properties inventory)
    // was silently dropped here, and Laravel always fell back to the
    // agent-only query — causing "no results" even when matching
    // developer listings existed.
    if (incoming.get("scope")) params.set("scope", incoming.get("scope")!);
    if (incoming.get("agent_id"))
      params.set("agent_id", incoming.get("agent_id")!);
    if (incoming.get("status")) params.set("status", incoming.get("status")!);
    if (incoming.get("page")) params.set("page", incoming.get("page")!);
    if (incoming.get("per_page"))
      params.set("per_page", incoming.get("per_page")!);

    // FIX: use the translated params, not the raw incoming query string
    const url = `${API_URL}/api/properties?${params.toString()}`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("Laravel properties fetch failed:", res.status, errorBody);
      return NextResponse.json(
        {
          error: "Failed to fetch properties",
          status: res.status,
          detail: errorBody,
        },
        { status: res.status },
      );
    }

    return NextResponse.json(await res.json());
  } catch (error) {
    console.error("[api/properties] CAUGHT ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 },
    );
  }
}

// ── POST /api/properties ────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    const formData = await request.formData();

    const res = await fetch(`${API_URL}/api/properties`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[api/properties POST] CAUGHT ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 },
    );
  }
}
