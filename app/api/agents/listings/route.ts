import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const incoming = request.nextUrl.searchParams;
    const params   = new URLSearchParams();

    if (incoming.get('search'))        params.set('search',        incoming.get('search')!);
    if (incoming.get('status'))        params.set('status',        incoming.get('status')!);
    if (incoming.get('property_type')) params.set('property_type', incoming.get('property_type')!);
    if (incoming.get('page'))          params.set('page',          incoming.get('page')!);
    if (incoming.get('per_page'))      params.set('per_page',      incoming.get('per_page')!);

    const url = `${API_URL}/api/agent/listings${params.toString() ? `?${params}` : ''}`;

    const res = await fetch(url, {
      headers: {
        Accept:        'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch listings' }, { status: res.status });

    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}