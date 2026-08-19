// app/api/admin/social-links/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getToken(req: NextRequest) {
  return req.cookies.get("auth_token")?.value;
}

export async function GET(req: NextRequest) {
  const token = getToken(req);

  const res = await fetch(`${API_URL}/api/admin/social-links`, {
    // ✅ /api/admin/
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: text || "Unexpected server error" };
  }

  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  try {
    const token = getToken(req);
    const body = await req.json();

    const res = await fetch(`${API_URL}/api/admin/social-links`, {
      // ✅ /api/admin/
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text || "Unexpected server error" };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("POST /api/admin/social-links error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
