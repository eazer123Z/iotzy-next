import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DevicesContent from "@/components/devices/DevicesContent";

export default async function DevicesPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const devices = await prisma.device.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <DevicesContent
      devices={devices.map((d) => ({
        ...d,
        lastSeen: d.lastSeen?.toISOString() || null,
        lastStateChanged: d.lastStateChanged?.toISOString() || null,
      }))}
    />
  );
}
