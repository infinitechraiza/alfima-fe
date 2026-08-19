import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  try {
    console.log("Fetching from:", `${API_URL}/api/social-links`); // 👈 check terminal

    const res = await fetch(`${API_URL}/api/social-links`, {
      headers: { Accept: "application/json" },
      cache: "no-store", // 👈 disable cache temporarily
    });

    console.log("Laravel status:", res.status); // 👈 check terminal

    const data = await res.json();

    console.log("Laravel data:", data); // 👈 check terminal

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Social links proxy error:", err); // 👈 check terminal
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
