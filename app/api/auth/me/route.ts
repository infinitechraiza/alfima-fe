import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    console.log("[me] API_URL:", API_URL);
    console.log("[me] token present:", !!token);

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    if (!API_URL) {
      console.error("[me] NEXT_PUBLIC_API_URL is not set!");
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 },
      );
    }

    const laravelRes = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    console.log("[me] Laravel status:", laravelRes.status);

    if (!laravelRes.ok) {
      console.error("[me] Laravel rejected token, status:", laravelRes.status);
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const data = await laravelRes.json();
    console.log("[me] user role:", data?.role);

    return NextResponse.json({ user: data }, { status: 200 });
  } catch (error) {
    console.error("[me] Exception:", error);
    return NextResponse.json({ error: "Laravel unreachable" }, { status: 503 });
  }
}
