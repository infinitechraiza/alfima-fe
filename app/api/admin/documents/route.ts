import { NextRequest, NextResponse } from 'next/server';

const LARAVEL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:8000';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const res = await fetch(
      `${LARAVEL}/api/admin/documents${req.nextUrl.search}`,
      { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } }
    );

    return safeJson(res);
  } catch (err) {
    console.error('[admin/documents GET]', err);
    return NextResponse.json({ error: 'Failed to connect to API' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const contentType = req.headers.get('content-type') ?? '';
    const rawBody = await req.arrayBuffer();

    const res = await fetch(`${LARAVEL}/api/admin/documents`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',       // ← forces Laravel to return JSON errors
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
      },
      body: rawBody,
    });

    return safeJson(res);
  } catch (err) {
    console.error('[admin/documents POST]', err);
    return NextResponse.json({ error: 'Failed to connect to API' }, { status: 500 });
  }
}

// ── Safely parse Laravel response (JSON or HTML error page) ───────────────────
async function safeJson(res: Response): Promise<NextResponse> {
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return NextResponse.json(json, { status: res.status });
  } catch {
    // Laravel returned HTML — log it so you can see the real error
    console.error('[laravel html error]', text.slice(0, 500));
    return NextResponse.json(
      { success: false, message: `Server error (${res.status}). Check Laravel logs.` },
      { status: res.status }
    );
  }
}