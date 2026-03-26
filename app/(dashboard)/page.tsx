import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardContent from "@/components/dashboard/DashboardContent";

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [devices, sensors, cvState, logs, settings] = await Promise.all([
    prisma.device.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.sensor.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.cvState.findUnique({ where: { userId: user.id } }),
    prisma.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.userSettings.findUnique({
      where: { userId: user.id },
      select: { quickControlDevices: true },
    }),
  ]);

  const activeDevices = devices.filter((d) => d.lastState === 1).length;
  const onlineSensors = sensors.filter(
    (s) =>
      s.lastSeen &&
      new Date(s.lastSeen).getTime() > Date.now() - 5 * 60 * 1000
  ).length;

  return (
    <DashboardContent
      username={user.username}
      devices={devices.map((d) => ({
        ...d,
        lastSeen: d.lastSeen?.toISOString() || null,
        lastStateChanged: d.lastStateChanged?.toISOString() || null,
      }))}
      sensors={sensors.map((s) => ({
        ...s,
        latestValue: s.latestValue ? Number(s.latestValue) : null,
        lastSeen: s.lastSeen?.toISOString() || null,
      }))}
      cvState={
        cvState
          ? {
              isActive: cvState.isActive,
              modelLoaded: cvState.modelLoaded,
              personCount: cvState.personCount,
              brightness: cvState.brightness,
              lightCondition: cvState.lightCondition,
            }
          : null
      }
      logs={logs.map((l) => ({
        id: l.id,
        deviceName: l.deviceName,
        activity: l.activity,
        triggerType: l.triggerType,
        logType: (l.logType ?? "info") as "info" | "success" | "warning" | "error",
        createdAt: l.createdAt.toISOString(),
      }))}
      stats={{
        totalDevices: devices.length,
        activeDevices,
        totalSensors: sensors.length,
        onlineSensors,
      }}
      quickControls={
        Array.isArray(settings?.quickControlDevices)
          ? (settings.quickControlDevices as number[]).map(String)
          : []
      }
    />
  );
}
