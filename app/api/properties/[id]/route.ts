// app/api/properties/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  "http://localhost:8000";

// ── GET /api/properties/[id] (public) ────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!API_URL) {
    return NextResponse.json(
      { error: "API_URL is not configured" },
      { status: 500 },
    );
  }

  try {
    const { id } = await params;

    const res = await fetch(`${API_URL}/api/properties/${id}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const data = await res
      .json()
      .catch(() => ({ error: "Invalid JSON from API" }));

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? "Failed to fetch property" },
        { status: res.status },
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[api/properties/[id] GET] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch property" },
      { status: 500 },
    );
  }
}

// ── DELETE /api/properties/[id] (agent/admin) ────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = request.cookies.get("auth_token")?.value;

    const res = await fetch(`${API_URL}/api/properties/${id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 },
    );
  }
}

// ── POST /api/properties/[id] (agent/admin — form-data with _method=PUT) ─────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = request.cookies.get("auth_token")?.value;
    const formData = await request.formData();

    const res = await fetch(`${API_URL}/api/properties/${id}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500 },
    );
  }
}
// ── PATCH /api/properties/[id] (agent/admin) ─────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = request.cookies.get("auth_token")?.value;
    const body = await request.json();

    const res = await fetch(`${API_URL}/api/properties/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500 },
    );
  }
}
