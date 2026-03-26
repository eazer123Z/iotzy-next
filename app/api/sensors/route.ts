import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";

import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sensors = await prisma.sensor.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(sensors);
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, type, unit, topic } = body;

  if (!name?.trim() || !topic?.trim()) {
    return NextResponse.json(
      { error: "Nama dan topic harus diisi" },
      { status: 400 }
    );
  }

  const allowedTypes = [
    "temperature",
    "humidity",
    "air_quality",
    "presence",
    "brightness",
    "motion",
    "smoke",
    "gas",
  ];
  const sensorType = allowedTypes.includes(type) ? type : "temperature";

  const iconMap: Record<string, string> = {
    temperature: "fa-temperature-half",
    humidity: "fa-droplet",
    air_quality: "fa-wind",
    presence: "fa-user-check",
    brightness: "fa-sun",
    motion: "fa-person-running",
    smoke: "fa-fire",
    gas: "fa-triangle-exclamation",
  };

  const sensorKey = `sensor_${Date.now().toString(36)}`;

  const sensor = await prisma.sensor.create({
    data: {
      userId: user.id,
      sensorKey,
      name: name.trim(),
      type: sensorType,
      icon: iconMap[sensorType] || "fa-microchip",
      unit: unit || "",
      topic: topic.trim(),
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      deviceName: sensor.name,
      activity: "Sensor baru ditambahkan",
      triggerType: "User",
      logType: "success",
    },
  });

  return NextResponse.json({
    success: true,
    id: sensor.id,
    sensor_key: sensorKey,
    message: "Sensor berhasil disimpan",
  });
}

export async function DELETE(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));

  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

  const sensor = await prisma.sensor.findFirst({
    where: { id, userId: user.id },
  });

  if (sensor) {
    await prisma.sensor.delete({ where: { id } });
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        deviceName: sensor.name,
        activity: "Sensor dihapus",
        triggerType: "User",
        logType: "warning",
      },
    });
  }

  return NextResponse.json({ success: true, message: "Sensor dihapus" });
}
