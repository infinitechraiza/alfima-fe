// app/api/chat/agent-status/route.ts

import { NextRequest, NextResponse } from 'next/server';

const LARAVEL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function GET(req: NextRequest) {
  try {
    const token   = req.headers.get('x-chat-token');
    const authHdr = req.headers.get('authorization');

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token)   headers['X-Chat-Token']  = token;
    if (authHdr) headers['Authorization'] = authHdr;

    const res  = await fetch(`${LARAVEL}/api/chat/agent-status`, { headers });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[chat/agent-status]', err);
    return NextResponse.json({ available: false, message: 'Unable to check agent status' }, { status: 500 });
  }
}