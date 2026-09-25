import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { scalekit } from "@/lib/scalekit";

const STATE_COOKIE = "oauth_state";

export async function GET() {
  const state = randomBytes(16).toString("hex"); // CSRF protection for the OAuth round-trip
  const url = scalekit.getAuthorizationUrl(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`, { state });
  const res = NextResponse.redirect(url);
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
