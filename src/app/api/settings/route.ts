import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import { getOrCreateSettings, toSettingsDTO } from "@/lib/settings";
import { settingsSchema } from "@/lib/validation";

async function currentOwnerId() {
  const session = await getSession();
  return session?.user?.id ?? null;
}

export async function GET() {
  const ownerId = await currentOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(toSettingsDTO(await getOrCreateSettings(ownerId)));
}

export async function PUT(req: NextRequest) {
  // Identity comes from the session only; any ownerId in the body is ignored.
  const ownerId = await currentOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const settings = await getOrCreateSettings(ownerId);
  Object.assign(settings, parsed.data);
  await settings.save();
  return NextResponse.json(toSettingsDTO(settings));
}
