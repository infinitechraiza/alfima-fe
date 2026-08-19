// app/api/admin/partners/route.ts

import { NextRequest, NextResponse } from 'next/server';

const LARAVEL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const res  = await fetch(`${LARAVEL}/api/admin/partners${req.nextUrl.search}`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });

    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err) {
    console.error('[admin/partners GET]', err);
    return NextResponse.json({ error: 'Failed to connect to API' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Forward multipart/form-data as-is
    const body = await req.formData();

    const res = await fetch(`${LARAVEL}/api/admin/partners`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` }, // no Content-Type — fetch sets boundary automatically
      body:    body as any,
    });

    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err) {
    console.error('[admin/partners POST]', err);
    return NextResponse.json({ error: 'Failed to connect to API' }, { status: 500 });
  }
}