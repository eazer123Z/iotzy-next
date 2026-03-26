import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schedules = await prisma.schedule.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(schedules);
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { label, time, days, action, devices } = body;

  if (!time || !devices?.length) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const schedule = await prisma.schedule.create({
    data: {
      userId: user.id,
      label: label || null,
      timeHhmm: time,
      days: days?.length ? days : undefined,
      action: action || "on",
      devices: devices,
    },
  });

  return NextResponse.json({ success: true, id: schedule.id });
}

export async function PATCH(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, is_enabled } = body;

  await prisma.schedule.updateMany({
    where: { id: Number(id), userId: user.id },
    data: { isEnabled: is_enabled },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  await prisma.schedule.deleteMany({
    where: { id: Number(body.id), userId: user.id },
  });

  return NextResponse.json({ success: true });
}
