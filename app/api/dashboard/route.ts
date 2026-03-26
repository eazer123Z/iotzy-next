import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";

import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [devices, sensors, cvState, settings] = await Promise.all([
    prisma.device.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.sensor.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.cvState.findUnique({ where: { userId: user.id } }),
    prisma.userSettings.findUnique({ where: { userId: user.id } }),
  ]);

  const totalDevices = await prisma.device.count({ where: { userId: user.id } });
  const activeDevices = devices.filter((d) => d.lastState === 1).length;
  const onlineSensors = sensors.filter(
    (s) =>
      s.lastSeen &&
      new Date(s.lastSeen).getTime() > Date.now() - 5 * 60 * 1000
  ).length;

  return NextResponse.json({
    success: true,
    devices,
    sensors,
    cvState: cvState || {
      isActive: false,
      modelLoaded: false,
      personCount: 0,
      brightness: 0,
      lightCondition: "unknown",
    },
    settings: settings
      ? {
          quickControlDevices: settings.quickControlDevices,
          theme: settings.theme,
          mqttBroker: settings.mqttBroker,
          mqttPort: settings.mqttPort,
          mqttUseSsl: settings.mqttUseSsl,
        }
      : null,
    stats: {
      totalDevices,
      activeDevices,
      totalSensors: sensors.length,
      onlineSensors,
    },
  });
}
