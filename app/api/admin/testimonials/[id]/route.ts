import { NextRequest, NextResponse } from 'next/server';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

async function proxyToBackend(req: NextRequest, path: string) {
  // ✅ Fixed operator precedence
  const authHeader  = req.headers.get('authorization');
  const cookieToken = req.cookies.get('auth_token')?.value;
  const token       = authHeader ?? (cookieToken ? `Bearer ${cookieToken}` : null);

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = token;

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const body    = hasBody ? await req.arrayBuffer() : undefined;

  const fetchOptions: RequestInit = {
    method: req.method,
    headers: {
      ...headers,
      'Content-Type': req.headers.get('content-type') ?? '',
    },
  };

  if (body) fetchOptions.body = body;

  const upstream = await fetch(`${BACKEND}/api${path}`, fetchOptions);
  const data     = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return proxyToBackend(req, `/admin/testimonials/${id}`);
}