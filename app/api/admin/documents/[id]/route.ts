import { NextRequest, NextResponse } from "next/server";

const LARAVEL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

type Ctx = { params: Promise<{ id: string }> };

async function safeJson(res: Response): Promise<NextResponse> {
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return NextResponse.json(json, { status: res.status });
  } catch {
    console.error("[laravel html error]", text.slice(0, 500));
    return NextResponse.json(
      {
        success: false,
        message: `Server error (${res.status}). Check Laravel logs.`,
      },
      { status: res.status },
    );
  }
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const token = _req.cookies.get("auth_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${LARAVEL}/api/admin/documents/${id}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  return safeJson(res);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const token = req.cookies.get("auth_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";
  const rawBody = await req.arrayBuffer();

  const res = await fetch(`${LARAVEL}/api/admin/documents/${id}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
    },
    body: rawBody,
  });
  return safeJson(res);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const token = req.cookies.get("auth_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${LARAVEL}/api/admin/documents/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  return safeJson(res);
}
