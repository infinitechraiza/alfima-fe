import { NextResponse } from "next/server";

const BASE = "https://api.vercel.com/v1/query/web-analytics";

function vercelParams(extra: Record<string, string>) {
  return new URLSearchParams({
    projectId: process.env.VERCEL_PROJECT_ID!,
    ...extra,
  });
}

async function vercelFetch(path: string, params: URLSearchParams) {
  const res = await fetch(`${BASE}/${path}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vercel API ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

// Runs a query independently — never throws, just returns empty on failure
async function safeQuery(path: string, params: URLSearchParams, fallback: any) {
  try {
    const json = await vercelFetch(path, params);
    return json.data ?? fallback;
  } catch (err) {
    console.error(`site-analytics: ${path} failed`, err);
    return fallback;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const since =
    searchParams.get("since") ??
    new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const until =
    searchParams.get("until") ?? new Date().toISOString().slice(0, 10);

  const [totals, countries, pages, referrers, devices, browsers, events] =
    await Promise.all([
      safeQuery("visits/count", vercelParams({ since, until }), null),
      safeQuery(
        "visits/aggregate",
        vercelParams({ since, until, by: "country", limit: "10" }),
        [],
      ),
      safeQuery(
        "visits/aggregate",
        vercelParams({ since, until, by: "route", limit: "10" }),
        [],
      ),
      safeQuery(
        "visits/aggregate",
        vercelParams({ since, until, by: "referrerHostname", limit: "10" }),
        [],
      ),
      safeQuery(
        "visits/aggregate",
        vercelParams({ since, until, by: "deviceType", limit: "10" }),
        [],
      ),
      safeQuery(
        "visits/aggregate",
        vercelParams({ since, until, by: "browserName", limit: "10" }),
        [],
      ),
      safeQuery(
        "events/aggregate",
        vercelParams({ since, until, by: "eventName", limit: "20" }),
        [],
      ),
    ]);

  return NextResponse.json({
    totals,
    countries,
    pages,
    referrers,
    devices,
    browsers,
    events,
  });
}
