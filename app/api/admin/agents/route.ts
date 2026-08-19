import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { searchParams } = new URL(request.url);

  if (!token) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const res = await fetch(
    `${API_URL}/api/admin/agents?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json();

  // Step 1: Register the agent (creates the user account)
  const registerRes = await fetch(
    `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Admin-Create": "1",
      },
      body: JSON.stringify(body),
    },
  );

  const data = await registerRes.json();
  if (!registerRes.ok) {
    return NextResponse.json(data, { status: registerRes.status });
  }

  // Step 2: If specialization or experience_years were provided,
  // patch the newly created agent with those fields
  const agentId = data.user?.id;
  if (agentId && (body.specialization || body.experience_years != null)) {
    await fetch(`${API_URL}/api/agents/${agentId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        specialization: body.specialization ?? null,
        experience_years: body.experience_years ?? null,
      }),
    }).catch(() => {}); // non-fatal if this fails
  }

  return NextResponse.json(data, { status: registerRes.status });
}
