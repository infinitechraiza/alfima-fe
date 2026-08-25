import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// GET /api/favorites
// Reads auth_token from httpOnly cookie, forwards to Laravel
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const res = await fetch(`${API_URL}/api/favorites`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message ?? data.errors ?? "Failed to load favorites" },
        { status: res.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Favorites list error:", error);
    return NextResponse.json(
      { error: "Failed to load favorites" },
      { status: 500 },
    );
  }
}
