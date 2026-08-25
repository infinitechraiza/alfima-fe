import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// POST /api/favorites/toggle
// Reads auth_token from httpOnly cookie, forwards JSON body to Laravel
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { property_id, source } = body;

    if (!property_id || !source) {
      return NextResponse.json(
        { error: "property_id and source are required" },
        { status: 400 },
      );
    }

    const res = await fetch(`${API_URL}/api/favorites/toggle`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ property_id, source }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message ?? data.errors ?? "Failed to toggle favorite" },
        { status: res.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Favorite toggle error:", error);
    return NextResponse.json(
      { error: "Failed to toggle favorite" },
      { status: 500 },
    );
  }
}