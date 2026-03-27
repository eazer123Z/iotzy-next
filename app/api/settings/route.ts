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

import { SettingsUpdateSchema } from "@/lib/validators";
import { MqttManager } from "@/lib/mqtt";

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  // ZOD VALIDATION (Strict Schema)
  const validation = SettingsUpdateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ 
      error: "Validation Error", 
      details: validation.error.format() 
    }, { status: 400 });
  }

  const validData = validation.data;

  // DB Map
  const fieldMap: Record<string, string> = {
    mqtt_broker: "mqttBroker",
    mqtt_port: "mqttPort",
    mqtt_path: "mqttPath",
    mqtt_client_id: "mqttClientId",
    mqtt_username: "mqttUsername",
    mqtt_use_ssl: "mqttUseSsl",
    telegram_chat_id: "telegramChatId",
    telegram_bot_token: "telegramBotToken",
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
    if (phpKey in validData) {
      updateData[prismaKey] = (validData as any)[phpKey];
    }
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.userSettings.update({
      where: { userId: user.id },
      data: updateData,
    });

    // Check if MQTT settings were changed to trigger a reconnect
    const mqttKeys = ["mqttBroker", "mqttPort", "mqttUseSsl", "mqttUsername", "mqttClientId", "mqttPath"];
    const needsMqttRestart = mqttKeys.some(key => key in updateData);
    
    if (needsMqttRestart) {
      await MqttManager.disconnect();
      // It will automatically reconnect on the next publish or server poll
    }
  }

  return NextResponse.json({ success: true, message: "Pengaturan disimpan" });
}
