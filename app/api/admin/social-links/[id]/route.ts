// app/api/admin/social-links/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getToken(req: NextRequest) {
  return req.cookies.get("auth_token")?.value;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = getToken(req);
    const body = await req.json();

    const res = await fetch(`${API_URL}/api/admin/social-links/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text || "Unexpected server error" };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("PUT /api/admin/social-links/[id] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = getToken(req);

    const res = await fetch(`${API_URL}/api/admin/social-links/${id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text || "Unexpected server error" };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("DELETE /api/admin/social-links/[id] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
