// app/api/admin/analytics/trends/route.ts

import { NextRequest, NextResponse } from "next/server";

const LARAVEL_API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie") ?? "";
    const days = request.nextUrl.searchParams.get("days") ?? "30";

    const res = await fetch(
      `${LARAVEL_API}/api/external/analytics/trends?days=${encodeURIComponent(days)}`,
      {
        method: "GET",
        headers: {
          Cookie: cookie,
          "X-API-Key": process.env.LARAVEL_ANALYTICS_API_KEY ?? "",
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

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
    console.error("[analytics/trends proxy]", err);
    return NextResponse.json(
      { success: false, message: "Failed to reach analytics service" },
      { status: 502 },
    );
  }
}
