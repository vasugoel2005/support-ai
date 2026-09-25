import { cookies } from "next/headers";
import { scalekit } from "./scalekit";

export const ACCESS_COOKIE = "access_token";

/** Cheap check used by the proxy: is this a validly signed, unexpired token? */
export async function isTokenValid(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    await scalekit.validateToken(token);
    return true;
  } catch {
    return false;
  }
}

/** Resolves the logged-in user (or null). Always derive identity from here, never from request bodies. */
export async function getSession() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  try {
    const { sub } = await scalekit.validateToken<{ sub: string }>(token);
    return await scalekit.user.getUser(sub);
  } catch {
    return null;
  }
}
