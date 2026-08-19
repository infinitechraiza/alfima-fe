import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = request.cookies.get('auth_token')?.value;

  console.log('[approve] id:', id);
  console.log('[approve] token:', token ? token.slice(0, 20) + '...' : 'MISSING');

  if (!token) {
    return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });
  }

  try {
    const res = await fetch(`${BACKEND}/api/reviews/${id}/approve`, {
      method: 'PATCH',
      headers: {
        'Accept':        'application/json',
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const text = await res.text();
    console.log('[approve] Laravel status:', res.status);
    console.log('[approve] Laravel response:', text);

    let data;
    try { data = JSON.parse(text); } 
    catch { data = { message: text }; }

    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[approve] Exception:', e);
    return NextResponse.json({ message: 'Failed to approve review.' }, { status: 502 });
  }
}