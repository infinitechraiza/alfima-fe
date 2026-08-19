import { NextRequest, NextResponse } from 'next/server';

const LARAVEL_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Make request to Laravel backend
    const response = await fetch(`${LARAVEL_API}/api/developer-properties/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[v0] Laravel API error: ${response.status}`);
      return NextResponse.json(
        { error: 'Property not found' },
        { status: response.status }
      );
    }

    const data = await response.json();
    // Extract the property from the response (could be data.data or just data)
    const property = data.data || data;
    
    // Ensure images and videos are arrays
    if (property.images && typeof property.images === 'string') {
      property.images = property.images.split(',').filter((img: string) => img.trim());
    } else if (!Array.isArray(property.images)) {
      property.images = [];
    }

    if (property.videos && typeof property.videos === 'string') {
      property.videos = property.videos.split(',').filter((vid: string) => vid.trim());
    } else if (!Array.isArray(property.videos)) {
      property.videos = [];
    }

    if (property.amenities && typeof property.amenities === 'string') {
      property.amenities = property.amenities.split(',').map((a: string) => a.trim()).filter(Boolean);
    } else if (!Array.isArray(property.amenities)) {
      property.amenities = [];
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error('[v0] Error proxying to Laravel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let requestBody: any;
    let headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    };

    // Handle both FormData (multipart) and JSON requests
    if (contentType.includes('multipart/form-data')) {
      // FormData from browser - pass it directly to Laravel
      requestBody = await request.formData();
      // Don't set Content-Type - browser/fetch will set it with boundary
    } else {
      // JSON request
      const body = await request.json();
      requestBody = body;
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${LARAVEL_API}/api/developer-properties/${id}`, {
  method: 'POST',  // ← always POST, Laravel route expects POST
  headers,
  body: contentType.includes('multipart/form-data') ? requestBody : JSON.stringify(requestBody),
});

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[v0] Laravel API error:', errorData);
      return NextResponse.json(
        errorData || { error: 'Failed to update property' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[v0] Error updating property:', error);
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(`${LARAVEL_API}/api/developer-properties/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        errorData || { error: 'Failed to delete property' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[v0] Error deleting property:', error);
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}
