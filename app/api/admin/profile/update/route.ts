import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const formData = await request.formData();
    const userId = formData.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 },
      );
    }

    // Convert FormData to a plain JSON object (excluding user_id)
    const body: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (key !== "user_id") {
        body[key] = value as string;
      }
    });

    const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json", // ← critical
      },
      body: JSON.stringify(body), // ← send as JSON, not FormData
    });

    const data = await res.json();

    console.log("Laravel response:", JSON.stringify(data));

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message ?? data.error ?? "Failed to update profile" },
        { status: res.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Admin profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
