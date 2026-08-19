import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("auth_token")?.value ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const propertyId = formData.get("property_id");
    if (!propertyId) {
      return NextResponse.json(
        { message: "Missing property_id" },
        { status: 400 },
      );
    }

    const res = await fetch(
      `${BACKEND}/api/properties/${propertyId}/videos/chunk`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      },
    );

    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    const text = await res.text();
    console.error(
      "[properties/videos/chunk] Laravel error:",
      text.substring(0, 500),
    );
    return NextResponse.json(
      { message: "Backend error" },
      { status: res.status },
    );
  } catch (error) {
    console.error("[properties/videos/chunk] Exception:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
