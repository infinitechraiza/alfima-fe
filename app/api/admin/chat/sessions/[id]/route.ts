// app/api/admin/chat/sessions/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';

const LARAVEL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

type Params = { params: Promise<{ id: string }> };

// GET → load session messages (supports ?after=N for polling)
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id }  = await params;
    const after   = req.nextUrl.searchParams.get('after') ?? '0';
    const token   = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res  = await fetch(`${LARAVEL}/api/admin/chat/sessions/${id}?after=${after}`, {
      headers: {
        Accept:        'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[admin/chat/sessions/id GET]', err);
    return NextResponse.json({ error: 'Failed to connect to API' }, { status: 500 });
  }
}

// POST → admin reply to session
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id }  = await params;
    const body    = await req.json();
    const token   = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res  = await fetch(`${LARAVEL}/api/admin/chat/sessions/${id}/reply`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept:         'application/json',
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[admin/chat/sessions/id POST]', err);
    return NextResponse.json({ error: 'Failed to connect to API' }, { status: 500 });
  }
}

// PATCH → update session status (active / resolved / pending)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id }  = await params;
    const body    = await req.json();
    const token   = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res  = await fetch(`${LARAVEL}/api/admin/chat/sessions/${id}/status`, {
      method:  'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept:         'application/json',
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[admin/chat/sessions/id PATCH]', err);
    return NextResponse.json({ error: 'Failed to connect to API' }, { status: 500 });
  }
}