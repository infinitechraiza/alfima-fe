// app/api/admin/partners/[id]/toggle/route.ts

import { NextRequest, NextResponse } from 'next/server';

const LARAVEL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function getToken(req: NextRequest) {
  return req.cookies.get('auth_token')?.value ?? null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = await getToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // No body — toggle is a side-effect-only POST
    const res = await fetch(`${LARAVEL}/api/admin/partners/${id}/toggle`, {
      method:  'POST',
      headers: {
        Accept:        'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err) {
    console.error('[admin/partners/:id/toggle POST]', err);
    return NextResponse.json({ error: 'Failed to connect to API' }, { status: 500 });
  }
}