// File location: app/api/admin/news-events/articles/route.ts
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

// GET /api/admin/news-events/articles — list all articles
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const res = await fetch(`${LARAVEL}/api/admin/news-events/articles`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    return proxyJson(res);
  } catch (err) {
    console.error("[admin/news-events/articles GET]", err);
    return NextResponse.json(
      { error: "Failed to connect to API" },
      { status: 500 },
    );
  }
}

// POST /api/admin/news-events/articles — create a new article (multipart)
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.formData();

    const res = await fetch(`${LARAVEL}/api/admin/news-events/articles`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
    });

    return proxyJson(res);
  } catch (err) {
    console.error("[admin/news-events/articles POST]", err);
    return NextResponse.json(
      { error: "Failed to connect to API" },
      { status: 500 },
    );
  }
}
