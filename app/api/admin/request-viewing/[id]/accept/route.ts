// api/admin/request-viewing/[id]/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
const LARAVEL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body   = await req.json().catch(() => ({}));
    const res    = await fetch(`${LARAVEL}/api/admin/viewing-requests/${id}/accept`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body:    JSON.stringify(body),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch { return NextResponse.json({ success: false, message: "Failed to accept" }, { status: 500 }); }
}