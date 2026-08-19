import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }
  try {
    const upstream = await fetch(url, { headers: { Accept: 'image/*' } });
    if (!upstream.ok) {
      return NextResponse.json({ error: 'Upstream failed' }, { status: upstream.status });
    }
    const buffer = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    console.error('[image-proxy]', e);
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
  }
}