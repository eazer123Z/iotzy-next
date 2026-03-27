import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SensorsContent from "@/components/sensors/SensorsContent";
export const dynamic = "force-dynamic";


export default async function SensorsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const sensors = await prisma.sensor.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <SensorsContent
      sensors={sensors.map((s) => ({
        ...s,
        latestValue: s.latestValue ? Number(s.latestValue) : null,
        lastSeen: s.lastSeen?.toISOString() || null,
      }))}
    />
  );
}
