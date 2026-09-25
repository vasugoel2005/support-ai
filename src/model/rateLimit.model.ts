import { Model, model, models, Schema } from "mongoose";

interface IRateLimit {
  key: string;
  count: number;
  expiresAt: Date;
}

const rateLimitSchema = new Schema<IRateLimit>({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});
// Mongo's TTL monitor removes counters once their window has passed.
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default (models.RateLimit as Model<IRateLimit>) || model<IRateLimit>("RateLimit", rateLimitSchema);
