import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get token from Authorization header OR cookies
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;
    
    if (!token) {
      console.error("[v0] No auth token found in request");
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log("[v0] Auth token found, length:", token.length);

    const formData = await request.formData();
    console.log("[v0] Video upload received for property:", id);
    console.log("[v0] FormData keys:", Array.from(formData.keys()));

    const res = await fetch(
      `${API_URL}/api/properties/${id}/videos`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    console.log("[v0] Laravel response status:", res.status);
    const contentType = res.headers.get('content-type');
    console.log("[v0] Content-Type:", contentType);

    // Try to parse JSON, but handle HTML error responses
    let data;
    try {
      const text = await res.text();
      console.log("[v0] Raw response length:", text.length);
      
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        console.error("[v0] Laravel returned HTML error page, not JSON");
        return NextResponse.json(
          { error: `Laravel error (${res.status}): Check server logs for details` },
          { status: res.status }
        );
      }
      
      data = JSON.parse(text);
      console.log("[v0] Laravel response:", data);
    } catch (parseError: any) {
      console.error("[v0] Failed to parse Laravel response:", parseError.message);
      return NextResponse.json(
        { error: `Invalid response from server: ${parseError.message}` },
        { status: 500 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        data,
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("[v0] Video upload error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload video' },
      { status: 500 }
    );
  }
}
