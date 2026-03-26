import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";

import { getSession } from "@/lib/auth";

const AI_MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat";
const AI_TIMEOUT = 120;
const AI_MAX_RETRIES = 2;
const AI_MAX_TOKENS = 8000;
const AI_HISTORY_KEEP = 60;
const AI_HISTORY_SEND = 10;

// ─── Collect context from DB ───
async function collectContext(userId: number) {
  const [devices, sensors, rules, schedules, logs, cvState, settings] =
    await Promise.all([
      prisma.device.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
      prisma.sensor.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
      prisma.automationRule.findMany({
        where: { userId },
        orderBy: [{ isEnabled: "desc" }, { id: "asc" }],
        include: {
          sensor: { select: { name: true, type: true, unit: true } },
        },
      }),
      prisma.schedule.findMany({
        where: { userId },
        orderBy: { timeHhmm: "asc" },
      }),
      prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.cvState.findUnique({ where: { userId } }),
      prisma.userSettings.findUnique({ where: { userId } }),
    ]);

  return { devices, sensors, rules, schedules, logs, cvState, settings };
}

// ─── Format context to text ───
function formatContext(ctx: Awaited<ReturnType<typeof collectContext>>) {
  const { devices, sensors, rules, schedules, logs, cvState, settings } = ctx;
  const sections: string[] = [];

  // Devices
  if (devices.length) {
    const rows = devices.map(
      (d) =>
        `  ID:${d.id} "${d.name}" type:${d.type} (Power:${d.lastState ? "ON" : "OFF"}) [Sub:${d.topicSub || "-"} Pub:${d.topicPub || "-"}]`
    );
    sections.push(`## PERANGKAT\n${rows.join("\n")}`);
  } else {
    sections.push("## PERANGKAT\n  (kosong)");
  }

  // Sensors
  if (sensors.length) {
    const rows = sensors.map(
      (s) =>
        `  ID:${s.id} "${s.name}" type:${s.type} val:${s.latestValue ?? "N/A"}${s.unit || ""} [Topic:${s.topic}]`
    );
    sections.push(`## SENSOR\n${rows.join("\n")}`);
  } else {
    sections.push("## SENSOR\n  (kosong)");
  }

  // Rules
  if (rules.length) {
    const rows = rules.map((r) => {
      const thresh =
        r.threshold ?? `${r.thresholdMin}-${r.thresholdMax}`;
      return `  ID:${r.id} "${r.sensor?.name || "?"}" ${r.conditionType} ${thresh}${r.sensor?.unit || ""} → Device#${r.deviceId} ${r.action} [${r.isEnabled ? "ON" : "OFF"}]`;
    });
    sections.push(`## RULES\n${rows.join("\n")}`);
  }

  // Schedules
  if (schedules.length) {
    const DAY = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const rows = schedules.map((sc) => {
      const days = (sc.days as number[]) || [];
      const dayStr = days.length
        ? days.map((d) => DAY[d] ?? d).join(",")
        : "setiap hari";
      return `  ID:${sc.id} "${sc.label || "-"}" ${sc.timeHhmm} (${dayStr}) ${sc.action} [${sc.isEnabled ? "ON" : "OFF"}]`;
    });
    sections.push(`## JADWAL\n${rows.join("\n")}`);
  }

  // Logs
  if (logs.length) {
    const rows = logs.map(
      (l) =>
        `  [${l.logType}] ${new Date(l.createdAt).toLocaleTimeString("id-ID")} ${l.deviceName} ${l.activity} (via:${l.triggerType})`
    );
    sections.push(`## LOG AKTIVITAS\n${rows.join("\n")}`);
  }

  // CV
  if (cvState) {
    sections.push(
      `## CV STATE\n  Active:${cvState.isActive} Model:${cvState.modelLoaded} People:${cvState.personCount} Bright:${cvState.brightness}% (${cvState.lightCondition})`
    );
  }

  // Settings summary
  if (settings) {
    const auto: string[] = [];
    if (settings.automationLamp) auto.push("lamp");
    if (settings.automationFan) auto.push("fan");
    if (settings.automationLock) auto.push("lock");
    sections.push(
      `## SETTINGS\n  MQTT:${settings.mqttBroker || "unset"} TG:${settings.telegramChatId || "unset"} Auto:${auto.join(",") || "none"} Theme:${settings.theme}`
    );
  }

  return sections.join("\n\n");
}

// ─── Get chat history ───
async function getHistory(userId: number) {
  const rows = await prisma.aiChatHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: AI_HISTORY_SEND,
  });
  return rows
    .reverse()
    .map(
      (h) =>
        `${h.platform === "telegram" ? "[T]" : "[W]"} ${h.sender === "user" ? "U" : "A"}: ${h.message}`
    )
    .join("\n");
}

// ─── Save message ───
async function saveMessage(
  userId: number,
  sender: string,
  msg: string,
  platform = "web"
) {
  if (!msg.trim()) return;
  await prisma.aiChatHistory.create({
    data: { userId, sender, message: msg, platform },
  });
  // Cleanup old
  const old = await prisma.aiChatHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: AI_HISTORY_KEEP,
    select: { id: true },
  });
  if (old.length) {
    await prisma.aiChatHistory.deleteMany({
      where: { id: { in: old.map((o) => o.id) } },
    });
  }
}

// ─── Call OpenRouter API ───
async function callAI(apiKey: string, payload: any) {
  for (let i = 0; i <= AI_MAX_RETRIES; i++) {
    try {
      const res = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(AI_TIMEOUT * 1000),
        }
      );
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) return { ok: true, content };
    } catch (e: any) {
      if (i < AI_MAX_RETRIES) await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return { ok: false, error: "AI connection failed" };
}

// ─── Execute AI actions ───
async function executeActions(userId: number, actions: any[]) {
  const results: string[] = [];
  for (const a of actions) {
    try {
      switch (a.type) {
        case "immediate": {
          for (const id of a.device_ids || []) {
            if (a.action === "toggle") {
              const dev = await prisma.device.findFirst({
                where: { id: Number(id), userId },
              });
              if (dev) {
                const newState = dev.lastState ? 0 : 1;
                await prisma.device.update({
                  where: { id: dev.id },
                  data: {
                    lastState: newState,
                    latestState: newState,
                    lastSeen: new Date(),
                    lastStateChanged: new Date(),
                  },
                });
              }
            } else {
              const v = a.action === "on" ? 1 : 0;
              await prisma.device.updateMany({
                where: { id: Number(id), userId },
                data: {
                  lastState: v,
                  latestState: v,
                  lastSeen: new Date(),
                  lastStateChanged: new Date(),
                },
              });
            }
          }
          results.push("immediate");
          break;
        }
        case "add_device": {
          await prisma.device.create({
            data: {
              userId,
              deviceKey: `device_${Date.now().toString(36)}`,
              name: a.name,
              type: a.device_type || "switch",
              icon: a.icon || "fa-plug",
              topicSub: a.topic_sub || "",
              topicPub: a.topic_pub || "",
            },
          });
          results.push("add_device");
          break;
        }
        case "add_sensor": {
          await prisma.sensor.create({
            data: {
              userId,
              sensorKey: `sensor_${Date.now().toString(36)}`,
              name: a.name,
              type: a.sensor_type || "temperature",
              icon: a.icon || "fa-microchip",
              unit: a.unit || "",
              topic: a.topic || "",
            },
          });
          results.push("add_sensor");
          break;
        }
        case "delete_device":
          await prisma.device.deleteMany({
            where: { id: Number(a.device_id), userId },
          });
          results.push("del_device");
          break;
        case "delete_sensor":
          await prisma.sensor.deleteMany({
            where: { id: Number(a.sensor_id), userId },
          });
          results.push("del_sensor");
          break;
        case "delete_rule":
          await prisma.automationRule.deleteMany({
            where: { id: Number(a.rule_id), userId },
          });
          results.push("del_rule");
          break;
        case "delete_schedule":
          await prisma.schedule.deleteMany({
            where: { id: Number(a.schedule_id), userId },
          });
          results.push("del_sched");
          break;
        case "toggle_device_active":
          await prisma.device.updateMany({
            where: { id: Number(a.device_id), userId },
            data: { isActive: Boolean(a.is_active) },
          });
          results.push("toggle_dev");
          break;
        case "toggle_rule":
          await prisma.automationRule.updateMany({
            where: { id: Number(a.rule_id), userId },
            data: { isEnabled: Boolean(a.is_enabled) },
          });
          results.push("toggle_rule");
          break;
        case "toggle_schedule":
          await prisma.schedule.updateMany({
            where: { id: Number(a.schedule_id), userId },
            data: { isEnabled: Boolean(a.is_enabled) },
          });
          results.push("toggle_sched");
          break;
        case "reset_system":
          await prisma.automationRule.deleteMany({ where: { userId } });
          await prisma.schedule.deleteMany({ where: { userId } });
          await prisma.device.deleteMany({ where: { userId } });
          await prisma.sensor.deleteMany({ where: { userId } });
          results.push("reset_all");
          break;
        case "update_thresholds": {
          const update: any = {};
          if (a.lamp_on_threshold != null) update.lampOnThreshold = a.lamp_on_threshold;
          if (a.lamp_off_threshold != null) update.lampOffThreshold = a.lamp_off_threshold;
          if (a.fan_temp_high != null) update.fanTempHigh = a.fan_temp_high;
          if (a.fan_temp_normal != null) update.fanTempNormal = a.fan_temp_normal;
          if (a.lock_delay != null) update.lockDelay = a.lock_delay;
          if (Object.keys(update).length) {
            await prisma.userSettings.update({
              where: { userId },
              data: update,
            });
          }
          results.push("thresholds");
          break;
        }
        case "update_theme": {
          const t = ["light", "dark"].includes(a.theme) ? a.theme : "dark";
          await prisma.userSettings.update({
            where: { userId },
            data: { theme: t },
          });
          results.push(`theme:${t}`);
          break;
        }
        case "navigate":
          results.push(`nav:${a.page || ""}`);
          break;
        default:
          results.push(`unknown:${a.type}`);
      }
    } catch (e: any) {
      results.push(`error:${a.type}:${e.message}`);
    }
  }
  return results;
}

// ─── POST handler ───
export async function POST(req: Request) {
  // Support both session auth and telegram webhook auth
  let userId: number;
  const telegramHeader = req.headers.get("x-telegram-webhook");

  if (telegramHeader === "true") {
    const headerUserId = req.headers.get("x-user-id");
    if (!headerUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = Number(headerUserId);
  } else {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;
  }

  const body = await req.json();
  const message = (body.message || "").trim();
  if (!message)
    return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey)
    return NextResponse.json(
      { success: false, error: "AI API key not configured" },
      { status: 500 }
    );

  const platform = body.platform || "web";

  // Save user message
  await saveMessage(userId, "user", message, platform);

  // Build context
  const ctx = await collectContext(userId);
  const ctxText = formatContext(ctx);
  const history = await getHistory(userId);
  const time = new Date().toISOString();

  const systemPrompt = `Kamu adalah IoTzy Assistant — AI personal cerdas untuk smart home.
Output WAJIB JSON murni: {"response_text":"...","intent":"...","ui_action":"...","actions":[]}
JANGAN gunakan markdown code block. JANGAN ada teks di luar JSON.

Bahasa: Indonesia natural & santai. MANDIRI: langsung eksekusi perintah tanpa bertele-tele.
Gunakan data sistem di bawah untuk akurasi.

=== DATA SISTEM ===
${ctxText}

WAKTU: ${time}

=== RIWAYAT ===
${history}

=== ACTIONS REFERENCE ===
Kontrol: {"type":"immediate","action":"on|off|toggle","device_ids":[ID]}
Tambah device: {"type":"add_device","name":"...","device_type":"...","icon":"fa-...","topic_sub":"...","topic_pub":"..."}
Tambah sensor: {"type":"add_sensor","name":"...","sensor_type":"...","unit":"...","topic":"..."}
Hapus: {"type":"delete_device","device_id":ID} / delete_sensor / delete_rule / delete_schedule
Toggle: {"type":"toggle_device_active","device_id":ID,"is_active":true|false}
Reset: {"type":"reset_system"}
Navigasi: {"type":"navigate","page":"dashboard|devices|sensors|automation|settings|camera"}
Theme: {"type":"update_theme","theme":"dark|light"}
Thresholds: {"type":"update_thresholds","lamp_on_threshold":0.4,...}

Intent: kontrol_device | cek_sensor | buat_rule | jadwal | hapus | reset | navigasi | info | sapaan | analisis
UI_Action: navigate_dashboard | navigate_devices | navigate_sensors | navigate_automation | navigate_settings | refresh | none`;

  const result = await callAI(apiKey, {
    model: AI_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
    temperature: 0.1,
    max_tokens: AI_MAX_TOKENS,
  });

  if (!result.ok) {
    const errMsg = "Koneksi AI sibuk, coba lagi ya! 🔄";
    await saveMessage(userId, "bot", errMsg, platform);
    return NextResponse.json({ success: false, error: errMsg });
  }

  // Parse JSON from AI response
  let raw = (result.content || "").trim();
  raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/, "");

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = raw.match(/({[\s\S]*})/);
    if (match) {
      try {
        parsed = JSON.parse(match[1]);
      } catch {}
    }
  }

  if (!parsed) {
    const errMsg = "Gagal memproses jawaban AI. Coba lagi ya 😊";
    await saveMessage(userId, "bot", errMsg, platform);
    return NextResponse.json({ success: false, error: errMsg });
  }

  // Normalize
  parsed.response_text = parsed.response_text || "Siap! Perintah diproses.";
  parsed.intent = parsed.intent || "info";
  parsed.ui_action = parsed.ui_action || "none";
  parsed.actions = parsed.actions || [];

  // Save bot response
  await saveMessage(userId, "bot", parsed.response_text, platform);

  // Execute actions
  const execution = await executeActions(userId, parsed.actions);

  return NextResponse.json({
    success: true,
    data: { ...parsed, execution },
  });
}

// GET chat history
export async function GET() {
  const user = await getSession();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const history = await prisma.aiChatHistory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return NextResponse.json({ success: true, history });
}

// DELETE chat history
export async function DELETE() {
  const user = await getSession();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.aiChatHistory.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ success: true });
}
