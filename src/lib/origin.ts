/**
 * Checks a browser `Origin` header against a tenant's domain allowlist.
 * An empty allowlist means "allow any site". Wildcards (`*.example.com`)
 * match subdomains but not the apex domain.
 *
 * NOTE: this is a guard against casual reuse of a bot ID on other sites,
 * not authentication — the Origin header can be forged by non-browser clients.
 * Rate limiting is what bounds abuse.
 */
export function isOriginAllowed(origin: string | null, allowed: string[]): boolean {
  if (allowed.length === 0) return true;
  if (!origin) return false;
  let host: string;
  try {
    host = new URL(origin).hostname.toLowerCase();
  } catch {
    return false;
  }
  return allowed.some((rule) => {
    if (rule.startsWith("*.")) return host.endsWith(rule.slice(1)) && host.length > rule.length - 1;
    return host === rule;
  });
}
