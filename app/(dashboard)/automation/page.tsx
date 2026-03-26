import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AutomationContent from "@/components/automation/AutomationContent";

export default async function AutomationPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [rules, schedules, devices, sensors] = await Promise.all([
    prisma.automationRule.findMany({
      where: { userId: user.id },
      orderBy: [{ isEnabled: "desc" }, { id: "asc" }],
      include: { sensor: { select: { name: true, type: true, unit: true } } },
    }),
    prisma.schedule.findMany({
      where: { userId: user.id },
      orderBy: { timeHhmm: "asc" },
    }),
    prisma.device.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, icon: true, isActive: true },
    }),
    prisma.sensor.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, type: true, unit: true },
    }),
  ]);

  return (
    <AutomationContent
      rules={rules.map((r) => ({
        ...r,
        threshold: r.threshold ? Number(r.threshold) : null,
        thresholdMin: r.thresholdMin ? Number(r.thresholdMin) : null,
        thresholdMax: r.thresholdMax ? Number(r.thresholdMax) : null,
        days: Array.isArray(r.days) ? r.days as number[] : null,
        sensorName: r.sensor?.name,
        sensorType: r.sensor?.type,
        createdAt: r.createdAt.toISOString(),
      }))}
      schedules={schedules.map((s) => ({
        ...s,
        time: s.timeHhmm,
        enabled: s.isEnabled,
        days: (s.days as number[]) || [],
        devices: (s.devices as number[]) || [],
        createdAt: s.createdAt.toISOString(),
      }))}
      devices={devices}
      sensors={sensors}
    />
  );
}
