import { describe, expect, it } from "vitest";
import { isOriginAllowed } from "@/lib/origin";

describe("isOriginAllowed", () => {
  it("allows everything when no allowlist is configured", () => {
    expect(isOriginAllowed("https://anything.com", [])).toBe(true);
    expect(isOriginAllowed(null, [])).toBe(true);
  });
  it("requires an Origin header when an allowlist exists", () => {
    expect(isOriginAllowed(null, ["a.com"])).toBe(false);
  });
  it("matches exact hosts, ignoring port and scheme", () => {
    expect(isOriginAllowed("https://a.com:3000", ["a.com"])).toBe(true);
    expect(isOriginAllowed("https://b.com", ["a.com"])).toBe(false);
  });
  it("wildcards match subdomains only, not the apex or look-alikes", () => {
    const rules = ["*.a.com"];
    expect(isOriginAllowed("https://shop.a.com", rules)).toBe(true);
    expect(isOriginAllowed("https://a.com", rules)).toBe(false);
    expect(isOriginAllowed("https://evila.com", rules)).toBe(false);
    expect(isOriginAllowed("https://shop.a.com.evil.io", rules)).toBe(false);
  });
  it("rejects malformed origins", () => {
    expect(isOriginAllowed("null", ["a.com"])).toBe(false);
  });
});
