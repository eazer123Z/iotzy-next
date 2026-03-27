import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsContent from "@/components/settings/SettingsContent";
export const dynamic = "force-dynamic";


export default async function SettingsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [settings, templates] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId: user.id } }),
    prisma.mqttTemplate.findMany({ orderBy: { id: "asc" } }),
  ]);

  return (
    <SettingsContent
      user={{
        username: user.username,
        email: user.email,
        fullName: user.fullName,
      }}
      settings={
        settings
          ? {
              mqttBroker: settings.mqttBroker,
              mqttPort: settings.mqttPort,
              mqttUseSsl: settings.mqttUseSsl,
              mqttUsername: settings.mqttUsername,
              mqttPath: settings.mqttPath,
              mqttClientId: settings.mqttClientId,
              telegramChatId: settings.telegramChatId,
              automationLamp: settings.automationLamp,
              automationFan: settings.automationFan,
              automationLock: settings.automationLock,
              lampOnThreshold: settings.lampOnThreshold ? Number(settings.lampOnThreshold) : null,
              lampOffThreshold: settings.lampOffThreshold ? Number(settings.lampOffThreshold) : null,
              fanTempHigh: settings.fanTempHigh ? Number(settings.fanTempHigh) : null,
              fanTempNormal: settings.fanTempNormal ? Number(settings.fanTempNormal) : null,
              lockDelay: settings.lockDelay,
              theme: settings.theme,
              cvMinConfidence: settings.cvMinConfidence ? Number(settings.cvMinConfidence) : null,
              cvDarkThreshold: settings.cvDarkThreshold ? Number(settings.cvDarkThreshold) : null,
              cvBrightThreshold: settings.cvBrightThreshold ? Number(settings.cvBrightThreshold) : null,
              cvHumanRulesEnabled: settings.cvHumanRulesEnabled,
              cvLightRulesEnabled: settings.cvLightRulesEnabled,
            }
          : null
      }
      templates={templates.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
      }))}
    />
  );
}
