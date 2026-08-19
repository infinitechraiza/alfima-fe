import { NextRequest, NextResponse } from "next/server";

const LARAVEL_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function proxyToLaravel(
  request: NextRequest,
  method: string,
  id: string,
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const token = request.cookies.get("auth_token")?.value;
    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let body: BodyInit | undefined;

    if (method !== "GET") {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("multipart/form-data")) {
        body = await request.formData();
        // Do NOT set Content-Type — fetch sets it with correct boundary
      } else {
        body = await request.text();
        headers["Content-Type"] = "application/json";
      }
    }

    const url = `${LARAVEL_API}/api/developer-properties/${id}${queryString ? `?${queryString}` : ""}`;
    console.log(`[proxy] ${method} → ${url}`);

    const response = await fetch(url, { method, headers, body });

    console.log(`[proxy] response status: ${response.status}`);

    const responseContentType = response.headers.get("content-type") || "";
    if (responseContentType.includes("application/json")) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    const text = await response.text();
    console.log(`[proxy] raw response:`, text.substring(0, 500));
    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": responseContentType },
    });
  } catch (error) {
    console.error(`[proxy] CAUGHT ERROR:`, error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToLaravel(request, "GET", id);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToLaravel(request, "POST", id);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToLaravel(request, "PUT", id);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToLaravel(request, "DELETE", id);
}
