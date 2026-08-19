import { NextRequest, NextResponse } from 'next/server';

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  try {
    const response = await fetch(`${LARAVEL_API_URL}/api/testimonials`, {  // ← no /api prefix
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[testimonials] Laravel error:', response.status, text);
      return NextResponse.json({ success: false, message: 'Upstream error', data: [] }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch testimonials:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch testimonials', data: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${LARAVEL_API_URL}/api/testimonials`, {  // ← no /api prefix
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Failed to submit testimonial:', error);
    return NextResponse.json({ success: false, message: 'Failed to submit testimonial' }, { status: 500 });
  }
}