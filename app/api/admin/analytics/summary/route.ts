// app/api/admin/analytics/summary/route.ts

import { NextRequest, NextResponse } from "next/server";

const LARAVEL_API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    // Forward whatever admin session/token this route already has for other
    // /api/admin/* proxies (e.g. inquiries). Adjust to match that pattern —
    // this assumes an httpOnly cookie forwarded as-is, plus a server-side
    // API key for the Laravel `external` route group.
    const cookie = request.headers.get("cookie") ?? "";

    const res = await fetch(`${LARAVEL_API}/api/external/analytics/summary`, {
      method: "GET",
      headers: {
        Cookie: cookie,
        "X-API-Key": process.env.LARAVEL_ANALYTICS_API_KEY ?? "",
        Accept: "application/json",
      },
      // Analytics summary is cached server-side for 5 min already;
      // no need to cache again at this layer.
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        {
          success: false,
          message: `Laravel responded ${res.status}`,
          detail: text,
        },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[analytics/summary proxy]", err);
    return NextResponse.json(
      { success: false, message: "Failed to reach analytics service" },
      { status: 502 },
    );
  }
}
