// app/api/agents/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Params = { params: Promise<{ id: string }> };

// ── GET /api/agents/[id] ──────────────────────────────────────────────────────
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const res = await fetch(`${API_URL}/api/agents/${id}`, {
    headers: { Accept: 'application/json' },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

// ── POST /api/agents/[id] (multipart with _method=PUT for avatar upload) ──────
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const token  = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const body = await request.formData();

  const res = await fetch(`${API_URL}/api/agents/${id}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

// ── PUT /api/agents/[id] ──────────────────────────────────────────────────────
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const token  = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  const res = await fetch(`${API_URL}/api/agents/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

// ── PATCH /api/agents/[id] ────────────────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const token  = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  const res = await fetch(`${API_URL}/api/agents/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}