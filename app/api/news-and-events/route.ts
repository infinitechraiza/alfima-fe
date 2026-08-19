import { NextResponse } from "next/server";

const LARAVEL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

export async function GET() {
  try {
    const res = await fetch(`${LARAVEL}/api/news-and-events`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { error: `Upstream error (${res.status})` },
        { status: res.status },
      );
    }

    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err) {
    console.error("[news-and-events GET]", err);
    return NextResponse.json(
      { error: "Failed to connect to API" },
      { status: 500 },
    );
  }
}
