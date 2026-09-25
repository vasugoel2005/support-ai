export interface DailyBucket {
  date: string;
  total: number;
  unanswered: number;
}

/** Fills gaps so the chart always has `days` consecutive UTC days ending today. */
export function fillDays(
  rows: { _id: string; total: number; unanswered: number }[],
  days: number,
  now = new Date()
): DailyBucket[] {
  const byDate = new Map(rows.map((r) => [r._id, r]));
  const out: DailyBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    const date = d.toISOString().slice(0, 10);
    const row = byDate.get(date);
    out.push({ date, total: row?.total ?? 0, unanswered: row?.unanswered ?? 0 });
  }
  return out;
}
