import { NextRequest, NextResponse } from "next/server";

const LARAVEL_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function proxyToLaravel(request: NextRequest, method: string) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => params.append(key, value));

    const token = request.cookies.get("auth_token")?.value;
    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let body: BodyInit | undefined;

    if (method !== "GET") {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("multipart/form-data")) {
        body = await request.formData();
      } else {
        body = await request.text();
        headers["Content-Type"] = "application/json";
      }
    }

    const url = `${LARAVEL_API}/api/developer-properties${params.toString() ? `?${params}` : ""}`;

    console.log(`[proxy] ${method} → ${url}`);

    const response = await fetch(url, { method, headers, body });

    console.log(`[proxy] response status: ${response.status}`);

    const responseContentType = response.headers.get("content-type") || "";
    if (responseContentType.includes("application/json")) {
      const data = await response.json();
      console.log(`[proxy] response body:`, JSON.stringify(data));
      return NextResponse.json(data, { status: response.status });
    }

    const text = await response.text();
    console.log(`[proxy] response text:`, text); // <-- this shows Laravel's raw error
    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": responseContentType },
    });
  } catch (error) {
    console.error(`[proxy] CAUGHT ERROR:`, error); // <-- this shows if fetch itself failed
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return proxyToLaravel(request, "GET");
}

export async function POST(request: NextRequest) {
  return proxyToLaravel(request, "POST");
}
