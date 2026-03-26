export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sensorId = Number(searchParams.get("sensor_id"));
  const hours = Math.min(Number(searchParams.get("hours") || 24), 168);

  if (!sensorId) {
    return NextResponse.json({ error: "sensor_id required" }, { status: 400 });
  }

  // Verify ownership
  const sensor = await prisma.sensor.findFirst({
    where: { id: sensorId, userId: user.id },
  });
  if (!sensor) {
    return NextResponse.json({ error: "Sensor not found" }, { status: 404 });
  }

  const since = new Date(Date.now() - hours * 3600 * 1000);

  const readings = await prisma.sensorReading.findMany({
    where: {
      sensorId,
      recordedAt: { gte: since },
    },
    orderBy: { recordedAt: "asc" },
    select: { value: true, recordedAt: true },
  });

  return NextResponse.json({
    success: true,
    readings: readings.map((r) => ({
      value: Number(r.value),
      recordedAt: r.recordedAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { sensor_id, value } = body;

  if (!sensor_id || value == null) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // Verify ownership
  const sensor = await prisma.sensor.findFirst({
    where: { id: Number(sensor_id), userId: user.id },
  });
  if (!sensor) {
    return NextResponse.json({ error: "Sensor not found" }, { status: 404 });
  }

  await prisma.sensorReading.create({
    data: {
      sensorId: Number(sensor_id),
      value: Number(value),
    },
  });

  await prisma.sensor.update({
    where: { id: Number(sensor_id) },
    data: {
      latestValue: Number(value),
      lastSeen: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
