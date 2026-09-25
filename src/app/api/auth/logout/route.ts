import { NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/getSession";

// POST (not GET) so a third-party page can't log users out via an <img> tag.
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ACCESS_COOKIE);
  return res;
}
