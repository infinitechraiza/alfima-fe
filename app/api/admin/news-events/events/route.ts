// File location: app/api/admin/news-events/events/route.ts
import { NextRequest, NextResponse } from "next/server";

const LARAVEL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

async function proxyJson(res: Response): Promise<NextResponse> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: `Upstream error (${res.status})` },
      { status: res.status },
    );
  }
  return NextResponse.json(await res.json(), { status: res.status });
}

// GET /api/admin/news-events/events — list all events
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const res = await fetch(`${LARAVEL}/api/admin/news-events/events`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    return proxyJson(res);
  } catch (err) {
    console.error("[admin/news-events/events GET]", err);
    return NextResponse.json(
      { error: "Failed to connect to API" },
      { status: 500 },
    );
  }
}

// POST /api/admin/news-events/events — create a new event (multipart)
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.formData();

    const res = await fetch(`${LARAVEL}/api/admin/news-events/events`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
    });

    return proxyJson(res);
  } catch (err) {
    console.error("[admin/news-events/events POST]", err);
    return NextResponse.json(
      { error: "Failed to connect to API" },
      { status: 500 },
    );
  }
}
