import { describe, expect, it } from "vitest";
import { chatRequestSchema, normalizeDomain, settingsSchema } from "@/lib/validation";

describe("normalizeDomain", () => {
  it("reduces URLs to lowercase hostnames", () => {
    expect(normalizeDomain("https://Shop.Example.com/path?x=1")).toBe("shop.example.com");
    expect(normalizeDomain("example.com:8080")).toBe("example.com");
  });
  it("supports wildcards and localhost", () => {
    expect(normalizeDomain("*.example.com")).toBe("*.example.com");
    expect(normalizeDomain("localhost")).toBe("localhost");
  });
  it("rejects garbage", () => {
    expect(normalizeDomain("not a domain")).toBeNull();
    expect(normalizeDomain("javascript:alert(1)")).toBeNull();
    expect(normalizeDomain("")).toBeNull();
  });
});

describe("settingsSchema", () => {
  it("applies defaults and trims", () => {
    const r = settingsSchema.parse({ businessName: "  Acme  " });
    expect(r).toMatchObject({ businessName: "Acme", supportEmail: "", knowledge: "", allowedDomains: [] });
  });
  it("normalizes and de-duplicates domains", () => {
    const r = settingsSchema.parse({ allowedDomains: ["https://A.com", "a.com", "  "] });
    expect(r.allowedDomains).toEqual(["a.com"]);
  });
  it("rejects invalid email, invalid domains and oversized knowledge", () => {
    expect(settingsSchema.safeParse({ supportEmail: "nope" }).success).toBe(false);
    expect(settingsSchema.safeParse({ allowedDomains: ["bad domain"] }).success).toBe(false);
    expect(settingsSchema.safeParse({ knowledge: "x".repeat(20_001) }).success).toBe(false);
  });
  it("does not let a body-supplied ownerId through", () => {
    expect(settingsSchema.parse({ ownerId: "victim" })).not.toHaveProperty("ownerId");
  });
});

describe("chatRequestSchema", () => {
  const ok = { botId: "abcdefgh1234", sessionId: "sess12345678", message: "hi" };
  it("accepts a valid request", () => {
    expect(chatRequestSchema.parse(ok).history).toEqual([]);
  });
  it("blocks NoSQL operator injection in botId", () => {
    expect(chatRequestSchema.safeParse({ ...ok, botId: { $ne: null } }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ ...ok, botId: "a$b" }).success).toBe(false);
  });
  it("enforces message and history limits", () => {
    expect(chatRequestSchema.safeParse({ ...ok, message: "x".repeat(501) }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ ...ok, message: "   " }).success).toBe(false);
    const item = { role: "user", content: "a" };
    expect(chatRequestSchema.safeParse({ ...ok, history: Array(7).fill(item) }).success).toBe(false);
  });
  it("rejects unknown roles in history", () => {
    expect(chatRequestSchema.safeParse({ ...ok, history: [{ role: "system", content: "x" }] }).success).toBe(false);
  });
});
