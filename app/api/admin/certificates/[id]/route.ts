import { NextRequest, NextResponse } from 'next/server';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

async function proxy(req: NextRequest, id: string) {
  // ✅ Cookie takes priority, auth header as fallback — consistent with rest of app
  const cookieToken = req.cookies.get('auth_token')?.value;
  const authHeader  = req.headers.get('authorization');
  const token       = cookieToken ? `Bearer ${cookieToken}` : authHeader;

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = token;

  const upstream = await fetch(`${BACKEND}/api/admin/certificates/${id}`, {
    method: req.method,
    headers,
  });

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return proxy(req, id);
}