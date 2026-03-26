import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";

import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [cvState, settings] = await Promise.all([
    prisma.cvState.findUnique({ where: { userId: user.id } }),
    prisma.userSettings.findUnique({
      where: { userId: user.id },
      select: {
        cvRules: true,
        cvConfig: true,
        cvMinConfidence: true,
        cvDarkThreshold: true,
        cvBrightThreshold: true,
        cvHumanRulesEnabled: true,
        cvLightRulesEnabled: true,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    cvState,
    settings,
  });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action === "update_state") {
    await prisma.cvState.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        isActive: body.is_active ?? false,
        modelLoaded: body.model_loaded ?? false,
        personCount: body.person_count ?? 0,
        brightness: body.brightness ?? 0,
        lightCondition: body.light_condition ?? "unknown",
      },
      update: {
        isActive: body.is_active,
        modelLoaded: body.model_loaded,
        personCount: body.person_count,
        brightness: body.brightness,
        lightCondition: body.light_condition,
      },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "save_rules") {
    await prisma.userSettings.update({
      where: { userId: user.id },
      data: { cvRules: body.rules },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "save_config") {
    await prisma.userSettings.update({
      where: { userId: user.id },
      data: {
        cvMinConfidence: body.min_confidence,
        cvDarkThreshold: body.dark_threshold,
        cvBrightThreshold: body.bright_threshold,
        cvHumanRulesEnabled: body.human_enabled,
        cvLightRulesEnabled: body.light_enabled,
      },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
