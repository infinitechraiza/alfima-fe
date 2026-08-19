// api/admin/request-viewing/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
const LARAVEL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res    = await fetch(`${LARAVEL}/api/admin/viewing-requests/${id}`, {
      method:  "DELETE",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch { return NextResponse.json({ success: false, message: "Failed to delete" }, { status: 500 }); }
}