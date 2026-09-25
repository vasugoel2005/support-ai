import connectDb from "./db";
import Settings, { newBotId } from "@/model/settings.model";

/** Returns the owner's settings, creating them (with a fresh botId) on first use. */
export async function getOrCreateSettings(ownerId: string) {
  await connectDb();
  const doc = await Settings.findOneAndUpdate(
    { ownerId },
    { $setOnInsert: { ownerId, botId: newBotId() } },
    { upsert: true, new: true }
  );
  if (!doc.botId) {
    // Legacy document created before botId existed.
    doc.botId = newBotId();
    await doc.save();
  }
  return doc;
}

export function toSettingsDTO(s: {
  botId: string;
  businessName?: string;
  supportEmail?: string;
  knowledge?: string;
  allowedDomains?: string[];
}) {
  return {
    botId: s.botId,
    businessName: s.businessName ?? "",
    supportEmail: s.supportEmail ?? "",
    knowledge: s.knowledge ?? "",
    allowedDomains: s.allowedDomains ?? [],
  };
}
