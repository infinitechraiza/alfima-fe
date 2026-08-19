import { NextRequest, NextResponse } from 'next/server';

const LARAVEL_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ params is now a Promise
) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const { id } = await params;  // ✅ must await params

    console.log('=== [dev-inquiries DELETE] id:', id, '| token:', token ? 'FOUND' : 'MISSING');

    if (!id) {
      return NextResponse.json({ error: 'Inquiry ID is required' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${LARAVEL_API}/api/developer-inquiries/${id}`, {
      method: 'DELETE',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    clearTimeout(timeout);
    console.log('=== [dev-inquiries DELETE] Laravel status:', response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error('=== [dev-inquiries DELETE] error:', errText);
      return NextResponse.json(
        { error: 'Failed to delete inquiry', detail: errText },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, message: 'Inquiry deleted successfully' });

  } catch (error: any) {
    console.error('=== [dev-inquiries DELETE] EXCEPTION:', error?.name, error?.message);

    if (error?.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Laravel did not respond within 8 seconds.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: error?.message ?? 'Failed to delete inquiry' },
      { status: 500 }
    );
  }
}