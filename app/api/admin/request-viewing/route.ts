import { NextResponse } from "next/server";

const LARAVEL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET() {
  try {
    const res  = await fetch(`${LARAVEL}/api/admin/viewing-requests`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
    });

    const json = await res.json();

    // Laravel returns paginated: { current_page, data: [...], ... }
    // Unwrap it so the frontend gets { success: true, data: [...] }
    const data = Array.isArray(json.data) ? json.data : (json.data?.data ?? []);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[request-viewing] fetch error:", err);
    return NextResponse.json({ success: false, message: "Failed to fetch" }, { status: 500 });
  }
}