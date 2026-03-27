import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// This endpoint is called by Telegram webhook
export async function POST(req: Request) {
  // Verify webhook token
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const secret = process.env.APP_SECRET;

  if (!secret || token !== secret) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const update = await req.json();

  if (!update?.message?.text) {
    return NextResponse.json({ ok: true });
  }

  const chatId = String(update.message.chat.id);
  const text = update.message.text.trim();

  try {
    // Find user by telegram chat ID
    const settings = await prisma.userSettings.findFirst({
      where: { telegramChatId: chatId },
      select: {
        userId: true,
        telegramBotToken: true,
      },
    });

    const botToken =
      settings?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;

    // No user found — send setup instructions
    if (!settings) {
      if (text.startsWith("/start")) {
        await sendTelegram(
          botToken!,
          chatId,
          `🤖 <b>Selamat Datang di IoTzy!</b>\n\nChat ID Anda: <code>${chatId}</code>\n\nUntuk menghubungkan:\n1. Salin Chat ID di atas\n2. Buka Dashboard → Pengaturan → Telegram\n3. Tempel Chat ID dan simpan`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // Typing indicator
    await sendTelegramAction(botToken!, chatId, "typing");

    // Commands
    if (text.startsWith("/start")) {
      await sendTelegram(
        botToken!,
        chatId,
        "✅ Akun terhubung! Ada yang bisa saya bantu?"
      );
      return NextResponse.json({ ok: true });
    }

    if (text === "/ping") {
      await sendTelegram(
        botToken!,
        chatId,
        `🏓 Pong! (${new Date().toLocaleTimeString("id-ID")})`
      );
      return NextResponse.json({ ok: true });
    }

    // Forward to AI chat
    const baseUrl =
      process.env.APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

    if (!baseUrl) {
      console.error("APP_URL or VERCEL_URL not set");
      await sendTelegram(botToken!, chatId, "⚠️ Server configuration error");
      return NextResponse.json({ ok: true });
    }

    const chatApiUrl = `${baseUrl}/api/chat`;
    const res = await fetch(chatApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Use server-side auth bypass for telegram webhook
        "X-Telegram-Webhook": "true",
        "X-User-Id": String(settings.userId),
      },
      body: JSON.stringify({
        message: text,
        platform: "telegram",
      }),
    });

    const data = await res.json();

    if (data.success) {
      const responseText = data.data?.response_text || "Perintah diproses.";
      await sendTelegram(botToken!, chatId, responseText);

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: settings.userId,
          deviceName: "Telegram Bot",
          activity: `Cmd: ${text.substring(0, 100)}`,
          triggerType: "AI",
          logType: "info",
        },
      });
    } else {
      await sendTelegram(
        botToken!,
        chatId,
        `❌ ${data.error || "Gagal memproses"}`
      );
    }
  } catch (e: any) {
    console.error("Telegram webhook error:", e.message);
  }

  return NextResponse.json({ ok: true });
}

// ─── Telegram helpers ───
async function sendTelegram(botToken: string, chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
}

async function sendTelegramAction(
  botToken: string,
  chatId: string,
  action: string
) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      action,
    }),
  });
}
