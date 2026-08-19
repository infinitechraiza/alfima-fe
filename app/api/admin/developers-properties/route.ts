import { NextRequest, NextResponse } from 'next/server';

const LARAVEL_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters from the request
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const per_page = searchParams.get('per_page') || '12';
    const search = searchParams.get('search');
    const listing_type = searchParams.get('listing_type');
    const property_type = searchParams.get('property_type');
    const status = searchParams.get('status');

    // Build query string for Laravel
    const params = new URLSearchParams({
      page,
      per_page,
    });
    if (search) params.append('search', search);
    if (listing_type) params.append('listing_type', listing_type);
    if (property_type) params.append('property_type', property_type);
    if (status) params.append('status', status);

    const response = await fetch(
      `${LARAVEL_API}/api/developer-properties?${params}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[v0] Laravel API error:', errorData);
      return NextResponse.json(
        errorData || { error: 'Failed to fetch properties' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[v0] Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}