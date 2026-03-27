import { z } from "zod";

// ─── Settings Validator ───
export const SettingsUpdateSchema = z.object({
  mqtt_broker: z.string().trim().optional(),
  mqtt_port: z.number().int().min(1).max(65535).optional(),
  mqtt_path: z.string().trim().optional(),
  mqtt_client_id: z.string().trim().optional(),
  mqtt_username: z.string().trim().optional(),
  mqtt_use_ssl: z.boolean().optional(),
  telegram_chat_id: z.string().trim().optional(),
  telegram_bot_token: z.string().trim().optional(),
  automation_lamp: z.boolean().optional(),
  automation_fan: z.boolean().optional(),
  automation_lock: z.boolean().optional(),
  lamp_on_threshold: z.number().min(0).max(1).optional(),
  lamp_off_threshold: z.number().min(0).max(1).optional(),
  fan_temp_high: z.number().min(-50).max(100).optional(),
  fan_temp_normal: z.number().min(-50).max(100).optional(),
  lock_delay: z.number().int().min(1000).max(60000).optional(),
  theme: z.enum(["light", "dark"]).optional(),
  quick_control_devices: z.array(z.number().int().positive()).optional(),
  cv_min_confidence: z.number().min(0).max(1).optional(),
  cv_dark_threshold: z.number().min(0).max(1).optional(),
  cv_bright_threshold: z.number().min(0).max(1).optional(),
}).strict("Terdapat payload yang tidak dikenali/ilegal pada request.");

// ─── Auth Validator ───
export const LoginSchema = z.object({
  login: z.string().trim().min(3),
  password: z.string().min(8),
});

export const RegisterSchema = z.object({
  username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, "Hanya huruf, angka, underscore"),
  email: z.string().trim().email("Format email salah"),
  password: z.string().min(8, "Minimal 8 Karakter"),
  fullName: z.string().trim().optional(),
});
