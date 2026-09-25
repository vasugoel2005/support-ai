import { Model, model, models, Schema } from "mongoose";
import { randomBytes } from "crypto";

export interface ISettings {
  ownerId: string;
  /** Public identifier embedded in the widget. Deliberately separate from ownerId. */
  botId: string;
  businessName: string;
  supportEmail: string;
  knowledge: string;
  allowedDomains: string[];
}

export const newBotId = () => randomBytes(12).toString("base64url");

const settingsSchema = new Schema<ISettings>(
  {
    ownerId: { type: String, required: true, unique: true },
    botId: { type: String, unique: true, sparse: true, default: newBotId },
    businessName: { type: String, default: "", maxlength: 100 },
    supportEmail: { type: String, default: "", maxlength: 200 },
    knowledge: { type: String, default: "", maxlength: 20_000 },
    allowedDomains: { type: [String], default: [] },
  },
  { timestamps: true }
);

const Settings = (models.Settings as Model<ISettings>) || model<ISettings>("Settings", settingsSchema);
export default Settings;
