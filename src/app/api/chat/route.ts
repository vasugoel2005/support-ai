import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Settings from "@/model/settings.model";
import ChatLog from "@/model/chatLog.model";
import { chatRequestSchema } from "@/lib/validation";
import { isOriginAllowed } from "@/lib/origin";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { mongoRateLimitStore } from "@/lib/rateLimitStore";
import { buildContents, buildSystemInstruction } from "@/lib/prompt";
import { generateAnswer } from "@/lib/gemini";

// The widget runs on customers' sites, so CORS is open. Real enforcement is
// server-side: origin allowlist + rate limits below.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const PER_IP_LIMIT = { max: 15, windowMs: 60_000 }; // per visitor, per bot
const PER_BOT_LIMIT = { max: 300, windowMs: 60 * 60_000 }; // protects each tenant's AI budget

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { ...CORS, ...extra } });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Invalid request" }, 400);
  const { botId, sessionId, message, history } = parsed.data;

  const ipCheck = await checkRateLimit(
    mongoRateLimitStore,
    `ip:${botId}:${clientIp(req.headers)}`,
    PER_IP_LIMIT.max,
    PER_IP_LIMIT.windowMs
  );
  if (!ipCheck.allowed) {
    return json({ error: "You're sending messages too quickly. Please wait a moment." }, 429, {
      "Retry-After": String(ipCheck.retryAfterSec),
    });
  }

  await connectDb();
  const settings = await Settings.findOne({ botId }).lean();
  if (!settings) return json({ error: "Chatbot not found" }, 404);

  if (!isOriginAllowed(req.headers.get("origin"), settings.allowedDomains ?? [])) {
    return json({ error: "This site is not authorized to use this chatbot" }, 403);
  }

  const botCheck = await checkRateLimit(
    mongoRateLimitStore,
    `bot:${botId}`,
    PER_BOT_LIMIT.max,
    PER_BOT_LIMIT.windowMs
  );
  if (!botCheck.allowed) {
    return json({ error: "This chatbot is busy right now. Please try again later." }, 429, {
      "Retry-After": String(botCheck.retryAfterSec),
    });
  }

  try {
    const ai = await generateAnswer({
      systemInstruction: buildSystemInstruction(settings),
      contents: buildContents(history, message),
    });

    // Logging must never break the customer's chat.
    await ChatLog.create({
      botId,
      sessionId,
      question: message,
      answer: ai.answer.slice(0, 4000),
      answered: ai.answered,
    }).catch((e: unknown) => console.error("chat log failed:", e instanceof Error ? e.message : e));

    return json({ reply: ai.answer, answered: ai.answered });
  } catch (err) {
    console.error("chat failed:", err instanceof Error ? err.message : err);
    return json({ error: "The assistant is temporarily unavailable." }, 502);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
