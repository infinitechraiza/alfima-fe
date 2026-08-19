import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const incoming = request.nextUrl.searchParams;
    const params = new URLSearchParams();

    if (incoming.get('search'))        params.set('search',        incoming.get('search')!);
    if (incoming.get('listing_type'))  params.set('listing_type',  incoming.get('listing_type')!);
    if (incoming.get('property_type')) params.set('property_type', incoming.get('property_type')!);
    if (incoming.get('page'))          params.set('page',          incoming.get('page')!);
    if (incoming.get('per_page'))      params.set('per_page',      incoming.get('per_page')!);

    const res = await fetch(
      `${API_URL}/api/admin/properties${params.toString() ? `?${params}` : ''}`,
      {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      }
    );

    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch' }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}