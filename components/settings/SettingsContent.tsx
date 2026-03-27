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
  { key: "profile", label: "My Profile", icon: "fa-user-circle" },
  { key: "mqtt", label: "Neural Bridge", icon: "fa-network-wired" },
  { key: "telegram", label: "Comms Hub", icon: "fa-paper-plane" },
  { key: "automation", label: "Automation", icon: "fa-code-branch" },
  { key: "cv", label: "Vision", icon: "fa-eye" },
  { key: "security", label: "Security", icon: "fa-shield-alt" },
  { key: "about", label: "Information", icon: "fa-info-circle" },
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
        setMsg("✅ SYNCED: Unit update successful");
        setTimeout(() => setMsg(""), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (passwords.new !== passwords.confirm) {
      setMsg("❌ ERROR: Key mismatch");
      return;
    }
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(passwords),
    });
    if (res.ok) {
      setMsg("✅ UPDATED: Auth key reset");
      setPasswords({ current: "", new: "", confirm: "" });
    } else {
      const data = await res.json();
      setMsg(`❌ ERROR: ${data.error || "Update failed"}`);
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1400px] mx-auto pb-12">
      {/* ── Header ── */}
      <div className="px-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)]" />
          <span className="text-[10px] font-black uppercase tracking-[3px] text-text-muted">Global Parameters</span>
        </div>
        <h1 className="text-3xl font-black text-heading tracking-tighter">System Settings</h1>
        <p className="text-text-secondary text-sm font-bold opacity-60">Control system protocols and identity configurations.</p>
      </div>

      {msg && (
        <div className={clsx(
          "mx-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[2px] border animate-slideDown shadow-sm flex items-center justify-between",
          msg.startsWith("✅") ? "bg-success/5 border-success/20 text-success" : "bg-danger/5 border-danger/20 text-danger"
        )}>
          <span>{msg}</span>
          <button onClick={() => setMsg("")} className="opacity-40 hover:opacity-100">
             <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start px-4">
        {/* ── Sidebar ── */}
        <div className="lg:col-span-3 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={clsx(
                "group flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap text-left",
                tab === t.key 
                  ? "bg-bg-2 text-accent shadow-sm" 
                  : "text-text-muted hover:text-heading"
              )}
            >
              <i className={clsx("fas", t.icon, "text-xs opacity-60", tab === t.key && "opacity-100")}></i>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Pane ── */}
        <div className="lg:col-span-9 card p-8 lg:p-12 min-h-[500px]">
           <div className="max-w-2xl">
              
              {tab === "profile" && (
                <div className="space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Unique Identifier</label>
                      <input disabled value={user.username} className="w-full px-6 py-4 rounded-2xl bg-bg-2 border border-border text-xs font-mono opacity-40 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Display Name</label>
                       <input value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-bg-2 border border-border focus:border-accent/40 focus:outline-none text-xs font-bold" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Alert Endpoint (Email)</label>
                       <input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-bg-2 border border-border focus:border-accent/40 focus:outline-none text-xs font-bold" />
                    </div>
                  </div>
                  <button 
                    onClick={() => save({ full_name: profile.fullName, email: profile.email })} 
                    disabled={saving} 
                    className="w-full py-4 rounded-2xl bg-accent text-bg text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-[1.02] transition-all disabled:opacity-50"
                  >
                    {saving ? "Updating..." : "Update Profile Data"}
                  </button>
                </div>
              )}

              {tab === "mqtt" && (
                <div className="space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Broker Address</label>
                       <input value={mqtt.broker} onChange={(e) => setMqtt({ ...mqtt, broker: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-bg-2 border border-border focus:border-accent/40 focus:outline-none text-xs font-mono" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Port</label>
                         <input type="number" value={mqtt.port} onChange={(e) => setMqtt({ ...mqtt, port: Number(e.target.value) })} className="w-full px-6 py-4 rounded-2xl bg-bg-2 border border-border focus:border-accent/40 focus:outline-none text-xs font-mono" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Security</label>
                         <button onClick={() => setMqtt({ ...mqtt, ssl: !mqtt.ssl })} className={clsx("w-full py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border", mqtt.ssl ? "bg-accent/5 border-accent/20 text-accent" : "bg-bg-2 border-border text-text-muted opacity-60")}>
                           {mqtt.ssl ? "SSL Encrypted" : "Plain / Non-SSL"}
                         </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Auth Subject</label>
                       <input value={mqtt.username} onChange={(e) => setMqtt({ ...mqtt, username: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-bg-2 border border-border focus:border-accent/40 focus:outline-none text-xs font-mono" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Socket Sub-Path</label>
                       <input value={mqtt.path} onChange={(e) => setMqtt({ ...mqtt, path: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-bg-2 border border-border focus:border-accent/40 focus:outline-none text-xs font-mono" />
                    </div>
                  </div>
                  <button onClick={() => save({ mqtt_broker: mqtt.broker, mqtt_port: mqtt.port, mqtt_use_ssl: mqtt.ssl, mqtt_username: mqtt.username, mqtt_path: mqtt.path })} disabled={saving} className="w-full py-4 rounded-2xl bg-accent text-bg text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-[1.02] transition-all disabled:opacity-50">
                    {saving ? "Connecting..." : "Sync Neural Bridge"}
                  </button>
                </div>
              )}

              {tab === "telegram" && (
                <div className="space-y-8">
                  <div className="card-inner p-8 border-bg-2 mb-8 bg-bg-2/30">
                     <div className="flex items-center gap-4 mb-4">
                        <i className="fab fa-telegram-plane text-2xl text-[#0088CC]"></i>
                        <h4 className="text-lg font-black text-heading uppercase tracking-tighter">Telegram Gateway</h4>
                     </div>
                     <p className="text-xs font-bold text-text-secondary opacity-70 leading-relaxed italic border-l border-border pl-4">
                        Enable real-time event notifications and secure remote command execution via encrypted mobile client.
                     </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Chat Identifier</label>
                    <input value={tg.chatId} onChange={(e) => setTg({ chatId: e.target.value })} placeholder="Ex: 582910XX" className="w-full px-6 py-4 rounded-2xl bg-bg-2 border border-border focus:border-accent/40 focus:outline-none text-xs font-mono font-bold" />
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-[1px] mt-4 opacity-40">Send /start to the official bot to retrieve your ID.</p>
                  </div>
                  <button onClick={() => save({ telegram_chat_id: tg.chatId })} disabled={saving} className="w-full py-4 rounded-2xl bg-accent text-bg text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-[1.02] transition-all disabled:opacity-50">
                    {saving ? "Establishing..." : "Arm Comms Hub"}
                  </button>
                </div>
              )}

              {tab === "automation" && (
                <div className="space-y-6">
                  {[
                    { key: "lamp", label: "Smart Lighting Logic", field: "lamp", onField: "lampOn", offField: "lampOff", onLabel: "Lumen Low <", offLabel: "Lumen High >" },
                    { key: "fan", label: "Thermal Regulation", field: "fan", onField: "fanHigh", offField: "fanNormal", onLabel: "Temp High >", offLabel: "Temp Normal <" },
                    { key: "lock", label: "Security Interlock", field: "lock", delayField: "lockDelay", delayLabel: "Auto-Lock Delay (MS)" },
                  ].map((item: any) => (
                    <div key={item.key} className="p-6 rounded-[24px] bg-bg-2/40 border border-border group hover:border-accent/20 transition-all">
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-heading">{item.label}</span>
                        <label className="toggle-wrap scale-90">
                           <input type="checkbox" checked={(auto as any)[item.field]} onChange={() => setAuto({ ...auto, [item.field]: !(auto as any)[item.field] })} />
                           <span className="toggle-slider"></span>
                        </label>
                      </div>
                      
                      {item.onField && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <span className="text-[8px] font-black text-text-muted uppercase tracking-widest ml-1">{item.onLabel}</span>
                            <input type="number" step="0.1" value={(auto as any)[item.onField]} onChange={(e) => setAuto({ ...auto, [item.onField]: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl bg-bg border border-border text-xs font-mono font-bold focus:border-accent/40 focus:outline-none" />
                          </div>
                          <div className="space-y-2">
                            <span className="text-[8px] font-black text-text-muted uppercase tracking-widest ml-1">{item.offLabel}</span>
                            <input type="number" step="0.1" value={(auto as any)[item.offField]} onChange={(e) => setAuto({ ...auto, [item.offField]: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl bg-bg border border-border text-xs font-mono font-bold focus:border-accent/40 focus:outline-none" />
                          </div>
                        </div>
                      )}
                      
                      {item.delayField && (
                        <div className="space-y-2">
                          <span className="text-[8px] font-black text-text-muted uppercase tracking-widest ml-1">{item.delayLabel}</span>
                          <input type="number" value={(auto as any)[item.delayField]} onChange={(e) => setAuto({ ...auto, [item.delayField]: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl bg-bg border border-border text-xs font-mono font-bold focus:border-accent/40 focus:outline-none" />
                        </div>
                      )}
                    </div>
                  ))}
                  <button onClick={() => save({ automation_lamp: auto.lamp, automation_fan: auto.fan, automation_lock: auto.lock, lamp_on_threshold: auto.lampOn, lamp_off_threshold: auto.lampOff, fan_temp_high: auto.fanHigh, fan_temp_normal: auto.fanNormal, lock_delay: auto.lockDelay })} disabled={saving} className="w-full py-4 rounded-2xl bg-accent text-bg text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-[1.02] transition-all disabled:opacity-50 mt-4">
                    {saving ? "Reprogramming..." : "Deploy Logic Change"}
                  </button>
                </div>
              )}

              {tab === "cv" && (
                <div className="space-y-8">
                  <div className="space-y-8">
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">AI Inference Confidence</label>
                          <span className="text-xs font-black text-accent">{Math.round(cv.confidence * 100)}%</span>
                       </div>
                       <input type="range" min="0" max="100" value={cv.confidence * 100} onChange={(e) => setCv({ ...cv, confidence: Number(e.target.value) / 100 })} className="w-full h-1.5 bg-bg-2 rounded-full appearance-none cursor-pointer accent-accent" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Lux Floor</label>
                        <input type="number" step="0.1" value={cv.dark} onChange={(e) => setCv({ ...cv, dark: Number(e.target.value) })} className="w-full px-6 py-4 rounded-2xl bg-bg-2 border border-border text-xs font-mono font-bold focus:border-accent/40 focus:outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Lux Ceiling</label>
                        <input type="number" step="0.1" value={cv.bright} onChange={(e) => setCv({ ...cv, bright: Number(e.target.value) })} className="w-full px-6 py-4 rounded-2xl bg-bg-2 border border-border text-xs font-mono font-bold focus:border-accent/40 focus:outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: "human", label: "Human Tracking", icon: "fa-user-check" },
                        { key: "light", label: "Optical Analysis", icon: "fa-sun" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() => setCv({ ...cv, [item.key]: !(cv as any)[item.key] })}
                          className={clsx(
                            "p-6 rounded-3xl border transition-all flex flex-col items-center gap-3",
                            (cv as any)[item.key] ? "bg-accent/5 border-accent/20 text-accent" : "bg-bg-2/30 border-border text-text-muted opacity-60"
                          )}
                        >
                          <i className={clsx("fas", item.icon, "text-lg")}></i>
                          <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => save({ cv_min_confidence: cv.confidence, cv_dark_threshold: cv.dark, cv_bright_threshold: cv.bright, cv_human_rules_enabled: cv.human, cv_light_rules_enabled: cv.light })} disabled={saving} className="w-full py-4 rounded-2xl bg-accent text-bg text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-[1.02] transition-all disabled:opacity-50">
                    {saving ? "Syncing..." : "Update Vision Protocols"}
                  </button>
                </div>
              )}

              {tab === "security" && (
                <div className="space-y-8">
                  <div className="card-inner p-8 border-danger/10 mb-8 bg-danger/5">
                     <div className="flex items-center gap-4 mb-4">
                        <i className="fas fa-lock text-2xl text-danger"></i>
                        <h4 className="text-lg font-black text-heading uppercase tracking-tighter">Access Key Refactor</h4>
                     </div>
                     <p className="text-[9px] font-black text-danger/60 uppercase tracking-widest">:: Warning: Overwriting keys will terminate all current terminal and web sessions.</p>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Current Key</label>
                       <input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-bg-2 border border-border focus:border-accent/40 focus:outline-none text-xs font-mono" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">New Deployment Key</label>
                       <input type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-bg-2 border border-border focus:border-accent/40 focus:outline-none text-xs font-mono" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Confirm New Key</label>
                       <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-bg-2 border border-border focus:border-accent/40 focus:outline-none text-xs font-mono" />
                    </div>
                  </div>
                  <button onClick={changePassword} className="w-full py-4 rounded-2xl bg-danger text-white font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-danger/90 transition-all">
                    Reset Security Core
                  </button>
                </div>
              )}

              {tab === "about" && (
                <div className="flex flex-col items-center text-center py-12 space-y-12">
                  <div className="w-24 h-24 rounded-[32px] bg-accent flex items-center justify-center text-bg text-4xl shadow-sm rotate-3">
                    <i className="fas fa-microchip"></i>
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-3xl font-black text-heading tracking-tight">IoTzy <span className="text-accent">Smooth</span></h2>
                    <div className="px-5 py-1.5 rounded-full bg-bg-2 text-[8px] font-black text-text-muted uppercase tracking-[3px]">Kernel Ver: 4.1.0-SMOOTH</div>
                    <p className="text-xs font-bold text-text-secondary opacity-60">High-Performance Neural IoT Command Core</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full">
                    {[
                      { label: "Architecture", val: "Next.js 14-TS" },
                      { label: "Data-Layer", val: "Prisma x SQLite" },
                      { label: "Visual Engine", val: "TensorFlow JS" },
                      { label: "Protocol", val: "MQTT 5.0 Core" },
                    ].map(st => (
                      <div key={st.label} className="p-4 rounded-2xl bg-bg-2/30 border border-bg-2">
                        <div className="text-[7px] font-black text-text-muted uppercase tracking-[2px] mb-1">{st.label}</div>
                        <div className="text-[10px] font-black text-heading uppercase tracking-widest">{st.val}</div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[8px] font-black text-text-muted/30 uppercase tracking-[2px] pt-8">
                    DeepMind Agentic Systems :: (C) 2026 :: All Nodes Operational
                  </p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
