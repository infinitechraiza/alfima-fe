import { NextRequest, NextResponse } from 'next/server';

const LARAVEL_API = process.env.LARAVEL_API_URL || 'http://localhost:8000';

/**
 * GET /api/admin/auth-token
 * Checks if the user is authenticated with Laravel
 * Returns user data if authenticated, 401 if not
 */
export async function GET(request: NextRequest) {
  try {
    // Get cookies from the client request
    const cookies = request.headers.get('cookie') || '';

    // Make request to Laravel to check auth status
    const response = await fetch(`${LARAVEL_API}/api/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies, // Pass cookies to Laravel
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Unauthenticated' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to verify auth' },
        { status: response.status }
      );
    }

    const user = await response.json();
    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    console.error('[v0] Auth check failed:', error);
    return NextResponse.json(
      { error: 'Auth check failed' },
      { status: 500 }
    );
  }
}
