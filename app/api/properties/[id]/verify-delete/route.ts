import { NextRequest, NextResponse } from "next/server";

const BACKEND = `${process.env.NEXT_PUBLIC_API_URL}/api`;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = req.cookies.get("auth_token")?.value ?? "";
  const body = await req.json().catch(() => ({}));

  const res = await fetch(
    `${BACKEND}/properties/${id}/verify-delete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}