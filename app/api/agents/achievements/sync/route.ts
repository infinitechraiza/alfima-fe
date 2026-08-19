import { NextRequest, NextResponse } from 'next/server';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

export async function PUT(request: NextRequest) {
  try {
    // ✅ Read the httpOnly token your login handler stored
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });
    }

    const body = await request.json();

    const res = await fetch(`${BACKEND}/api/agents/achievements/sync`, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        // ✅ Send as Bearer token — this is what Sanctum expects
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Failed to sync achievements.' }, { status: 502 });
  }
}