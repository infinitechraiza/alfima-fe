// app/api/admin/services/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function getToken(): Promise<string | undefined> {
  return (await cookies()).get('auth_token')?.value;
}

function authHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = { Accept: 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

// GET /api/admin/services/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = await getToken();
  try {
    const res = await fetch(`${API_URL}/api/services/${id}`, {
      headers: authHeaders(token),
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch service.' }, { status: 500 });
  }
}

// POST /api/admin/services/[id]  (with _method=PUT for update)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = await getToken();
  try {
    const formData = await request.formData();
    const res = await fetch(`${API_URL}/api/admin/services/${id}`, {
      method: 'POST',
      headers: authHeaders(token),
      body: formData,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to update service.' }, { status: 500 });
  }
}

// DELETE /api/admin/services/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = await getToken();
  try {
    const res = await fetch(`${API_URL}/api/admin/services/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to delete service.' }, { status: 500 });
  }
}

// PATCH /api/admin/services/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = await getToken();
  try {
    const body = await request.json();
    const res = await fetch(`${API_URL}/api/admin/services/${id}`, {
      method: 'PATCH',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to update service.' }, { status: 500 });
  }
}