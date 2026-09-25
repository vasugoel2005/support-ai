import connectDb from "./db";
import RateLimit from "@/model/rateLimit.model";
import type { RateLimitStore } from "./rateLimit";

/** MongoDB-backed store: one upserted counter document per (key, window). */
export const mongoRateLimitStore: RateLimitStore = {
  async hit(key, windowMs, now) {
    await connectDb();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const filter = { key: `${key}:${windowStart}` };
    const update = {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date(windowStart + windowMs) },
    };
    try {
      const doc = await RateLimit.findOneAndUpdate(filter, update, { upsert: true, new: true });
      return doc.count;
    } catch (err) {
      // Two concurrent first-hits can race on the unique index; retry once.
      if ((err as { code?: number }).code === 11000) {
        const doc = await RateLimit.findOneAndUpdate(filter, update, { new: true });
        return doc?.count ?? 1;
      }
      throw err;
    }
  },
};
