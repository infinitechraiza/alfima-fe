// app/api/admin/services/route.ts

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

// GET  /api/admin/services  — list all (including inactive) for admin
export async function GET(request: NextRequest) {
  const token = getToken();
  try {
    const res = await fetch(`${API_URL}/api/admin/services?all=1`, {
      headers: authHeaders(await token),
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch services.' }, { status: 500 });
  }
}

// POST /api/admin/services  — create
export async function POST(request: NextRequest) {
  const token = getToken();
  try {
    const formData = await request.formData();

    const res = await fetch(`${API_URL}/api/admin/services`, {
      method: 'POST',
      headers: authHeaders(await token),
      body: formData,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create service.' }, { status: 500 });
  }
}