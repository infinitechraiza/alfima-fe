import { NextRequest, NextResponse } from 'next/server';

const LARAVEL_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  console.log('=== [dev-inquiries] LARAVEL_API:', LARAVEL_API);

  try {
    const token = request.cookies.get('auth_token')?.value;
    console.log('=== [dev-inquiries] token:', token ? 'FOUND' : 'MISSING');

    const searchParams = request.nextUrl.searchParams;
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => params.append(key, value));

    const targetUrl = `${LARAVEL_API}/api/developer-inquiries?${params}`;
    console.log('=== [dev-inquiries] fetching:', targetUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    clearTimeout(timeout);
    console.log('=== [dev-inquiries] Laravel status:', response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error('=== [dev-inquiries] Laravel error:', errText);
      return NextResponse.json(
        { error: 'Failed to fetch inquiries', detail: errText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('=== [dev-inquiries] EXCEPTION:', error?.name, error?.message);

    if (error?.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Laravel did not respond within 8 seconds. Is it running?' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: error?.message ?? 'Failed to fetch inquiries' },
      { status: 500 }
    );
  }
}