import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const params = request.nextUrl.searchParams.toString();

    const res = await fetch(`${API_URL}/api/admin/users${params ? `?${params}` : ''}`, {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('admin/users proxy failed', res.status, res.statusText, errorText);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('admin/users proxy error', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
