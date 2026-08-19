// app/api/admin/services/route.ts

import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Safe JSON parse — falls back to text if response isn't JSON
async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text || `HTTP ${res.status}` };
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    if (searchParams.get("all")) params.set("all", "1");

    const res = await fetch(`${API_URL}/api/admin/services?${params}`, {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      cache: "no-store",
    });

    const data = await safeJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch services." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization");
    const formData = await request.formData();

    const res = await fetch(`${API_URL}/api/admin/services`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: token } : {}),
        // ✅ Do NOT set Content-Type — fetch sets it with the correct boundary
      },
      body: formData,
    });

    const data = await safeJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to create service." },
      { status: 500 },
    );
  }
}
