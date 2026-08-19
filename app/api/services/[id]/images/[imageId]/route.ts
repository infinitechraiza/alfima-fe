import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Context = {
  params: Promise<{ id: string; imageId: string }>;
};

export async function DELETE(request: NextRequest, context: Context) {
  const { id, imageId } = await context.params;

  try {
    const token = request.headers.get("authorization");

    const res = await fetch(
      `${API_URL}/api/admin/services/${id}/images/${imageId}`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: token } : {}),
        },
      },
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to delete image." },
      { status: 500 },
    );
  }
}
