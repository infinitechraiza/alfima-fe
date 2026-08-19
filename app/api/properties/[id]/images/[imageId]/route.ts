// app/api/properties/[id]/images/[imageId]/route.ts

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Params = { params: Promise<{ id: string; imageId: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id, imageId } = await params;
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const res = await fetch(`${API_URL}/api/properties/${id}/images/${imageId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return NextResponse.json({ message: 'Image deleted' }, { status: 200 });
  }

  const data = await res.json().catch(() => ({ message: 'Deleted' }));
  return NextResponse.json(data, { status: res.status });
}