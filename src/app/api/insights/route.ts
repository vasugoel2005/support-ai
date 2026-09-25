import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import { getOrCreateSettings } from "@/lib/settings";
import ChatLog from "@/model/chatLog.model";
import { fillDays } from "@/lib/insights";
import { resolveSchema } from "@/lib/validation";

const DAY = 24 * 60 * 60 * 1000;

async function ownerBotId() {
  const session = await getSession();
  const ownerId = session?.user?.id;
  if (!ownerId) return null;
  return (await getOrCreateSettings(ownerId)).botId;
}

export async function GET() {
  const botId = await ownerBotId();
  if (!botId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since30 = new Date(Date.now() - 30 * DAY);
  const since14 = new Date(Date.now() - 14 * DAY);

  const [totals, daily, unanswered] = await Promise.all([
    ChatLog.aggregate<{ total: number; answered: number }>([
      { $match: { botId, createdAt: { $gte: since30 } } },
      { $group: { _id: null, total: { $sum: 1 }, answered: { $sum: { $cond: ["$answered", 1, 0] } } } },
    ]),
    ChatLog.aggregate<{ _id: string; total: number; unanswered: number }>([
      { $match: { botId, createdAt: { $gte: since14 } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: 1 },
          unanswered: { $sum: { $cond: ["$answered", 0, 1] } },
        },
      },
    ]),
    ChatLog.find({ botId, answered: false, resolved: false })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("question createdAt")
      .lean(),
  ]);

  const total = totals[0]?.total ?? 0;
  const answered = totals[0]?.answered ?? 0;
  return NextResponse.json({
    total,
    answered,
    answerRate: total ? Math.round((answered / total) * 100) : null,
    daily: fillDays(daily, 14),
    unanswered: unanswered.map((u) => ({ id: String(u._id), question: u.question, createdAt: u.createdAt })),
  });
}

/** Mark an unanswered question as handled. Scoped to the caller's own bot. */
export async function PATCH(req: NextRequest) {
  const botId = await ownerBotId();
  if (!botId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = resolveSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const res = await ChatLog.updateOne({ _id: parsed.data.id, botId }, { $set: { resolved: true } });
  if (res.matchedCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
