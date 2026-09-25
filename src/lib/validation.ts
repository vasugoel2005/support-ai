import { z } from "zod";

/** Hostname or wildcard host, e.g. `shop.example.com`, `*.example.com`, `localhost`. */
const DOMAIN_RE = /^(\*\.)?([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$|^localhost$/;

/** Accepts a URL or bare host and reduces it to a lowercase hostname (or null). */
export function normalizeDomain(input: string): string | null {
  let value = input.trim().toLowerCase();
  if (!value) return null;
  value = value.replace(/^https?:\/\//, "").split(/[/?#:]/)[0];
  return DOMAIN_RE.test(value) ? value : null;
}

export const settingsSchema = z.object({
  businessName: z.string().trim().max(100).default(""),
  supportEmail: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Invalid email address")
    .default(""),
  knowledge: z.string().max(20_000, "Knowledge base is limited to 20,000 characters").default(""),
  allowedDomains: z
    .array(z.string())
    .max(20, "At most 20 domains")
    .transform((list, ctx) => {
      const out = new Set<string>();
      for (const raw of list) {
        if (!raw.trim()) continue;
        const d = normalizeDomain(raw);
        if (!d) {
          ctx.addIssue({ code: "custom", message: `Invalid domain: ${raw}` });
          return z.NEVER;
        }
        out.add(d);
      }
      return [...out];
    })
    .default([]),
});
export type SettingsInput = z.infer<typeof settingsSchema>;

const historyItem = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(1_500),
});

/**
 * `botId` and `sessionId` must be plain strings: this is what stops Mongo
 * operator injection such as `{"botId": {"$ne": null}}`.
 */
export const chatRequestSchema = z.object({
  botId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  sessionId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  message: z.string().trim().min(1).max(500),
  history: z.array(historyItem).max(6).default([]),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const resolveSchema = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/) });
