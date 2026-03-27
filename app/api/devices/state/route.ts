import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";

import { getSession } from "@/lib/auth";
import { MqttManager } from "@/lib/mqtt";

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, state, trigger } = body;

  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

  const device = await prisma.device.findFirst({
    where: { id: Number(id), userId: user.id },
  });

  if (!device) return NextResponse.json({ error: "Perangkat tidak ditemukan" }, { status: 404 });

  const newState = state ? 1 : 0;
  const prevState = device.lastState;

  await prisma.device.update({
    where: { id: device.id },
    data: {
      lastState: newState,
      latestState: newState,
      lastSeen: new Date(),
      lastStateChanged: new Date(),
    },
  });

  // Track device session
  if (newState === 1 && prevState === 0) {
    await prisma.deviceSession.create({
      data: {
        userId: user.id,
        deviceId: device.id,
        turnedOnAt: new Date(),
        triggerType: trigger || "Manual",
      },
    });
  } else if (newState === 0 && prevState === 1) {
    const session = await prisma.deviceSession.findFirst({
      where: { deviceId: device.id, turnedOffAt: null },
      orderBy: { turnedOnAt: "desc" },
    });
    if (session) {
      const duration = Math.max(
        0,
        Math.floor((Date.now() - session.turnedOnAt.getTime()) / 1000)
      );
      await prisma.deviceSession.update({
        where: { id: session.id },
        data: { turnedOffAt: new Date(), durationSec: duration },
      });
    }
  }

  // Activity log
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      deviceName: device.name,
      activity: newState ? "Dinyalakan (ON)" : "Dimatikan (OFF)",
      triggerType: trigger || "Manual",
      logType: "info",
    },
  });

  // ==========================================
  // 🚀 OUTBOUND MQTT PUSH KE HARDWARE (NODEMCU)
  // ==========================================
  const publishTopic = device.topicSub || `iotzy/${device.deviceKey}/command`;
  await MqttManager.publish(publishTopic, {
    deviceKey: device.deviceKey,
    state: newState,
    action: "set_state"
  });

  return NextResponse.json({ success: true, newState });
}
