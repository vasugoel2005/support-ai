import { describe, expect, it } from "vitest";
import { checkRateLimit, clientIp, RateLimitStore } from "@/lib/rateLimit";

function memoryStore(): RateLimitStore {
  const counts = new Map<string, number>();
  return {
    async hit(key, windowMs, now) {
      const k = `${key}:${Math.floor(now / windowMs)}`;
      counts.set(k, (counts.get(k) ?? 0) + 1);
      return counts.get(k)!;
    },
  };
}

describe("checkRateLimit", () => {
  it("allows up to the limit then blocks", async () => {
    const store = memoryStore();
    const now = 1_000_000;
    for (let i = 0; i < 3; i++) expect((await checkRateLimit(store, "k", 3, 60_000, now)).allowed).toBe(true);
    const blocked = await checkRateLimit(store, "k", 3, 60_000, now);
    expect(blocked).toMatchObject({ allowed: false, remaining: 0 });
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });
  it("resets in the next window and isolates keys", async () => {
    const store = memoryStore();
    await checkRateLimit(store, "a", 1, 60_000, 0);
    expect((await checkRateLimit(store, "a", 1, 60_000, 0)).allowed).toBe(false);
    expect((await checkRateLimit(store, "b", 1, 60_000, 0)).allowed).toBe(true);
    expect((await checkRateLimit(store, "a", 1, 60_000, 60_001)).allowed).toBe(true);
  });
});

describe("clientIp", () => {
  it("uses the first x-forwarded-for entry", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  });
  it("falls back gracefully", () => {
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
