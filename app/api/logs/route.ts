import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await prisma.activityLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ success: true, logs });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { device_name, activity, trigger_type, log_type } = body;

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      deviceName: device_name || "System",
      activity: activity || "",
      triggerType: trigger_type || "Manual",
      logType: log_type || "info",
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.activityLog.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ success: true, message: "Semua log dihapus" });
}
