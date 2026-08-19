import { NextResponse } from "next/server";

const LARAVEL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

export async function GET() {
  try {
    const res = await fetch(`${LARAVEL}/api/about`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 }, // cache for 60s, optional
    });

    if (!res.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json(
        { error: `Upstream error (${res.status})` },
        { status: res.status },
      );
    }

    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err) {
    console.error("[/api/about GET]", err);
    return NextResponse.json(
      { error: "Failed to connect to API" },
      { status: 500 },
    );
  }
}
