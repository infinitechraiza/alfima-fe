// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    // Invalidate token on Laravel side (non-blocking)
    if (token) {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }).catch(() => {});
    }
  } catch {
    // Still proceed to clear cookie even if upstream fails
  }

  const response = NextResponse.json({ success: true });

  // Must mirror the EXACT same options used when the cookie was SET
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,   // expires immediately
    path: '/',   // must match original path
  });

  return response;
}