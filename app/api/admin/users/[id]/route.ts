import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth_token')?.value;
    const body = await request.json();

    const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('admin/users/[id] PATCH failed', res.status, errorText);
      return NextResponse.json({ error: 'Failed to update user' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('admin/users/[id] PATCH error', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth_token')?.value;

    const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
    });

    // Laravel returns 204 No Content on successful delete
    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    if (!res.ok) {
      const errorText = await res.text();
      console.error('admin/users/[id] DELETE failed', res.status, errorText);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('admin/users/[id] DELETE error', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}