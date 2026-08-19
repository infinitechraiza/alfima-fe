// app/api/admin/about/[resource]/route.ts

import { NextRequest, NextResponse } from "next/server";

const LARAVEL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

type Ctx = { params: Promise<{ resource: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { resource } = await params;
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const res = await fetch(`${LARAVEL}/api/admin/about/${resource}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });

    if (!res.headers.get("content-type")?.includes("application/json"))
      return NextResponse.json(
        { error: `Upstream error (${res.status})` },
        { status: res.status },
      );

    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err) {
    console.error(`[admin/about/${resource} GET]`, err);
    return NextResponse.json(
      { error: "Failed to connect to API" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { resource } = await params;
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const res = await fetch(`${LARAVEL}/api/admin/about/${resource}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.headers.get("content-type")?.includes("application/json"))
      return NextResponse.json(
        { error: `Upstream error (${res.status})` },
        { status: res.status },
      );

    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err) {
    console.error(`[admin/about/${resource} POST]`, err);
    return NextResponse.json(
      { error: "Failed to connect to API" },
      { status: 500 },
    );
  }
}
