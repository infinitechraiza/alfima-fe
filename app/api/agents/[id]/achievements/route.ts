// app/api/agents/[id]/achievements/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ← async params, matches Next.js 15
) {
  const { id } = await params;  // ← await it

  const res = await fetch(`${BACKEND}/api/agents/${id}/achievements`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}