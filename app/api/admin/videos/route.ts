import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

// Helper to get Bearer token from auth_token cookie
async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  return token ?? null;
}

// GET /api/admin/videos?user_id=X
export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.toString();
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(
    `${BACKEND}/api/admin/videos${search ? `?${search}` : ""}`,
    {
      headers,
      cache: "no-store",
    },
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

// POST /api/admin/videos
// NOTE: This is a proxy to the Laravel backend.
// Extracts Bearer token from auth_token cookie and passes it along for Sanctum auth.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = await getAuthToken();

    console.log("[v0] Video upload started");
    console.log("[v0] Auth token present:", !!token);
    console.log("[v0] FormData fields:", Array.from(formData.keys()));
    console.log("[v0] User ID:", formData.get("user_id"));

    const videoFile = formData.get("video") as File | null;
    if (videoFile) {
      const fileSizeMB = (videoFile.size / 1024 / 1024).toFixed(2);
      console.log("[v0] Video file name:", videoFile.name);
      console.log("[v0] Video file size:", fileSizeMB, "MB (limit: 200 MB)");
      console.log("[v0] Video file type:", videoFile.type);

      if (videoFile.size > 204800 * 1024) {
        return NextResponse.json(
          {
            error: "File too large",
            details: `File is ${fileSizeMB} MB but max allowed is 200 MB`,
          },
          { status: 413 },
        );
      }
    } else {
      return NextResponse.json(
        { error: "Missing video file", details: "No video field in formData" },
        { status: 400 },
      );
    }

    if (!token) {
      console.error("[v0] No auth token found! User not authenticated.");
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: "No authentication token. Please log in.",
        },
        { status: 401 },
      );
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    console.log("[v0] Sending to Laravel:", `${BACKEND}/api/admin/videos`);
    const res = await fetch(`${BACKEND}/api/admin/videos`, {
      method: "POST",
      headers,
      body: formData,
    });

    const contentType = res.headers.get("content-type");
    console.log(
      "[v0] Laravel response status:",
      res.status,
      "content-type:",
      contentType,
    );

    if (contentType?.includes("application/json")) {
      const data = await res.json();
      console.log("[v0] Laravel response:", data);
      return NextResponse.json(data, { status: res.status });
    } else {
      const text = await res.text();
      console.error(
        "[v0] Laravel returned HTML error:",
        text.substring(0, 500),
      );

      const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/);
      const errorMessage = titleMatch ? titleMatch[1] : "Unknown Laravel error";

      return NextResponse.json(
        {
          error: errorMessage,
          laravelStatus: res.status,
          details: "Check server console logs",
        },
        { status: res.status },
      );
    }
  } catch (error) {
    console.error("[v0] Video upload exception:", error);
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
