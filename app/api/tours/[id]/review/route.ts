// app/api/tours/[id]/review/route.ts

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }   // ← params is a Promise in Next.js 15
) {
  try {
    const { id } = await params;                      // ← must await before accessing
    const body   = await request.json();
    const token  = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthenticated. Please log in.' },
        { status: 401 }
      );
    }

    const res = await fetch(`${API_URL}/api/tours/${id}/review`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept:          'application/json',
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json(
      { message: 'Failed to submit review.' },
      { status: 500 }
    );
  }
}