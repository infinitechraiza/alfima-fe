import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// POST /api/profile/update
// Reads auth_token from httpOnly cookie, forwards multipart form to Laravel
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    // Forward the multipart FormData directly to Laravel
    const formData = await request.formData();
    const userId = formData.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 },
      );
    }

    // Remove user_id from the payload before sending to Laravel
    formData.delete("user_id");

    const res = await fetch(`${API_URL}/api/agents/${userId}`, {
      method: "POST", // multipart requires POST; Laravel handles PUT via _method
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "X-HTTP-Method-Override": "PUT",
      },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message ?? data.errors ?? "Failed to update profile" },
        { status: res.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
