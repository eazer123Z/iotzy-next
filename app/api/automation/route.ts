import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";

import { getSession } from "@/lib/auth";

// GET automation rules + schedules
export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [rules, schedules] = await Promise.all([
    prisma.automationRule.findMany({
      where: { userId: user.id },
      orderBy: [{ isEnabled: "desc" }, { id: "asc" }],
      include: {
        sensor: { select: { name: true, type: true, unit: true } },
      },
    }),
    prisma.schedule.findMany({
      where: { userId: user.id },
      orderBy: { timeHhmm: "asc" },
    }),
  ]);

  const devices = await prisma.device.findMany({
    where: { userId: user.id },
    select: { id: true, name: true, icon: true, isActive: true },
  });

  return NextResponse.json({ success: true, rules, schedules, devices });
}

// POST create rule or schedule
export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type } = body;

  if (type === "rule") {
    const rule = await prisma.automationRule.create({
      data: {
        userId: user.id,
        sensorId: body.sensor_id ? Number(body.sensor_id) : null,
        deviceId: Number(body.device_id),
        conditionType: body.condition_type || "gt",
        threshold: body.threshold ?? null,
        thresholdMin: body.threshold_min ?? null,
        thresholdMax: body.threshold_max ?? null,
        action: body.action || "on",
        delayMs: body.delay_ms ?? 0,
        startTime: body.start_time || null,
        endTime: body.end_time || null,
        days: body.days ? JSON.stringify(body.days) : undefined,
      },
    });
    return NextResponse.json({ success: true, id: rule.id });
  }

  if (type === "schedule") {
    const schedule = await prisma.schedule.create({
      data: {
        userId: user.id,
        label: body.label || null,
        timeHhmm: body.time || "00:00",
        days: body.days ? JSON.stringify(body.days) : undefined,
        action: body.action || "on",
        devices: body.device_ids ? JSON.stringify(body.device_ids) : undefined,
      },
    });
    return NextResponse.json({ success: true, id: schedule.id });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

// PUT update rule/schedule
export async function PUT(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, id } = body;

  if (type === "rule") {
    const data: Record<string, any> = {};

    // Allow partial updates (e.g. toggle only)
    if (body.sensor_id !== undefined) data.sensorId = body.sensor_id ? Number(body.sensor_id) : null;
    if (body.device_id !== undefined) data.deviceId = Number(body.device_id);
    if (body.condition_type !== undefined) data.conditionType = body.condition_type;
    if (body.threshold !== undefined) data.threshold = body.threshold ?? null;
    if (body.threshold_min !== undefined) data.thresholdMin = body.threshold_min ?? null;
    if (body.threshold_max !== undefined) data.thresholdMax = body.threshold_max ?? null;
    if (body.action !== undefined) data.action = body.action;
    if (body.delay_ms !== undefined) data.delayMs = body.delay_ms ?? 0;
    if (body.start_time !== undefined) data.startTime = body.start_time || null;
    if (body.end_time !== undefined) data.endTime = body.end_time || null;
    if (body.days !== undefined) data.days = body.days ? JSON.stringify(body.days) : undefined;
    if (body.is_enabled !== undefined) data.isEnabled = body.is_enabled;

    await prisma.automationRule.updateMany({
      where: { id: Number(id), userId: user.id },
      data,
    });
    return NextResponse.json({ success: true });
  }

  if (type === "schedule") {
    const data: Record<string, any> = {};

    if (body.label !== undefined) data.label = body.label;
    if (body.time !== undefined) data.timeHhmm = body.time;
    if (body.days !== undefined) data.days = body.days ? JSON.stringify(body.days) : undefined;
    if (body.action !== undefined) data.action = body.action;
    if (body.device_ids !== undefined) data.devices = body.device_ids ? JSON.stringify(body.device_ids) : undefined;
    if (body.is_enabled !== undefined) data.isEnabled = body.is_enabled;

    await prisma.schedule.updateMany({
      where: { id: Number(id), userId: user.id },
      data,
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

// DELETE rule/schedule
export async function DELETE(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = Number(searchParams.get("id"));

  if (!type || !id) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  if (type === "rule") {
    await prisma.automationRule.deleteMany({ where: { id, userId: user.id } });
  } else if (type === "schedule") {
    await prisma.schedule.deleteMany({ where: { id, userId: user.id } });
  }

  return NextResponse.json({ success: true });
}
