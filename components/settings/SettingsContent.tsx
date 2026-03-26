"use client";

import { useState } from "react";
import type { UserSettings, MqttTemplate } from "@/types";

interface Props {
  user: { username: string; email: string | null; fullName: string | null };
  settings: (Omit<UserSettings, "quickControlDevices">) | null;
  templates: MqttTemplate[];
}

type Tab = "profile" | "mqtt" | "telegram" | "automation" | "cv" | "security" | "about";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "profile", label: "Profil", icon: "fa-user" },
  { key: "mqtt", label: "MQTT", icon: "fa-cloud" },
  { key: "telegram", label: "Telegram", icon: "fa-paper-plane" },
  { key: "automation", label: "Otomasi", icon: "fa-robot" },
  { key: "cv", label: "CV", icon: "fa-eye" },
  { key: "security", label: "Keamanan", icon: "fa-shield" },
  { key: "about", label: "Tentang", icon: "fa-info-circle" },
];

export default function SettingsContent({ user, settings, templates }: Props) {
  const [tab, setTab] = useState<Tab>("profile");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Form states
  const [profile, setProfile] = useState({
    fullName: user.fullName || "",
    email: user.email || "",
  });
  const [mqtt, setMqtt] = useState({
    broker: settings?.mqttBroker || "",
    port: settings?.mqttPort || 8884,
    ssl: settings?.mqttUseSsl ?? true,
    username: settings?.mqttUsername || "",
    path: settings?.mqttPath || "/mqtt",
  });
  const [tg, setTg] = useState({
    chatId: settings?.telegramChatId || "",
  });
  const [auto, setAuto] = useState({
    lamp: settings?.automationLamp ?? true,
    fan: settings?.automationFan ?? true,
    lock: settings?.automationLock ?? true,
    lampOn: settings?.lampOnThreshold ?? 0.3,
    lampOff: settings?.lampOffThreshold ?? 0.7,
    fanHigh: settings?.fanTempHigh ?? 30,
    fanNormal: settings?.fanTempNormal ?? 25,
    lockDelay: settings?.lockDelay ?? 5000,
  });
  const [cv, setCv] = useState({
    confidence: settings?.cvMinConfidence ?? 0.5,
    dark: settings?.cvDarkThreshold ?? 0.3,
    bright: settings?.cvBrightThreshold ?? 0.7,
    human: settings?.cvHumanRulesEnabled ?? true,
    light: settings?.cvLightRulesEnabled ?? true,
  });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

  async function save(data: Record<string, any>) {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setMsg("✅ Pengaturan disimpan!");
        setTimeout(() => setMsg(""), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (passwords.new !== passwords.confirm) {
      setMsg("❌ Password baru tidak cocok");
      return;
    }
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(passwords),
    });
    if (res.ok) {
      setMsg("✅ Password berhasil diubah!");
      setPasswords({ current: "", new: "", confirm: "" });
    } else {
      const data = await res.json();
      setMsg(`❌ ${data.error || "Gagal"}`);
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-extrabold text-heading">Pengaturan</h1>
        <p className="text-sm text-txt-secondary mt-1">Kelola konfigurasi sistem.</p>
      </div>

      {msg && (
        <div className={`px-4 py-2.5 rounded-xl text-sm ${msg.startsWith("✅") ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
          {msg}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
              tab === t.key ? "bg-accent/20 text-accent" : "text-txt-muted hover:bg-surface"
            }`}
          >
            <i className={`fas ${t.icon} text-xs`}></i>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="card p-6">
        {/* Profile */}
        {tab === "profile" && (
          <div className="space-y-4 max-w-md">
            <div>
              <label className="text-xs text-txt-muted block mb-1">Username</label>
              <input disabled value={user.username} className="w-full px-4 py-2.5 rounded-xl bg-surface/50 border border-border text-sm opacity-60" />
            </div>
            <div>
              <label className="text-xs text-txt-muted block mb-1">Nama Lengkap</label>
              <input value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-xs text-txt-muted block mb-1">Email</label>
              <input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-accent" />
            </div>
            <button onClick={() => save({ full_name: profile.fullName, email: profile.email })} disabled={saving} className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/80 transition disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan Profil"}
            </button>
          </div>
        )}

        {/* MQTT */}
        {tab === "mqtt" && (
          <div className="space-y-4 max-w-md">
            <div>
              <label className="text-xs text-txt-muted block mb-1">Broker</label>
              <input value={mqtt.broker} onChange={(e) => setMqtt({ ...mqtt, broker: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-accent" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-txt-muted block mb-1">Port</label>
                <input type="number" value={mqtt.port} onChange={(e) => setMqtt({ ...mqtt, port: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-xs text-txt-muted block mb-1">SSL</label>
                <button onClick={() => setMqtt({ ...mqtt, ssl: !mqtt.ssl })} className={`w-full py-2.5 rounded-xl text-sm font-medium transition ${mqtt.ssl ? "bg-accent/20 text-accent" : "bg-surface border border-border text-txt-muted"}`}>
                  {mqtt.ssl ? "Aktif" : "Nonaktif"}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-txt-muted block mb-1">Username</label>
              <input value={mqtt.username} onChange={(e) => setMqtt({ ...mqtt, username: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-xs text-txt-muted block mb-1">Path</label>
              <input value={mqtt.path} onChange={(e) => setMqtt({ ...mqtt, path: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-accent" />
            </div>
            <button onClick={() => save({ mqtt_broker: mqtt.broker, mqtt_port: mqtt.port, mqtt_use_ssl: mqtt.ssl, mqtt_username: mqtt.username, mqtt_path: mqtt.path })} disabled={saving} className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/80 transition disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan MQTT"}
            </button>
          </div>
        )}

        {/* Telegram */}
        {tab === "telegram" && (
          <div className="space-y-4 max-w-md">
            <div>
              <label className="text-xs text-txt-muted block mb-1">Chat ID</label>
              <input value={tg.chatId} onChange={(e) => setTg({ chatId: e.target.value })} placeholder="Masukkan Chat ID Telegram" className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-accent" />
            </div>
            <p className="text-[11px] text-txt-muted">Dapatkan Chat ID dengan mengirim /start ke bot Anda.</p>
            <button onClick={() => save({ telegram_chat_id: tg.chatId })} disabled={saving} className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/80 transition disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan Telegram"}
            </button>
          </div>
        )}

        {/* Automation */}
        {tab === "automation" && (
          <div className="space-y-4 max-w-md">
            {[
              { key: "lamp", label: "Otomasi Lampu", field: "lamp", onField: "lampOn", offField: "lampOff", onLabel: "Nyala ≤", offLabel: "Mati ≥" },
              { key: "fan", label: "Otomasi Kipas", field: "fan", onField: "fanHigh", offField: "fanNormal", onLabel: "Panas >", offField2: "fanNormal", offLabel2: "Normal ≤" },
              { key: "lock", label: "Otomasi Kunci", field: "lock", delayField: "lockDelay", delayLabel: "Delay (ms)" },
            ].map((item: any) => (
              <div key={item.key} className="p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">{item.label}</span>
                  <button
                    onClick={() => setAuto({ ...auto, [item.field]: !(auto as any)[item.field] })}
                    className={`w-10 h-6 rounded-full transition ${(auto as any)[item.field] ? "bg-accent" : "bg-txt-muted/20"}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${(auto as any)[item.field] ? "translate-x-5" : "translate-x-1"}`}></div>
                  </button>
                </div>
                {item.onField && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-txt-muted">{item.onLabel}</span>
                      <input type="number" step="0.1" value={(auto as any)[item.onField]} onChange={(e) => setAuto({ ...auto, [item.onField]: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 rounded-lg bg-bg border border-border text-sm" />
                    </div>
                    <div>
                      <span className="text-txt-muted">{item.offLabel || item.offLabel2 || "Off"}</span>
                      <input type="number" step="0.1" value={(auto as any)[item.offField || item.offField2]} onChange={(e) => setAuto({ ...auto, [item.offField || item.offField2]: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 rounded-lg bg-bg border border-border text-sm" />
                    </div>
                  </div>
                )}
                {item.delayField && (
                  <div className="text-xs">
                    <span className="text-txt-muted">{item.delayLabel}</span>
                    <input type="number" value={(auto as any)[item.delayField]} onChange={(e) => setAuto({ ...auto, [item.delayField]: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 rounded-lg bg-bg border border-border text-sm" />
                  </div>
                )}
              </div>
            ))}
            <button onClick={() => save({ automation_lamp: auto.lamp, automation_fan: auto.fan, automation_lock: auto.lock, lamp_on_threshold: auto.lampOn, lamp_off_threshold: auto.lampOff, fan_temp_high: auto.fanHigh, fan_temp_normal: auto.fanNormal, lock_delay: auto.lockDelay })} disabled={saving} className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/80 transition disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan Otomasi"}
            </button>
          </div>
        )}

        {/* CV */}
        {tab === "cv" && (
          <div className="space-y-4 max-w-md">
            <div>
              <label className="text-xs text-txt-muted block mb-1">Min Confidence ({Math.round(cv.confidence * 100)}%)</label>
              <input type="range" min="0" max="100" value={cv.confidence * 100} onChange={(e) => setCv({ ...cv, confidence: Number(e.target.value) / 100 })} className="w-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-txt-muted block mb-1">Ambang Gelap</label>
                <input type="number" step="0.1" value={cv.dark} onChange={(e) => setCv({ ...cv, dark: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm" />
              </div>
              <div>
                <label className="text-xs text-txt-muted block mb-1">Ambang Terang</label>
                <input type="number" step="0.1" value={cv.bright} onChange={(e) => setCv({ ...cv, bright: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm" />
              </div>
            </div>
            <div className="flex gap-4">
              {[
                { key: "human", label: "Deteksi Orang" },
                { key: "light", label: "Analisis Cahaya" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setCv({ ...cv, [item.key]: !(cv as any)[item.key] })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${(cv as any)[item.key] ? "bg-accent/20 text-accent" : "bg-surface border border-border text-txt-muted"}`}
                >
                  {item.label}: {(cv as any)[item.key] ? "ON" : "OFF"}
                </button>
              ))}
            </div>
            <button onClick={() => save({ cv_min_confidence: cv.confidence, cv_dark_threshold: cv.dark, cv_bright_threshold: cv.bright, cv_human_rules_enabled: cv.human, cv_light_rules_enabled: cv.light })} disabled={saving} className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/80 transition disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan CV"}
            </button>
          </div>
        )}

        {/* Security */}
        {tab === "security" && (
          <div className="space-y-4 max-w-md">
            <h3 className="text-sm font-semibold">Ubah Password</h3>
            <input type="password" placeholder="Password saat ini" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-accent" />
            <input type="password" placeholder="Password baru (min 8 karakter)" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-accent" />
            <input type="password" placeholder="Konfirmasi password baru" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-accent" />
            <button onClick={changePassword} className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/80 transition">
              Ubah Password
            </button>
          </div>
        )}

        {/* About */}
        {tab === "about" && (
          <div className="space-y-4 max-w-md text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white text-2xl">
              <i className="fas fa-bolt"></i>
            </div>
            <h2 className="text-xl font-extrabold">IoTzy v3.0.0</h2>
            <p className="text-sm text-txt-muted">Smart Home Dashboard — Next.js Edition</p>
            <div className="text-[11px] text-txt-muted space-y-1">
              <p>Next.js 14 + TypeScript + Tailwind CSS</p>
              <p>Prisma ORM + MySQL (Aiven)</p>
              <p>MQTT + TensorFlow.js CV + AI Chat</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
