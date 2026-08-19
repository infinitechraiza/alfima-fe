// app/api/footer-contacts/route.ts
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  const res = await fetch(`${API_URL}/api/footer-contacts`, {
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    next: { revalidate: 60 }, // cache 60s
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = [];
  }

  return NextResponse.json(data, { status: res.status });
}
