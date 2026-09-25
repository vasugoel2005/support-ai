import { NextRequest, NextResponse } from "next/server";
import { scalekit } from "@/lib/scalekit";
import { ACCESS_COOKIE } from "@/lib/getSession";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expected = req.cookies.get("oauth_state")?.value;

  if (!code) return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  if (!state || !expected || state !== expected) {
    return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 });
  }

  try {
    const session = await scalekit.authenticateWithCode(
      code,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
    );
    const res = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`);
    res.cookies.set(ACCESS_COOKIE, session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      // maxAge is in SECONDS. Never outlive the token itself.
      maxAge: Math.min(session.expiresIn || 3600, 24 * 60 * 60),
      path: "/",
    });
    res.cookies.delete("oauth_state");
    return res;
  } catch (err) {
    console.error("auth callback failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }
}
