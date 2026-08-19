// app/api/tours/route.ts

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ── POST /api/tours (public — buyer books a tour) ─────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${API_URL}/api/tours`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept:         'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to submit tour booking' }, { status: 500 });
  }
}

// ── GET /api/tours (agent/admin — requires auth token in cookie) ──────────────
export async function GET(request: NextRequest) {
  try {
    const token  = request.cookies.get('auth_token')?.value;
    const params = request.nextUrl.searchParams.toString();

    const res = await fetch(`${API_URL}/api/tours${params ? `?${params}` : ''}`, {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tours' }, { status: 500 });
  }
}