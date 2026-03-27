"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import type { AutomationRule, Schedule } from "@/types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  rules: (AutomationRule & { createdAt: string })[];
  schedules: (Schedule & { createdAt: string })[];
  devices: { id: number; name: string; icon: string; isActive: boolean }[];
  sensors: { id: number; name: string; type: string; unit: string | null }[];
}

export default function AutomationContent({ rules: initialRules, schedules: initialSchedules, devices, sensors }: Props) {
  const [tab, setTab] = useState<"rules" | "schedules">("rules");
  const [rules, setRules] = useState(initialRules);
  const [schedules, setSchedules] = useState(initialSchedules);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    sensor_id: "", device_id: "", condition_type: "gt",
    threshold: "", action: "on", start_time: "", end_time: "",
  });

  const deviceMap = Object.fromEntries(devices.map((d) => [d.id, d]));
  const sensorMap = Object.fromEntries(sensors.map((s) => [s.id, s]));

  async function toggleRule(id: number, enabled: boolean) {
    setRules((p) => p.map((r) => (r.id === id ? { ...r, isEnabled: enabled } : r)));
    await fetch("/api/automation", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "rule", id, is_enabled: enabled }),
    });
  }

  async function toggleSchedule(id: number, enabled: boolean) {
    setSchedules((p) => p.map((s) => (s.id === id ? { ...s, isEnabled: enabled } : s)));
    await fetch("/api/automation", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "schedule", id, is_enabled: enabled }),
    });
  }

  async function deleteRule(id: number) {
    if (!confirm("Delete this rule?")) return;
    setRules((p) => p.filter((r) => r.id !== id));
    await fetch(`/api/automation?type=rule&id=${id}`, { method: "DELETE" });
  }

  async function deleteSchedule(id: number) {
    if (!confirm("Delete this schedule?")) return;
    setSchedules((p) => p.filter((s) => s.id !== id));
    await fetch(`/api/automation?type=schedule&id=${id}`, { method: "DELETE" });
  }

  async function addRule() {
    if (!form.device_id) return;
    const res = await fetch("/api/automation", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "rule",
        sensor_id: form.sensor_id ? Number(form.sensor_id) : null,
        device_id: Number(form.device_id),
        condition_type: form.condition_type,
        threshold: form.threshold ? Number(form.threshold) : null,
        action: form.action,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
      }),
    });
    if (res.ok) {
      setShowAdd(false);
      const data = await fetch("/api/automation").then((r) => r.json());
      setRules(data.rules);
    }
  }

  const templates = [
    { name: "Smart Lighting", icon: "fa-lightbulb", desc: "Turns on when dark" },
    { name: "Climate Sync", icon: "fa-wind", desc: "AC control based on temp" },
    { name: "Auto Lock", icon: "fa-lock", desc: "Security sequence" },
    { name: "Safety Alert", icon: "fa-fire", desc: "Emergency protocols" },
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1600px] mx-auto pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-1">
           <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_var(--accent)]" />
              <span className="text-[10px] font-black uppercase tracking-[3px] text-accent opacity-70">Logic Engine</span>
           </div>
           <h2 className="text-3xl font-black text-heading tracking-tight">Rules <span className="text-text-muted opacity-30">& Schedules</span></h2>
           <p className="text-sm text-text-secondary font-medium opacity-60">Design automated sequences for your hardware node network.</p>
        </div>
        
        <button
          onClick={() => setShowAdd(true)}
          className="px-6 py-3 rounded-2xl bg-gradient-to-br from-accent to-accent-light text-bg font-black text-xs uppercase tracking-widest shadow-[0_0_20px_var(--accent-glow)] hover:scale-105 transition-all active:scale-95 flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          <span>Create Logic</span>
        </button>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex p-1 gap-2 rounded-2xl bg-surface/50 border border-border/40 w-fit backdrop-blur-md">
        {(["rules", "schedules"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
              tab === t 
                ? "bg-accent text-bg shadow-[0_0_15px_var(--accent-glow)]" 
                : "text-text-muted hover:text-heading hover:bg-white/5"
            )}
          >
            {t === "rules" ? `Automation (${rules.length})` : `Schedule (${schedules.length})`}
          </button>
        ))}
      </div>

      {/* ── Main Content Area ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Templates Sidebar (Hidden on small) */}
        <div className="lg:col-span-3 space-y-6 hidden lg:block">
           <div className="rounded-[28px] bg-surface/30 backdrop-blur-[var(--glass-blur)] border border-border/40 p-6 space-y-4">
              <h4 className="text-[11px] font-black text-heading uppercase tracking-[2px] mb-4">Quick Templates</h4>
              <div className="space-y-3">
                 {templates.map((t) => (
                    <button
                      key={t.name}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-accent/30 transition-all duration-300 group text-left"
                    >
                       <div className="w-10 h-10 rounded-xl bg-accent-bg flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                          <i className={`fas ${t.icon}`}></i>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[11px] font-black text-heading uppercase tracking-tight leading-none mb-1">{t.name}</span>
                          <span className="text-[9px] font-bold text-text-muted opacity-60">{t.desc}</span>
                       </div>
                    </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Dynamic Lists (9 Cols) */}
        <div className="lg:col-span-9 space-y-6">
          
          {tab === "rules" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rules.length === 0 ? (
                <div className="col-span-full py-24 rounded-[32px] bg-surface/10 border border-dashed border-border/40 flex flex-col items-center justify-center text-center">
                   <i className="fas fa-robot text-4xl text-text-muted opacity-20 mb-4 block"></i>
                   <p className="text-sm font-bold text-text-muted opacity-60">No automated logic chains detected.</p>
                </div>
              ) : (
                rules.map((rule) => {
                  const dev = deviceMap[rule.deviceId];
                  const sensor = rule.sensorId ? sensorMap[rule.sensorId] : null;
                  const thresh = rule.threshold ?? `${rule.thresholdMin}-${rule.thresholdMax}`;

                  return (
                    <div key={rule.id} className={clsx(
                      "group relative p-6 rounded-[32px] border transition-all duration-700 overflow-hidden flex flex-col gap-5",
                      rule.isEnabled 
                        ? "bg-accent/5 border-accent/40 shadow-[0_0_30px_rgba(0,242,255,0.05)]" 
                        : "bg-surface/30 border-border/40 grayscale opacity-60"
                    )}>
                      {/* Top Bar */}
                      <div className="flex items-start justify-between relative z-10">
                        <div className="flex items-center gap-3">
                           <div className={clsx(
                             "w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-500",
                             rule.isEnabled ? "bg-accent text-bg shadow-[0_0_15px_var(--accent-glow)] scale-105" : "bg-white/5 text-text-muted"
                           )}>
                              <i className={`fas ${dev?.icon || "fa-plug"}`}></i>
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[11px] font-black text-heading uppercase tracking-tighter leading-none mb-1">{dev?.name || "Null Context"}</span>
                              <div className="flex items-center gap-2">
                                 <span className={clsx("w-1.5 h-1.5 rounded-full", rule.isEnabled ? "bg-success shadow-[0_0_8px_var(--success)] animate-pulse" : "bg-text-muted")} />
                                 <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{rule.isEnabled ? "Active Logic" : "Standby"}</span>
                              </div>
                           </div>
                        </div>
                        <button onClick={() => deleteRule(rule.id)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-muted text-[10px] border border-white/5 hover:bg-danger/10 hover:text-danger opacity-0 group-hover:opacity-100 transition-all">
                           <i className="fas fa-trash"></i>
                        </button>
                      </div>

                      {/* Condition Logic Display */}
                      <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-3">
                         <div className="flex items-center justify-between text-[9px] font-black text-text-muted uppercase tracking-[2px]">
                            <span>Trigger Source</span>
                            <span>Operation</span>
                         </div>
                         <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                               <span className="text-xs font-bold text-heading">{sensor?.name || "Manual / Time"}</span>
                               <span className="text-[9px] font-mono text-text-secondary opacity-50 uppercase tracking-tighter">{sensor?.type || "Static Trigger"}</span>
                            </div>
                            <div className="flex items-center gap-3">
                               <span className="px-2 py-1 rounded-lg bg-accent/20 text-accent font-black font-mono text-xs border border-accent/20">
                                  {rule.conditionType.toUpperCase()} {thresh}{sensor?.unit || ""}
                               </span>
                               <i className="fas fa-arrow-right text-[10px] text-text-muted opacity-40"></i>
                            </div>
                         </div>
                      </div>

                      {/* Result Action */}
                      <div className="flex items-center justify-between mt-auto">
                         <div className="flex items-center gap-3">
                            <div className={clsx(
                               "px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all duration-500",
                               rule.action === 'on' 
                                 ? "bg-success/10 border-success/30 text-success shadow-[0_0_15px_rgba(0,255,157,0.05)]" 
                                 : "bg-danger/10 border-danger/30 text-danger"
                            )}>
                               ACTIVATE: {rule.action.toUpperCase()}
                            </div>
                            {rule.startTime && (
                               <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-warning/5 border border-warning/20 text-warning text-[9px] font-black lowercase tracking-widest">
                                  <i className="fas fa-clock text-[8px]"></i> {rule.startTime}..{rule.endTime}
                               </div>
                            )}
                         </div>
                         <div
                           className={clsx(
                             "w-12 h-6 rounded-full relative transition-all duration-500 cursor-pointer overflow-hidden shadow-inner border border-white/5",
                             rule.isEnabled ? "bg-success/40" : "bg-white/10"
                           )}
                           onClick={() => toggleRule(rule.id, !rule.isEnabled)}
                         >
                            <div className={clsx(
                               "absolute top-1 w-4 h-4 rounded-full bg-heading shadow-md transition-all duration-500",
                               rule.isEnabled ? "left-7" : "left-1"
                            )} />
                         </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === "schedules" && (
            <div className="space-y-4">
              {schedules.length === 0 ? (
                <div className="py-24 rounded-[32px] bg-surface/10 border border-dashed border-border/40 flex flex-col items-center justify-center text-center">
                   <i className="fas fa-clock text-4xl text-text-muted opacity-20 mb-4 block"></i>
                   <p className="text-sm font-bold text-text-muted opacity-60">No chronological event blocks scheduled.</p>
                </div>
              ) : (
                schedules.map((sc) => {
                  const days = (sc.days as number[]) || [];
                  const dayStr = days.length ? days.map((d) => DAY_LABELS[d]).join(", ") : "EVERY DAY";
                  return (
                    <div key={sc.id} className={clsx(
                      "group p-6 rounded-[28px] bg-surface/30 backdrop-blur-[var(--glass-blur)] border border-border/40 flex flex-col md:flex-row md:items-center gap-6 transition-all duration-500 hover:border-accent/30",
                      !sc.isEnabled && "grayscale opacity-50"
                    )}>
                      <div className={clsx(
                        "w-14 h-14 rounded-[20px] flex items-center justify-center text-xl shadow-inner border border-white/5",
                        sc.isEnabled ? "bg-warning/10 text-warning" : "bg-white/5 text-text-muted"
                      )}>
                        <i className="fas fa-clock-four"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-heading text-lg tracking-tight mb-1">{sc.label || "UNNAMED SEQUENCE"}</h4>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-text-muted opacity-60">
                           <span className="bg-black/20 px-2 py-0.5 rounded border border-white/5">{sc.time}</span>
                           <span>•</span>
                           <span className="bg-black/20 px-2 py-0.5 rounded border border-white/5 text-accent">{dayStr}</span>
                           <span>•</span>
                           <span className={clsx("font-black", sc.action === 'on' ? "text-success" : "text-danger")}>SIGNAL: {sc.action.toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                         <div
                           className={clsx(
                             "w-12 h-6 rounded-full relative transition-all duration-500 cursor-pointer overflow-hidden shadow-inner border border-white/5",
                             sc.isEnabled ? "bg-warning/40 shadow-[0_0_15px_rgba(255,191,0,0.1)]" : "bg-white/10"
                           )}
                           onClick={() => toggleSchedule(sc.id, !sc.isEnabled)}
                         >
                            <div className={clsx(
                               "absolute top-1 w-4 h-4 rounded-full bg-heading shadow-md transition-all duration-500",
                               sc.isEnabled ? "left-7" : "left-1"
                            )} />
                         </div>
                         <button onClick={() => deleteSchedule(sc.id)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-muted hover:bg-danger/10 hover:text-danger opacity-0 group-hover:opacity-100 transition-all border border-white/5">
                           <i className="fas fa-trash text-sm"></i>
                         </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Add Rule Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-xl rounded-[32px] bg-surface-solid border border-border/50 shadow-2xl overflow-hidden animate-slideIn">
            <div className="px-8 py-6 border-b border-border/50 bg-white/5">
               <h3 className="text-xl font-black text-heading tracking-tight uppercase">Construct New Logic</h3>
               <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">Configure trigger-action parameters</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Trigger Sensor</label>
                    <select value={form.sensor_id} onChange={(e) => setForm({ ...form, sensor_id: e.target.value })} className="w-full px-5 py-3.5 rounded-2xl bg-black/40 border border-border/40 text-[11px] font-bold focus:outline-none focus:border-accent/50 transition-all appearance-none cursor-pointer">
                      <option value="" className="bg-surface-solid">MANUAL / DYNAMIC</option>
                      {sensors.map((s) => <option key={s.id} value={s.id} className="bg-surface-solid uppercase">{s.name} ({s.type.toUpperCase()})</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Target Node</label>
                    <select value={form.device_id} onChange={(e) => setForm({ ...form, device_id: e.target.value })} className="w-full px-5 py-3.5 rounded-2xl bg-black/40 border border-border/40 text-[11px] font-bold focus:outline-none focus:border-accent/50 transition-all appearance-none cursor-pointer">
                      <option value="" className="bg-surface-solid">SELECT DEVICE</option>
                      {devices.map((d) => <option key={d.id} value={d.id} className="bg-surface-solid uppercase">{d.name}</option>)}
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                 <div className="col-span-1 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Operator</label>
                    <select value={form.condition_type} onChange={(e) => setForm({ ...form, condition_type: e.target.value })} className="w-full px-4 py-3.5 rounded-2xl bg-black/40 border border-border/40 text-[11px] font-bold focus:outline-none focus:border-accent/50 appearance-none cursor-pointer">
                      <option value="gt">INCR &gt;</option>
                      <option value="lt">DECR &lt;</option>
                      <option value="between">RANGE</option>
                    </select>
                 </div>
                 <div className="col-span-1 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Value</label>
                    <input type="number" placeholder="00" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} className="w-full px-5 py-3.5 rounded-2xl bg-black/40 border border-border/40 text-[11px] font-bold focus:outline-none focus:border-accent/50 transition-all shadow-inner" />
                 </div>
                 <div className="col-span-1 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Action</label>
                    <select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} className="w-full px-4 py-3.5 rounded-2xl bg-black/40 border border-border/40 text-[11px] font-bold focus:outline-none focus:border-accent/50 appearance-none cursor-pointer">
                      <option value="on">ACTIVE</option>
                      <option value="off">STBY</option>
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Time Window Start</label>
                    <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="w-full px-5 py-3.5 rounded-2xl bg-black/40 border border-border/40 text-[11px] font-bold focus:outline-none focus:border-accent/50 transition-all shadow-inner uppercase" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Time Window End</label>
                    <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="w-full px-5 py-3.5 rounded-2xl bg-black/40 border border-border/40 text-[11px] font-bold focus:outline-none focus:border-accent/50 transition-all shadow-inner uppercase" />
                 </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-white/5 border-t border-border/50 flex gap-4">
              <button 
                onClick={() => setShowAdd(false)} 
                className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-text-secondary font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Abort
              </button>
              <button 
                onClick={addRule} 
                className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-accent to-accent-light text-bg font-black text-[10px] uppercase tracking-widest shadow-[0_0_15px_var(--accent-glow)] hover:scale-[1.02] transition-all"
              >
                Assemble Logic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
