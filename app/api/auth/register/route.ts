import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, confirmPassword, role, phone } =
      await request.json();

    if (!name || !email || !password || !confirmPassword || !role) {
      return NextResponse.json(
        { error: "Please fill in all required fields" },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const validRoles = ["buyer", "agent"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid account type selected" },
        { status: 400 },
      );
    }

    const laravelRes = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
        password_confirmation: confirmPassword,
        role,
        phone,
      }),
    });

    const data = await laravelRes.json();

    if (!laravelRes.ok) {
      const firstError = data.errors
        ? Object.values(data.errors as Record<string, string[]>)[0]?.[0]
        : data.message;
      return NextResponse.json(
        { error: firstError ?? "Registration failed" },
        { status: laravelRes.status },
      );
    }

    const response = NextResponse.json({ user: data.user }, { status: 201 });

    // ── Skip setting cookie when an admin is creating an agent ──────────────
    // The X-Admin-Create header tells us not to overwrite the admin's session.
    const isAdminCreate = request.headers.get("X-Admin-Create") === "1";
    if (!isAdminCreate) {
      response.cookies.set("auth_token", data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 },
    );
  }
}
