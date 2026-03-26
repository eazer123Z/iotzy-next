export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const devices = await prisma.device.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(devices);
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, icon, topic_sub, topic_pub } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nama perangkat harus diisi" }, { status: 400 });
  }

  const deviceKey = `device_${Date.now().toString(36)}`;

  const device = await prisma.device.create({
    data: {
      userId: user.id,
      deviceKey,
      name: name.trim(),
      icon: icon || "fa-plug",
      topicSub: topic_sub || null,
      topicPub: topic_pub || null,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      deviceName: device.name,
      activity: "Perangkat baru ditambahkan",
      triggerType: "User",
      logType: "success",
    },
  });

  return NextResponse.json({
    success: true,
    id: device.id,
    device_key: deviceKey,
    message: "Perangkat berhasil ditambahkan",
  });
}

export async function PUT(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, name, icon, topic_sub, topic_pub } = body;

  if (!id || !name?.trim()) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const device = await prisma.device.findFirst({
    where: { id: Number(id), userId: user.id },
  });

  if (!device) {
    return NextResponse.json({ error: "Perangkat tidak ditemukan" }, { status: 404 });
  }

  await prisma.device.update({
    where: { id: device.id },
    data: {
      name: name.trim(),
      icon: icon || device.icon,
      topicSub: topic_sub || null,
      topicPub: topic_pub || null,
    },
  });

  return NextResponse.json({ success: true, message: "Data perangkat diperbarui" });
}

export async function DELETE(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));

  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

  const device = await prisma.device.findFirst({
    where: { id, userId: user.id },
  });

  if (device) {
    await prisma.device.delete({ where: { id } });
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        deviceName: device.name,
        activity: "Perangkat dihapus dari sistem",
        triggerType: "User",
        logType: "warning",
      },
    });
  }

  return NextResponse.json({ success: true, message: "Perangkat dihapus" });
}
