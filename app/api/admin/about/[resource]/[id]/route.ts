// app/api/admin/about/[resource]/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";

const LARAVEL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

type Ctx = { params: Promise<{ resource: string; id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { resource, id } = await params;
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const res = await fetch(`${LARAVEL}/api/admin/about/${resource}/${id}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err) {
    console.error(`[admin/about/${resource}/${id} PUT]`, err);
    return NextResponse.json(
      { error: "Failed to connect to API" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { resource, id } = await params;
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const res = await fetch(`${LARAVEL}/api/admin/about/${resource}/${id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err) {
    console.error(`[admin/about/${resource}/${id} DELETE]`, err);
    return NextResponse.json(
      { error: "Failed to connect to API" },
      { status: 500 },
    );
  }
}
