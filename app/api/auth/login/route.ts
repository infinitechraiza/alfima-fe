import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const VALID_DEVICE_TYPES = ['web', 'mobile', 'tablet', 'desktop'] as const;
type DeviceType = typeof VALID_DEVICE_TYPES[number];

function sanitizeDeviceType(raw: string | undefined | null): DeviceType {
  const normalized = (raw ?? '').toLowerCase().trim();
  if ((VALID_DEVICE_TYPES as readonly string[]).includes(normalized)) {
    return normalized as DeviceType;
  }
  if (normalized.includes('mobile') || normalized.includes('phone')) return 'mobile';
  if (normalized.includes('tablet') || normalized.includes('ipad'))   return 'tablet';
  if (normalized.includes('desktop') || normalized.includes('windows') ||
      normalized.includes('mac') || normalized.includes('linux'))     return 'desktop';
  return 'web';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const sanitizedBody = {
      ...body,
      device_type:        sanitizeDeviceType(body.device_type),
      device_fingerprint: body.device_fingerprint || '',
      device_name:        body.device_name        || 'Unknown Device',
    };

    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept:         'application/json',
      },
      body: JSON.stringify(sanitizedBody),
    });

    const data = await res.json();

    console.log('[login] Laravel response status:', res.status);
    console.log('[login] device_type sent:', sanitizedBody.device_type);
    console.log('[login] user object:', data.user);

    if (!res.ok) {
      console.error('[login] Response not OK:', data);
      return NextResponse.json(
        {
          error:
            data.message ??
            data.errors?.email?.[0] ??
            data.errors?.device_type?.[0] ??
            'Invalid credentials.',
        },
        { status: res.status }
      );
    }

    if (!data.token) {
      return NextResponse.json({ error: 'Authentication failed.' }, { status: 500 });
    }
    if (!data.user) {
      return NextResponse.json({ error: 'Authentication failed: no user data.' }, { status: 500 });
    }

    const response = NextResponse.json({
      user:      data.user,
      device_id: data.device_id,
    });

    // ── Set auth cookie ────────────────────────────────────────────────────
    response.cookies.set('auth_token', data.token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      maxAge:   60 * 60 * 24 * 7,
    });

    // ── Also set a readable role cookie for middleware ──────────────────────
    // Not httpOnly so middleware can read it without hitting Laravel
    response.cookies.set('user_role', data.user.role ?? '', {
      httpOnly: false,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      maxAge:   60 * 60 * 24 * 7,
    });

    console.log('[login] Cookie set for:', data.user?.email, '| role:', data.user?.role);
    return response;

  } catch (e) {
    console.error('[login] Exception:', e);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}