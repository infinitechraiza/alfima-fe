import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const url = new URL('/api/agent/reviews', BACKEND);
  searchParams.forEach((v, k) => url.searchParams.set(k, v));

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Accept':       'application/json',
        'Content-Type': 'application/json',
        'Cookie':       request.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Failed to fetch reviews.' }, { status: 502 });
  }
}