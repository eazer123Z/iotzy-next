import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";

import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  });

  const templates = await prisma.mqttTemplate.findMany({
    orderBy: { id: "asc" },
  });

  return NextResponse.json({ success: true, settings, templates });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Build update object dynamically
  const allowedFields = [
    "mqtt_broker",
    "mqtt_port",
    "mqtt_path",
    "mqtt_client_id",
    "mqtt_username",
    "mqtt_use_ssl",
    "telegram_chat_id",
    "automation_lamp",
    "automation_fan",
    "automation_lock",
    "lamp_on_threshold",
    "lamp_off_threshold",
    "fan_temp_high",
    "fan_temp_normal",
    "lock_delay",
    "theme",
    "quick_control_devices",
    "cv_min_confidence",
    "cv_dark_threshold",
    "cv_bright_threshold",
    "cv_human_rules_enabled",
    "cv_light_rules_enabled",
  ];

  const fieldMap: Record<string, string> = {
    mqtt_broker: "mqttBroker",
    mqtt_port: "mqttPort",
    mqtt_path: "mqttPath",
    mqtt_client_id: "mqttClientId",
    mqtt_username: "mqttUsername",
    mqtt_use_ssl: "mqttUseSsl",
    telegram_chat_id: "telegramChatId",
    automation_lamp: "automationLamp",
    automation_fan: "automationFan",
    automation_lock: "automationLock",
    lamp_on_threshold: "lampOnThreshold",
    lamp_off_threshold: "lampOffThreshold",
    fan_temp_high: "fanTempHigh",
    fan_temp_normal: "fanTempNormal",
    lock_delay: "lockDelay",
    theme: "theme",
    quick_control_devices: "quickControlDevices",
    cv_min_confidence: "cvMinConfidence",
    cv_dark_threshold: "cvDarkThreshold",
    cv_bright_threshold: "cvBrightThreshold",
    cv_human_rules_enabled: "cvHumanRulesEnabled",
    cv_light_rules_enabled: "cvLightRulesEnabled",
  };

  const updateData: Record<string, any> = {};
  for (const [phpKey, prismaKey] of Object.entries(fieldMap)) {
    if (phpKey in body) {
      updateData[prismaKey] = body[phpKey];
    }
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.userSettings.update({
      where: { userId: user.id },
      data: updateData,
    });
  }

  return NextResponse.json({ success: true, message: "Pengaturan disimpan" });
}
