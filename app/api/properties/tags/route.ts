import { NextResponse } from "next/server";

export async function GET() {
  const laravelBase = process.env.NEXT_PUBLIC_API_URL;

  // Preferred: a dedicated backend endpoint returning distinct tags.
  try {
    const res = await fetch(`${laravelBase}/api/properties/tags`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(Array.isArray(data) ? data : (data.data ?? []));
    }
  } catch (err) {
    console.error("Dedicated tags endpoint failed:", err);
  }

  // Fallback: aggregate tags from all properties client-side.
  try {
    const res = await fetch(`${laravelBase}/api/admin/properties?per_page=1000`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    const properties = Array.isArray(json.data) ? json.data : [];

    const seen = new Map<string, { label: string; color: string }>();
    for (const p of properties) {
      for (const t of p.tags ?? []) {
        if (!t?.label?.trim()) continue;
        const key = t.label.trim().toLowerCase();
        if (!seen.has(key)) {
          seen.set(key, { label: t.label.trim(), color: t.color ?? "red" });
        }
      }
    }
    return NextResponse.json(Array.from(seen.values()));
  } catch (err) {
    console.error("Tag aggregation fallback failed:", err);
    return NextResponse.json([], { status: 200 });
  }
}