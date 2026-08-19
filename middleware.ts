import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES: { pattern: RegExp; roles: string[] }[] = [
  { pattern: /^\/admin(\/.*)?$/, roles: ['admin'] },
  { pattern: /^\/agent(\/.*)?$/, roles: ['agent', 'admin'] },
];

const ROLE_HOME: Record<string, string> = {
  admin: '/admin',
  agent: '/agent/dashboard',
  buyer: '/',
};

const GUEST_ONLY = ['/login', '/register'];

async function getUser(request: NextRequest, token: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: {
        cookie: `auth_token=${token}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!res.ok) return null;

    const data = await res.json();
    return data.user ?? null;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // ── Guest-only routes ──────────────────────────────────────────────────────
  if (GUEST_ONLY.some(p => pathname.startsWith(p))) {
    if (token) {
      // ✅ Check role and redirect to correct dashboard
      const user = await getUser(request, token);
      if (user) {
        const destination = ROLE_HOME[user.role] ?? '/';
        return NextResponse.redirect(new URL(destination, request.url));
      }
      // Token invalid — let them see the login page
    }
    return NextResponse.next();
  }

  // ── Protected routes ───────────────────────────────────────────────────────
  const matched = PROTECTED_ROUTES.find(r => r.pattern.test(pathname));
  if (!matched) return NextResponse.next();

  // No token → redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: {
        cookie: `auth_token=${token}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      // ✅ 503 = Laravel unreachable, don't clear cookie
      if (res.status === 503) {
        return NextResponse.next();
      }
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
      return response;
    }

    const data = await res.json();
    const user = data.user;

    // Role mismatch → redirect to correct home
    if (!matched.roles.includes(user.role)) {
      return NextResponse.redirect(
        new URL(ROLE_HOME[user.role] ?? '/', request.url)
      );
    }

    return NextResponse.next();
  } catch (err: unknown) {
    // Timeout → optimistically allow through, don't nuke the cookie
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.next();
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
    return response;
  }
}

export const config = {
  matcher: ['/login', '/register', '/agent/:path*', '/admin/:path*'],
};