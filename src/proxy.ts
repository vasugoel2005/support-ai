import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, isTokenValid } from "./lib/getSession";

export async function proxy(req: NextRequest) {
  if (!(await isTokenValid(req.cookies.get(ACCESS_COOKIE)?.value))) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/embed/:path*", "/insights/:path*"],
};
