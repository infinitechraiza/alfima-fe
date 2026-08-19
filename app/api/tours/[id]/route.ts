// app/api/tours/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ── PATCH /api/tours/[id] — agent updates tour status ────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token  = request.cookies.get('auth_token')?.value;
    const body   = await request.json();

    const res = await fetch(`${API_URL}/api/tours/${id}`, {
      method:  'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept:         'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to update tour' }, { status: 500 });
  }
}

// ── DELETE /api/tours/[id] ────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token  = request.cookies.get('auth_token')?.value;

    const res = await fetch(`${API_URL}/api/tours/${id}`, {
      method:  'DELETE',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to delete tour' }, { status: 500 });
  }
}