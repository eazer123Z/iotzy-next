import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardLayoutClient from "@/components/layout/DashboardLayoutClient";
export const dynamic = "force-dynamic";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
    select: {
      mqttBroker: true,
      mqttPort: true,
      mqttUseSsl: true,
      mqttUsername: true,
      mqttPath: true,
      theme: true,
    },
  });

  return (
    <DashboardLayoutClient
      user={{ ...user, theme: settings?.theme || "dark" }}
      settings={{
        mqttBroker: settings?.mqttBroker,
        mqttPort: settings?.mqttPort,
        mqttUseSsl: settings?.mqttUseSsl,
        mqttUsername: settings?.mqttUsername,
        mqttPath: settings?.mqttPath,
      }}
    >
      {children}
    </DashboardLayoutClient>
  );
}
