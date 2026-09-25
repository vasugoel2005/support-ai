import { NextResponse } from "next/server";
import { scalekit } from "@/lib/scalekit";
import { ACCESS_COOKIE } from "@/lib/getSession";

// POST (not GET) so a third-party page can't log users out via an <img> tag.
export async function POST() {
    const logoutUrl = scalekit.getLogoutUrl({
        postLogoutRedirectUri: process.env.NEXT_PUBLIC_APP_URL,
    });
    const res = NextResponse.json({ logoutUrl });
    res.cookies.delete(ACCESS_COOKIE);
    return res;
}