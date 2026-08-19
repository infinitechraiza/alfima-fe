// app/api/admin/partners/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";

const LARAVEL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

async function getToken(req: NextRequest) {
  return req.cookies.get("auth_token")?.value ?? null;
}

/** Safely parse a fetch Response as JSON, or return a structured error if it's HTML/text. */
async function safeJson(res: Response) {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    console.error(
      `[partners] Expected JSON but got ${contentType}. Status: ${res.status}. Body preview:\n${text.slice(0, 500)}`,
    );
    return {
      parsed: {
        success: false,
        message: `Upstream error (${res.status}): server returned non-JSON response.`,
      },
      status: res.status >= 200 && res.status < 300 ? 502 : res.status,
    };
  }
  return { parsed: await res.json(), status: res.status };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = await getToken(req);
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const res = await fetch(`${LARAVEL}/api/admin/partners/${id}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });

    const { parsed, status } = await safeJson(res);
    return NextResponse.json(parsed, { status });
  } catch (err) {
    console.error("[admin/partners/:id GET]", err);
    return NextResponse.json(
      { error: "Failed to connect to API" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = await getToken(req);
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.formData();

    const res = await fetch(`${LARAVEL}/api/admin/partners/${id}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        // Do NOT set Content-Type here — let fetch set the multipart boundary automatically
      },
      body: body as any,
    });

    const { parsed, status } = await safeJson(res);
    return NextResponse.json(parsed, { status });
  } catch (err) {
    console.error("[admin/partners/:id POST]", err);
    return NextResponse.json(
      { error: "Failed to connect to API" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = await getToken(req);
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const res = await fetch(`${LARAVEL}/api/admin/partners/${id}`, {
      method: "DELETE",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });

    const { parsed, status } = await safeJson(res);
    return NextResponse.json(parsed, { status });
  } catch (err) {
    console.error("[admin/partners/:id DELETE]", err);
    return NextResponse.json(
      { error: "Failed to connect to API" },
      { status: 500 },
    );
  }
}
