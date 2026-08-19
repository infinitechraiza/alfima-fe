// app/api/admin/about/route.ts
// Handles GET (fetch all page data) and POST (upsert page settings with optional image)

import { NextRequest, NextResponse } from "next/server";

const LARAVEL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

async function proxyJson(res: Response): Promise<NextResponse> {
  // Guard: if Laravel returns non-JSON (e.g. HTML error page), surface it cleanly
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: `Upstream error (${res.status})` },
      { status: res.status },
    );
  }
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const res = await fetch(`${LARAVEL}/api/admin/about${req.nextUrl.search}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return proxyJson(res);
  } catch (err) {
    console.error("[admin/about GET]", err);
    return NextResponse.json(
      { error: "Failed to connect to API" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Forward FormData as-is so the image file passes through correctly.
    // Do NOT set Content-Type manually — fetch will set the correct
    // multipart/form-data boundary automatically.
    const body = await req.formData();

    const res = await fetch(`${LARAVEL}/api/admin/about`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
    });

    return proxyJson(res);
  } catch (err) {
    console.error("[admin/about POST]", err);
    return NextResponse.json(
      { error: "Failed to connect to API" },
      { status: 500 },
    );
  }
}

// NOTE: No PUT export needed here.
// The page-settings upsert always goes through POST (Laravel route: POST /api/admin/about).
// PUT /api/admin/about/values/{id} and PUT /api/admin/about/why-choose-us/{id}
// are handled by app/api/admin/about/[resource]/[id]/route.ts.

// ─────────────────────────────────────────────────────────────────────────────
// app/api/admin/about/[resource]/route.ts
// Handles collection-level requests: GET list, POST create
// Resources: values | why-choose-us
// ─────────────────────────────────────────────────────────────────────────────

// import { NextRequest, NextResponse } from "next/server";
//
// const LARAVEL =
//   process.env.API_URL ??
//   process.env.NEXT_PUBLIC_API_URL ??
//   "http://localhost:8000";

// ── Next.js 14 version ───────────────────────────────────────────────────────
// type Ctx = { params: { resource: string } };
//
// export async function GET(req: NextRequest, { params }: Ctx) { ... }
// export async function POST(req: NextRequest, { params }: Ctx) { ... }

// ── Next.js 15 version (params is now a Promise) ─────────────────────────────
// type Ctx = { params: Promise<{ resource: string }> };
//
// export async function GET(req: NextRequest, { params }: Ctx) {
//   const { resource } = await params;
//   ...
// }

// Full implementation below — uncomment the Ctx type that matches your Next.js version.

/* ── Next.js 14 ── */
/*
type ResourceCtx = { params: { resource: string } };

export async function GET(req: NextRequest, { params }: ResourceCtx) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const res = await fetch(`${LARAVEL}/api/admin/about/${params.resource}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("application/json"))
      return NextResponse.json({ error: `Upstream error (${res.status})` }, { status: res.status });

    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err) {
    console.error(`[admin/about/${params.resource} GET]`, err);
    return NextResponse.json({ error: "Failed to connect to API" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: ResourceCtx) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const res = await fetch(`${LARAVEL}/api/admin/about/${params.resource}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("application/json"))
      return NextResponse.json({ error: `Upstream error (${res.status})` }, { status: res.status });

    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err) {
    console.error(`[admin/about/${params.resource} POST]`, err);
    return NextResponse.json({ error: "Failed to connect to API" }, { status: 500 });
  }
}
*/

// ─────────────────────────────────────────────────────────────────────────────
// app/api/admin/about/[resource]/[id]/route.ts
// Handles item-level requests: PUT update, DELETE destroy
// ─────────────────────────────────────────────────────────────────────────────

// ── Next.js 14 ───────────────────────────────────────────────────────────────
/*
type ItemCtx = { params: { resource: string; id: string } };

export async function PUT(req: NextRequest, { params }: ItemCtx) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const res = await fetch(
      `${LARAVEL}/api/admin/about/${params.resource}/${params.id}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      },
    );

    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("application/json"))
      return NextResponse.json({ error: `Upstream error (${res.status})` }, { status: res.status });

    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err) {
    console.error(`[admin/about/${params.resource}/${params.id} PUT]`, err);
    return NextResponse.json({ error: "Failed to connect to API" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: ItemCtx) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const res = await fetch(
      `${LARAVEL}/api/admin/about/${params.resource}/${params.id}`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("application/json"))
      return NextResponse.json({ error: `Upstream error (${res.status})` }, { status: res.status });

    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err) {
    console.error(`[admin/about/${params.resource}/${params.id} DELETE]`, err);
    return NextResponse.json({ error: "Failed to connect to API" }, { status: 500 });
  }
}
*/
