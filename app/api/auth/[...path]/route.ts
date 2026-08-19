/**
 * Proxy API routes for authentication endpoints
 * This forwards requests to your Laravel backend
 * Includes device tracking for multi-device limit
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const pathname = `/${path.join("/")}`;

  try {
    const body = await request.json().catch(() => ({}));
    const headers = new Headers(request.headers);

    // Remove host header to avoid conflicts
    headers.delete("host");

    // For login endpoint, add device info
    if (pathname === "/login" || pathname === "/auth/login") {
      body.device_fingerprint =
        request.headers.get("x-device-fingerprint") || "";
      body.device_name = request.headers.get("x-device-name") || "";
      body.device_type = request.headers.get("x-device-type") || "";
    }

    const response = await fetch(`${API_URL}${pathname}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error("[API Proxy Error]", error);
    return Response.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const pathname = `/${path.join("/")}`;
  const url = new URL(request.url);
  const query = url.search;

  try {
    const headers = new Headers(request.headers);
    headers.delete("host");

    const response = await fetch(`${API_URL}${pathname}${query}`, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error("[API Proxy Error]", error);
    return Response.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const pathname = `/${path.join("/")}`;

  try {
    const body = await request.json().catch(() => ({}));
    const headers = new Headers(request.headers);
    headers.delete("host");

    const response = await fetch(`${API_URL}${pathname}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error("[API Proxy Error]", error);
    return Response.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const pathname = `/${path.join("/")}`;

  try {
    const headers = new Headers(request.headers);
    headers.delete("host");

    const response = await fetch(`${API_URL}${pathname}`, {
      method: "DELETE",
      headers,
    });

    const data = await response.json();

    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error("[API Proxy Error]", error);
    return Response.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
