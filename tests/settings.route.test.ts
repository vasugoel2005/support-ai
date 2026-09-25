import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getSession = vi.fn();
const getOrCreateSettings = vi.fn();
vi.mock("@/lib/getSession", () => ({ getSession: () => getSession() }));
vi.mock("@/lib/settings", async (orig) => ({
  ...(await orig<typeof import("@/lib/settings")>()),
  getOrCreateSettings: (id: string) => getOrCreateSettings(id),
}));

import { GET, PUT } from "@/app/api/settings/route";

const put = (body: unknown) =>
  new NextRequest("http://localhost/api/settings", { method: "PUT", body: JSON.stringify(body) });

function fakeDoc(over = {}) {
  return { botId: "bot_abcdefgh", businessName: "", supportEmail: "", knowledge: "", allowedDomains: [], save: vi.fn(), ...over };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("/api/settings authorization", () => {
  it("rejects unauthenticated reads and writes", async () => {
    getSession.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect((await PUT(put({ businessName: "x" }))).status).toBe(401);
    expect(getOrCreateSettings).not.toHaveBeenCalled();
  });

  it("uses the session user, ignoring an ownerId supplied in the body (IDOR fix)", async () => {
    getSession.mockResolvedValue({ user: { id: "me" } });
    const doc = fakeDoc();
    getOrCreateSettings.mockResolvedValue(doc);

    const res = await PUT(put({ ownerId: "victim", businessName: "Mine" }));

    expect(res.status).toBe(200);
    expect(getOrCreateSettings).toHaveBeenCalledWith("me");
    expect(doc.save).toHaveBeenCalled();
    expect(doc).not.toHaveProperty("ownerId");
    expect(doc.businessName).toBe("Mine");
  });

  it("returns 400 with a message for invalid input and does not save", async () => {
    getSession.mockResolvedValue({ user: { id: "me" } });
    const res = await PUT(put({ supportEmail: "not-an-email" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/email/i);
    expect(getOrCreateSettings).not.toHaveBeenCalled();
  });
});
