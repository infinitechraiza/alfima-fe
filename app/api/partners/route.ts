// app/api/partners/route.ts  (public — no auth token required)

import { NextRequest, NextResponse } from 'next/server';

const LARAVEL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${LARAVEL}/api/partners${req.nextUrl.search}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 }, // cache for 60s, adjust as needed
    });

    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err) {
    console.error('[/api/partners GET]', err);
    return NextResponse.json({ error: 'Failed to connect to API' }, { status: 500 });
  }
}