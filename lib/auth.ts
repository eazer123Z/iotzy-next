import { cookies } from "next/headers";
import { prisma } from "./db";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

// ─── Types ───
export interface SessionUser {
  id: number;
  username: string;
  email: string | null;
  fullName: string | null;
  role: string;
  theme: string;
}

// ─── Session Management ───
export async function createSession(userId: number): Promise<string> {
  const token = nanoid(64);
  const expiresAt = new Date(Date.now() + 86400 * 1000); // 24h

  // Clean old sessions
  await prisma.session.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  });

  await prisma.session.create({
    data: {
      userId,
      sessionToken: token,
      expiresAt,
    },
  });

  // Update last login
  await prisma.user.update({
    where: { id: userId },
    data: { lastLogin: new Date() },
  });

  // Ensure user_settings exists
  await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      mqttBroker: process.env.MQTT_HOST || "broker.hivemq.com",
      mqttPort: parseInt(process.env.MQTT_PORT || "8884"),
      mqttUseSsl: process.env.MQTT_USE_SSL === "true",
    },
    update: {},
  });

  cookies().set("iotzy_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 86400,
    path: "/",
  });

  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const token = cookies().get("iotzy_session")?.value;
    if (!token) return null;

    const session = await prisma.session.findUnique({
      where: { sessionToken: token, expiresAt: { gt: new Date() } },
      include: {
        user: {
          include: { settings: { select: { theme: true } } },
        },
      },
    });

    if (!session) {
      cookies().delete("iotzy_session");
      return null;
    }

    return {
      id: session.user.id,
      username: session.user.username,
      email: session.user.email,
      fullName: session.user.fullName,
      role: session.user.role,
      theme: session.user.settings?.theme || "dark",
    };
  } catch (err) {
    console.error("getSession error:", err);
    // DB unreachable — don't redirect, let caller handle gracefully
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const token = cookies().get("iotzy_session")?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { sessionToken: token } });
  }
  cookies().delete("iotzy_session");
}

// ─── Auth Actions ───
export async function loginUser(
  login: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: login }, { email: login }],
      isActive: true,
    },
  });

  if (!user) return { success: false, error: "Username atau password salah." };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { success: false, error: "Username atau password salah." };

  await createSession(user.id);
  return { success: true };
}

export async function registerUser(
  username: string,
  email: string,
  password: string,
  fullName?: string
): Promise<{ success: boolean; error?: string }> {
  if (username.length < 3 || username.length > 50)
    return { success: false, error: "Username harus 3-50 karakter." };
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    return { success: false, error: "Username hanya huruf, angka, underscore." };
  if (!email.includes("@"))
    return { success: false, error: "Format email tidak valid." };
  if (password.length < 8)
    return { success: false, error: "Password minimal 8 karakter." };

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    return {
      success: false,
      error:
        existing.username === username
          ? "Username sudah digunakan."
          : "Email sudah terdaftar.",
    };
  }

  const hash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { username, email, passwordHash: hash, fullName: fullName || username },
  });

  return { success: true };
}

// ─── CSRF (simplified for SPA) ───
export function generateCsrfToken(): string {
  return nanoid(32);
}
