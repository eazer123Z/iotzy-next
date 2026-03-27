import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import CameraContent from "@/components/camera/CameraContent";
export const dynamic = "force-dynamic";


export default async function CameraPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [cvState, settings] = await Promise.all([
    prisma.cvState.findUnique({ where: { userId: user.id } }),
    prisma.userSettings.findUnique({
      where: { userId: user.id },
      select: {
        cvRules: true,
        cvMinConfidence: true,
        cvDarkThreshold: true,
        cvBrightThreshold: true,
        cvHumanRulesEnabled: true,
        cvLightRulesEnabled: true,
      },
    }),
  ]);

  return (
    <CameraContent
      cvState={
        cvState || {
          isActive: false,
          modelLoaded: false,
          personCount: 0,
          brightness: 0,
          lightCondition: "unknown",
        }
      }
      settings={{
        confidence: settings?.cvMinConfidence ? Number(settings.cvMinConfidence) : 0.5,
        darkThreshold: settings?.cvDarkThreshold ? Number(settings.cvDarkThreshold) : 0.3,
        brightThreshold: settings?.cvBrightThreshold ? Number(settings.cvBrightThreshold) : 0.7,
        humanEnabled: settings?.cvHumanRulesEnabled ?? true,
        lightEnabled: settings?.cvLightRulesEnabled ?? true,
      }}
    />
  );
}
