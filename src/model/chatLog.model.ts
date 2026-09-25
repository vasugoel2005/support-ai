import { Model, model, models, Schema } from "mongoose";

export interface IChatLog {
  botId: string;
  sessionId: string;
  question: string;
  answer: string;
  /** false when the assistant could not answer from the knowledge base. */
  answered: boolean;
  /** Owner has handled this gap (e.g. added it to the knowledge base). */
  resolved: boolean;
  createdAt: Date;
}

const RETENTION_DAYS = 90;

const chatLogSchema = new Schema<IChatLog>(
  {
    botId: { type: String, required: true },
    sessionId: { type: String, required: true },
    question: { type: String, required: true, maxlength: 500 },
    answer: { type: String, required: true, maxlength: 4000 },
    answered: { type: Boolean, required: true },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

chatLogSchema.index({ botId: 1, createdAt: -1 });
chatLogSchema.index({ botId: 1, answered: 1, resolved: 1, createdAt: -1 });
// Data-retention policy: chat logs auto-delete after 90 days.
chatLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: RETENTION_DAYS * 24 * 60 * 60 });

const ChatLog = (models.ChatLog as Model<IChatLog>) || model<IChatLog>("ChatLog", chatLogSchema);
export default ChatLog;
