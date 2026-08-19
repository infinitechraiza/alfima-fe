// api/admin/request-viewing/[id]/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
const LARAVEL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body   = await req.json();
    const res    = await fetch(`${LARAVEL}/api/admin/viewing-requests/${id}/notes`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body:    JSON.stringify(body),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch { return NextResponse.json({ success: false, message: "Failed to save notes" }, { status: 500 }); }
}