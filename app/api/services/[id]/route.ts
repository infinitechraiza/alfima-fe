// app/api/services/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: NextRequest,
  context: Context
) {
  const { id } = await context.params; // ✅ important

  try {
    const res = await fetch(`${API_URL}/api/services/${id}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to fetch service.' },
      { status: 500 }
    );
  }
}