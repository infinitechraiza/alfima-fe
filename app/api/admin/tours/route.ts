// app/api/admin/tours/route.ts

import { NextRequest, NextResponse } from 'next/server';

const LARAVEL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Forward all query params (search, status, tour_type, page, per_page)
    const search = req.nextUrl.search;

    const res  = await fetch(`${LARAVEL}/api/admin/tours${search}`, {
      headers: {
        Accept:        'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[admin/tours GET]', err);
    return NextResponse.json({ error: 'Failed to connect to API' }, { status: 500 });
  }
}