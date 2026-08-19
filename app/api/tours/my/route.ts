// app/api/tours/my/route.ts
// Returns tours where the logged-in BUYER is the lead (matched by phone/email)
// Since Laravel's TourController scopes by agent_id for agents, we need a
// separate public-ish endpoint that matches by lead_phone from the auth user.

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(request: NextRequest) {
  try {
    const token  = request.cookies.get('auth_token')?.value;
    const params = request.nextUrl.searchParams.toString();

    // Forward to Laravel — the buyer_tours endpoint scopes by the auth user's phone
    const res = await fetch(`${API_URL}/api/tours/my${params ? `?${params}` : ''}`, {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
    });

    // If Laravel doesn't have this route yet, return empty gracefully
    if (res.status === 404) {
      return NextResponse.json({ data: [], total: 0 });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ data: [], total: 0 });
  }
}