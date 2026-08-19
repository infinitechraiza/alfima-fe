import { NextRequest, NextResponse } from 'next/server';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

async function proxyToBackend(req: NextRequest, path: string) {
  // ✅ Fixed token logic
  const authHeader = req.headers.get('authorization');
  const cookieToken = req.cookies.get('auth_token')?.value;

  const token = authHeader
    ? authHeader
    : cookieToken
      ? `Bearer ${cookieToken}`
      : null;

  const headers: Record<string, string> = {};

  if (token) headers['Authorization'] = token;

  const contentType = req.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const upstream = await fetch(`${BACKEND}/api${path}`, {
    method: req.method,
    headers,
    body,
  });

  let data;
  try {
    data = await upstream.json();
  } catch {
    data = {};
  }

  return NextResponse.json(data, { status: upstream.status });
}

// ✅ FIXED: params is async
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  return proxyToBackend(req, `/admin/testimonials/${id}/reject`);
}