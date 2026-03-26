import { type NextRequest, NextResponse } from "next/server";

// ─── API Response Helpers ───
export function jsonSuccess(data: unknown, status = 200) {
  return NextResponse.json({ success: true, ...normalizeData(data) }, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function normalizeData(data: unknown) {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    if ("success" in (data as Record<string, unknown>)) return data;
    return { data };
  }
  return { data };
}

// ─── Input Helpers ───
export function sanitize(str: string, maxLen = 255): string {
  return str.trim().slice(0, maxLen);
}

export function parseBody(req: NextRequest) {
  return req.json().catch(() => ({}));
}

// ─── Encryption (AES-256-CBC) ───
import { createCipheriv, createDecipheriv, randomBytes, hkdfSync } from "crypto";

export function encryptSecret(plainText: string): string | null {
  if (!plainText.trim()) return null;
  const keyBuf = hkdfSync("sha256", process.env.APP_SECRET || "dev_secret", Buffer.from("iotzy-salt"), "iotzy-encryption", 32);
  const key = Buffer.from(keyBuf);
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  return Buffer.concat([iv, encrypted]).toString("base64");
}

export function decryptSecret(cipherText: string): string {
  const raw = Buffer.from(cipherText, "base64");
  if (raw.length <= 16) return "";
  const keyBuf = hkdfSync("sha256", process.env.APP_SECRET || "dev_secret", Buffer.from("iotzy-salt"), "iotzy-encryption", 32);
  const key = Buffer.from(keyBuf);
  const iv = raw.subarray(0, 16);
  const encrypted = raw.subarray(16);
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  return decipher.update(encrypted) + decipher.final("utf8");
}

// ─── Date Helpers ───
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("id-ID", { hour12: false });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
