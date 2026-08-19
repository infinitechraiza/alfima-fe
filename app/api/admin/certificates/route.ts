import { NextRequest, NextResponse } from 'next/server';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

async function proxyToBackend(req: NextRequest, path: string) {
  // ✅ Fixed operator precedence
  const token = req.headers.get('authorization') 
    ?? (req.cookies.get('auth_token')?.value 
        ? `Bearer ${req.cookies.get('auth_token')?.value}` 
        : null);

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = token;

  const body = await req.arrayBuffer();

  const upstream = await fetch(`${BACKEND}/api${path}`, {
    method: req.method,
    headers: {
      ...headers,
      'Content-Type': req.headers.get('content-type') ?? '',
    },
    body,
  });

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}

export async function POST(req: NextRequest) {
  return proxyToBackend(req, '/admin/certificates');
}

export async function GET(req: NextRequest) {
  return proxyToBackend(req, '/admin/certificates');
}