import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

// Helper to get Bearer token from auth_token cookie
async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  return token ?? null;
}

// DELETE /api/admin/videos/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getAuthToken();
    
    console.log('[v0] DELETE request for video ID:', id);
    console.log('[v0] Auth token present:', !!token);

    if (!token) {
      console.error('[v0] No auth token found! User not authenticated.');
      return NextResponse.json(
        { error: 'Unauthorized', details: 'No authentication token. Please log in.' },
        { status: 401 }
      );
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const res = await fetch(`${BACKEND}/api/admin/videos/${id}`, {
      method: 'DELETE',
      headers,
    });

    const contentType = res.headers.get('content-type');
    console.log('[v0] Laravel response status:', res.status, 'content-type:', contentType);

    if (contentType?.includes('application/json')) {
      const data = await res.json();
      console.log('[v0] Laravel delete response:', data);
      return NextResponse.json(data, { status: res.status });
    } else {
      const text = await res.text();
      console.error('[v0] Laravel returned HTML error:', text.substring(0, 300));
      
      const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/);
      const errorMessage = titleMatch ? titleMatch[1] : 'Unknown Laravel error';
      
      return NextResponse.json(
        { 
          error: errorMessage, 
          laravelStatus: res.status,
          details: 'Check server console logs'
        },
        { status: res.status }
      );
    }
  } catch (error) {
    console.error('[v0] DELETE error:', error);
    return NextResponse.json(
      { error: 'Delete failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
