"use client";

import { useState } from "react";
import clsx from "clsx";
import type { UserSettings, MqttTemplate } from "@/types";

interface Props {
  user: { username: string; email: string | null; fullName: string | null };
  settings: (Omit<UserSettings, "quickControlDevices">) | null;
  templates: MqttTemplate[];
}

type Tab = "profile" | "mqtt" | "telegram" | "automation" | "cv" | "security" | "about";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "profile", label: "Identity", icon: "fa-id-card" },
  { key: "mqtt", label: "Neural Link", icon: "fa-network-wired" },
  { key: "telegram", label: "Comms Hub", icon: "fa-satellite-dish" },
  { key: "automation", label: "Logic", icon: "fa-microchip" },
  { key: "cv", label: "Vision", icon: "fa-eye" },
  { key: "security", label: "Firewall", icon: "fa-shield-halved" },
  { key: "about", label: "System Info", icon: "fa-circle-info" },
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
        setMsg("✅ SECTOR_UPDATED: Protocols synced successfully");
        setTimeout(() => setMsg(""), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (passwords.new !== passwords.confirm) {
      setMsg("❌ ERROR: Password mismatch");
      return;
    }
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(passwords),
    });
    if (res.ok) {
      setMsg("✅ AUTH_RESET: Credentials updated");
      setPasswords({ current: "", new: "", confirm: "" });
    } else {
      const data = await res.json();
      setMsg(`❌ FATAL: ${data.error || "Execution failed"}`);
    }
  }

  const InputLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="text-[10px] font-black uppercase tracking-[2px] text-text-muted mb-2 px-1 block">{children}</label>
  );

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1600px] mx-auto pb-12">
      {/* ── Page Header ── */}
      <div className="px-2">
         <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_var(--accent)]" />
            <span className="text-[10px] font-black uppercase tracking-[3px] text-accent opacity-70">Configuration</span>
         </div>
         <h2 className="text-3xl font-black text-heading tracking-tight">Main <span className="text-text-muted opacity-30">Command Center</span></h2>
         <p className="text-sm text-text-secondary font-medium opacity-60">Global system parameters and security protocols.</p>
      </div>

      {msg && (
        <div className={clsx(
          "mx-2 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border animate-slideDown",
          msg.startsWith("✅") ? "bg-success/10 border-success/30 text-success" : "bg-danger/10 border-danger/30 text-danger"
        )}>
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ── Navigation Sidebar ── */}
        <div className="lg:col-span-3 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 px-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={clsx(
                "group flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border text-left",
                tab === t.key 
                  ? "bg-accent text-bg border-accent shadow-[0_0_20px_var(--accent-glow)] scale-105" 
                  : "bg-surface/50 border-border/40 text-text-muted hover:text-heading hover:border-accent/30"
              )}
            >
              <i className={clsx("fas", t.icon, "text-xs", tab === t.key ? "text-bg" : "text-text-muted group-hover:text-accent")}></i>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Configuration Panes ── */}
        <div className="lg:col-span-9 rounded-[40px] bg-surface/30 border border-border/40 backdrop-blur-[var(--glass-blur)] overflow-hidden shadow-2xl p-8 lg:p-12 relative min-h-[600px]">
           <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[120px] rounded-full -mr-32 -mt-32 pointer-events-none" />
           
           <div className="max-w-xl relative z-10 animate-fadeIn">
              
              {/* Identity Section */}
              {tab === "profile" && (
                <div className="space-y-8">
                  <div className="space-y-6">
                    <div>
                      <InputLabel>Biological Signature (Username)</InputLabel>
                      <input disabled value={user.username} className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-border/20 text-sm font-mono opacity-50 cursor-not-allowed" />
                    </div>
                    <div>
                      <InputLabel>Full Designation</InputLabel>
                      <input value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-surface/50 border border-border/40 text-sm font-bold focus:outline-none focus:border-accent/50 transition-all" />
                    </div>
                    <div>
                      <InputLabel>Neural Relay Address (Email)</InputLabel>
                      <input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-surface/50 border border-border/40 text-sm font-bold focus:outline-none focus:border-accent/50 transition-all" />
                    </div>
                  </div>
                  <button 
                    onClick={() => save({ full_name: profile.fullName, email: profile.email })} 
                    disabled={saving} 
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent to-accent-light text-bg font-black text-[10px] uppercase tracking-widest shadow-[0_0_15px_var(--accent-glow)] hover:scale-[1.02] transition-all disabled:opacity-50"
                  >
                    {saving ? "SYNCING..." : "COMMIT IDENTITY"}
                  </button>
                </div>
              )}

              {/* Neural Link Section (MQTT) */}
              {tab === "mqtt" && (
                <div className="space-y-8">
                  <div className="space-y-6">
                    <div>
                      <InputLabel>Broker Endpoint</InputLabel>
                      <input value={mqtt.broker} onChange={(e) => setMqtt({ ...mqtt, broker: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-surface/50 border border-border/40 text-sm font-mono focus:outline-none focus:border-accent/50 transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <InputLabel>Frequency (Port)</InputLabel>
                        <input type="number" value={mqtt.port} onChange={(e) => setMqtt({ ...mqtt, port: Number(e.target.value) })} className="w-full px-6 py-4 rounded-2xl bg-black/20 border border-border/40 text-sm font-mono focus:outline-none focus:border-accent/50 transition-all" />
                      </div>
                      <div>
                        <InputLabel>Secure Protocol (SSL)</InputLabel>
                        <button onClick={() => setMqtt({ ...mqtt, ssl: !mqtt.ssl })} className={clsx("w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border", mqtt.ssl ? "bg-accent/10 border-accent/40 text-accent" : "bg-black/20 border-border/40 text-text-muted opacity-60")}>
                          {mqtt.ssl ? "ENCRYPTED" : "PLAINTEXT"}
                        </button>
                      </div>
                    </div>
                    <div>
                      <InputLabel>Access Username</InputLabel>
                      <input value={mqtt.username} onChange={(e) => setMqtt({ ...mqtt, username: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-surface/50 border border-border/40 text-sm font-mono focus:outline-none focus:border-accent/50 transition-all" />
                    </div>
                    <div>
                      <InputLabel>Node Path</InputLabel>
                      <input value={mqtt.path} onChange={(e) => setMqtt({ ...mqtt, path: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-surface/50 border border-border/40 text-sm font-mono focus:outline-none focus:border-accent/50 transition-all" />
                    </div>
                  </div>
                  <button onClick={() => save({ mqtt_broker: mqtt.broker, mqtt_port: mqtt.port, mqtt_use_ssl: mqtt.ssl, mqtt_username: mqtt.username, mqtt_path: mqtt.path })} disabled={saving} className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent to-accent-light text-bg font-black text-[10px] uppercase tracking-widest shadow-[0_0_15px_var(--accent-glow)] hover:scale-[1.02] transition-all disabled:opacity-50">
                    {saving ? "RECONNECTING..." : "CALIBRATE NEURAL LINK"}
                  </button>
                </div>
              )}

              {/* Comms Hub Section (Telegram) */}
              {tab === "telegram" && (
                <div className="space-y-8">
                  <div className="p-8 rounded-[32px] bg-sky-500/5 border border-sky-500/20 mb-8">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center text-xl border border-sky-500/20">
                          <i className="fab fa-telegram"></i>
                       </div>
                       <h4 className="text-lg font-black text-heading uppercase tracking-tight">Active Relay</h4>
                    </div>
                    <p className="text-sm font-medium text-text-secondary opacity-70 leading-relaxed italic border-l-2 border-sky-500/40 pl-4">
                       "Enable cross-platform commands and real-time alerts directly through the secure Telegram bot interface."
                    </p>
                  </div>
                  <div>
                    <InputLabel>Relay Address (Chat ID)</InputLabel>
                    <input value={tg.chatId} onChange={(e) => setTg({ chatId: e.target.value })} placeholder="Enter unique ID..." className="w-full px-6 py-4 rounded-2xl bg-surface/50 border border-border/40 text-sm font-mono focus:outline-none focus:border-accent/50 transition-all font-bold" />
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[1px] mt-4 opacity-40">:: TRANSMIT /START TO BOT TO CAPTURE IDENTITY SIG.</p>
                  </div>
                  <button onClick={() => save({ telegram_chat_id: tg.chatId })} disabled={saving} className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent to-accent-light text-bg font-black text-[10px] uppercase tracking-widest shadow-[0_0_15px_var(--accent-glow)] hover:scale-[1.02] transition-all disabled:opacity-50">
                    {saving ? "ESTABLISHING..." : "ARM COMMS RELAY"}
                  </button>
                </div>
              )}

              {/* Logic Section (Automation) */}
              {tab === "automation" && (
                <div className="space-y-6">
                  {[
                    { key: "lamp", label: "Optical Automation", field: "lamp", onField: "lampOn", offField: "lampOff", onLabel: "LUMEN <", offLabel: "LUMEN >" },
                    { key: "fan", label: "Thermal Regulation", field: "fan", onField: "fanHigh", offField: "fanNormal", onLabel: "TEMP >", offLabel2: "fanNormal", offLabel: "TEMP <" },
                    { key: "lock", label: "Security Interlock", field: "lock", delayField: "lockDelay", delayLabel: "DELAY (MS)" },
                  ].map((item: any) => (
                    <div key={item.key} className="p-6 rounded-3xl bg-black/20 border border-border/30 group hover:border-accent/20 transition-all">
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-xs font-black uppercase tracking-widest text-heading">{item.label}</span>
                        <button
                          onClick={() => setAuto({ ...auto, [item.field]: !(auto as any)[item.field] })}
                          className={clsx(
                            "w-12 h-6 rounded-full transition-all relative flex items-center",
                            (auto as any)[item.field] ? "bg-accent shadow-[0_0_10px_var(--accent-glow)]" : "bg-white/10"
                          )}
                        >
                          <div className={clsx("w-4 h-4 rounded-full bg-white transition-all", (auto as any)[item.field] ? "translate-x-7" : "translate-x-1")}></div>
                        </button>
                      </div>
                      
                      {item.onField && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest px-1">{item.onLabel}</span>
                            <input type="number" step="0.1" value={(auto as any)[item.onField]} onChange={(e) => setAuto({ ...auto, [item.onField]: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl bg-black/40 border border-border/40 text-sm font-mono font-bold" />
                          </div>
                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest px-1">{item.offLabel}</span>
                            <input type="number" step="0.1" value={(auto as any)[item.offField || item.offField2]} onChange={(e) => setAuto({ ...auto, [item.offField || item.offField2]: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl bg-black/40 border border-border/40 text-sm font-mono font-bold" />
                          </div>
                        </div>
                      )}
                      
                      {item.delayField && (
                        <div className="space-y-2">
                          <span className="text-[9px] font-black text-text-muted uppercase tracking-widest px-1">{item.delayLabel}</span>
                          <input type="number" value={(auto as any)[item.delayField]} onChange={(e) => setAuto({ ...auto, [item.delayField]: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl bg-black/40 border border-border/40 text-sm font-mono font-bold" />
                        </div>
                      )}
                    </div>
                  ))}
                  <button onClick={() => save({ automation_lamp: auto.lamp, automation_fan: auto.fan, automation_lock: auto.lock, lamp_on_threshold: auto.lampOn, lamp_off_threshold: auto.lampOff, fan_temp_high: auto.fanHigh, fan_temp_normal: auto.fanNormal, lock_delay: auto.lockDelay })} disabled={saving} className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent to-accent-light text-bg font-black text-[10px] uppercase tracking-widest shadow-[0_0_15px_var(--accent-glow)] hover:scale-[1.02] transition-all disabled:opacity-50 mt-4">
                    {saving ? "COMPILING..." : "REPROGRAM LOGIC"}
                  </button>
                </div>
              )}

              {/* Vision Section (CV) */}
              {tab === "cv" && (
                <div className="space-y-8">
                  <div className="space-y-8">
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <InputLabel>Neural Confidence Level</InputLabel>
                          <span className="text-xs font-mono font-black text-accent">{Math.round(cv.confidence * 100)}%</span>
                       </div>
                       <input type="range" min="0" max="100" value={cv.confidence * 100} onChange={(e) => setCv({ ...cv, confidence: Number(e.target.value) / 100 })} className="w-full h-1.5 bg-black/40 rounded-full appearance-none cursor-pointer accent-accent" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <InputLabel>Lumen Floor</InputLabel>
                        <input type="number" step="0.1" value={cv.dark} onChange={(e) => setCv({ ...cv, dark: Number(e.target.value) })} className="w-full px-6 py-4 rounded-2xl bg-surface/50 border border-border/40 text-sm font-mono font-bold" />
                      </div>
                      <div>
                        <InputLabel>Lumen Ceiling</InputLabel>
                        <input type="number" step="0.1" value={cv.bright} onChange={(e) => setCv({ ...cv, bright: Number(e.target.value) })} className="w-full px-6 py-4 rounded-2xl bg-surface/50 border border-border/40 text-sm font-mono font-bold" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: "human", label: "Human Detection", icon: "fa-person" },
                        { key: "light", label: "Light Context", icon: "fa-sun" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() => setCv({ ...cv, [item.key]: !(cv as any)[item.key] })}
                          className={clsx(
                            "group p-6 rounded-3xl border transition-all flex flex-col items-center gap-3",
                            (cv as any)[item.key] ? "bg-accent/10 border-accent/40 text-accent" : "bg-black/20 border-border/40 text-text-muted opacity-60"
                          )}
                        >
                          <i className={clsx("fas", item.icon, "text-xl", (cv as any)[item.key] ? "text-accent" : "text-text-muted")}></i>
                          <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => save({ cv_min_confidence: cv.confidence, cv_dark_threshold: cv.dark, cv_bright_threshold: cv.bright, cv_human_rules_enabled: cv.human, cv_light_rules_enabled: cv.light })} disabled={saving} className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent to-accent-light text-bg font-black text-[10px] uppercase tracking-widest shadow-[0_0_15px_var(--accent-glow)] hover:scale-[1.02] transition-all disabled:opacity-50">
                    {saving ? "SYNCING OPTICS..." : "COMMIT VISION PROTOCOLS"}
                  </button>
                </div>
              )}

              {/* Security Section (Change Password) */}
              {tab === "security" && (
                <div className="space-y-8">
                  <div className="p-8 rounded-[32px] bg-danger/5 border border-danger/20 mb-8">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center text-xl border border-danger/20">
                          <i className="fas fa-fingerprint"></i>
                       </div>
                       <h4 className="text-lg font-black text-heading uppercase tracking-tight">Access Control</h4>
                    </div>
                    <p className="text-[10px] font-black text-danger/60 uppercase tracking-widest">:: WARNING: CHANGING CREDENTIALS WILL DISCONNECT ALL ACTIVE SESSIONS.</p>
                  </div>
                  <div className="space-y-6">
                    <input type="password" placeholder="CURRENT CREDENTIALS" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-surface/50 border border-border/40 text-sm focus:outline-none focus:border-accent/50 transition-all font-mono" />
                    <input type="password" placeholder="NEW AUTH KEY (MIN 8)" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-surface/50 border border-border/40 text-sm focus:outline-none focus:border-accent/50 transition-all font-mono" />
                    <input type="password" placeholder="CONFIRM NEW KEY" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-surface/50 border border-border/40 text-sm focus:outline-none focus:border-accent/50 transition-all font-mono" />
                  </div>
                  <button onClick={changePassword} className="w-full py-4 rounded-2xl bg-danger text-white font-black text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(255,59,48,0.2)] hover:bg-danger-light transition-all">
                    OVERWRITE AUTH PROTOCOL
                  </button>
                </div>
              )}

              {/* About Section */}
              {tab === "about" && (
                <div className="flex flex-col items-center text-center py-12 space-y-12">
                  <div className="relative">
                    <div className="absolute inset-0 bg-accent/20 blur-[40px] rounded-full animate-pulse" />
                    <div className="w-32 h-32 relative z-10 rounded-[48px] bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-bg text-5xl shadow-2xl rotate-12 group-hover:rotate-0 transition-transform duration-700">
                      <i className="fas fa-atom"></i>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-4xl font-black text-heading tracking-[2px]">IoTzy <span className="text-text-muted opacity-30">Ultra</span></h2>
                    <div className="px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-[9px] font-black text-accent uppercase tracking-[4px]">Version 3.2.0-NEBULA</div>
                    <p className="text-sm font-medium text-text-secondary opacity-60">High-Performance Neural Control Core</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full">
                    {[
                      { label: "Kernel", val: "Next.js 14-TS" },
                      { label: "Database", val: "Aiven Cloud" },
                      { label: "Protocol", val: "MQTT v5.0" },
                      { label: "Engine", val: "TensorFlow.js" },
                    ].map(st => (
                      <div key={st.label} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="text-[8px] font-black text-text-muted uppercase tracking-[3px] mb-1">{st.label}</div>
                        <div className="text-[10px] font-black text-heading uppercase tracking-widest">{st.val}</div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[9px] font-black text-text-muted/30 uppercase tracking-[2px] pt-8">
                    MANUFACTURED BY DEEPMIND AGENTIC SYSTEMS :: (C) 2026
                  </p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
