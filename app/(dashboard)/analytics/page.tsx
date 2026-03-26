import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AnalyticsContent from "@/components/analytics/AnalyticsContent";

export default async function AnalyticsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const logs = await prisma.activityLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const stats = {
    total: logs.length,
    today: logs.filter(
      (l) => new Date(l.createdAt).toDateString() === new Date().toDateString()
    ).length,
    errors: logs.filter((l) => l.logType === "error").length,
    warnings: logs.filter((l) => l.logType === "warning").length,
  };

  return (
    <AnalyticsContent
      logs={logs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString(), logType: l.logType as "info" | "success" | "warning" | "error" }))}
      stats={stats}
    />
  );
}
