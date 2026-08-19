/**
 * Devices API route - proxy to Laravel backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export async function GET(request: Request) {
  try {
    const headers = new Headers(request.headers);
    headers.delete('host');

    const response = await fetch(`${API_URL}/api/devices`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('[Devices API Error]', error);
    return Response.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { deviceId } = await request.json().catch(() => ({}));
    const headers = new Headers(request.headers);
    headers.delete('host');

    const response = await fetch(`${API_URL}/api/devices/${deviceId}`, {
      method: 'DELETE',
      headers,
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('[Devices API Error]', error);
    return Response.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const headers = new Headers(request.headers);
    headers.delete('host');

    // Handle logout all other devices
    if (body.action === 'logout_others') {
      const response = await fetch(`${API_URL}/api/devices/logout-others`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return Response.json(data, { status: response.status });
    }

    return Response.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Devices API Error]', error);
    return Response.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
