"use client";

import { useState } from "react";
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
  const [showModal, setShowModal] = useState(false);
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
    if (!confirm("Terminate this logic chain?")) return;
    setRules((p) => p.filter((r) => r.id !== id));
    await fetch(`/api/automation?type=rule&id=${id}`, { method: "DELETE" });
  }

  async function deleteSchedule(id: number) {
    if (!confirm("Remove this schedule?")) return;
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
        setShowModal(false);
      const data = await fetch("/api/automation").then((r) => r.json());
      setRules(data.rules);
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1400px] mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)]" />
            <span className="text-[10px] font-black uppercase tracking-[3px] text-text-muted">Neural Engine Logic</span>
          </div>
          <h1 className="text-3xl font-black text-heading tracking-tighter">System Automation</h1>
          <p className="text-text-secondary text-sm font-bold opacity-60">Design conditional sequences and autonomous routines.</p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 rounded-2xl bg-accent text-bg text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-all active:scale-95 flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          <span>Add Logic Pattern</span>
        </button>
      </div>

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between px-4">
         <div className="flex p-1 gap-1 rounded-2xl bg-bg-2 border border-border w-fit">
           {(["rules", "schedules"] as const).map((t) => (
             <button
               key={t}
               onClick={() => setTab(t)}
               className={clsx(
                 "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 tab === t ? "bg-bg text-accent shadow-sm" : "text-text-muted hover:text-heading"
               )}
             >
               {t === "rules" ? "Autonomous Patterns" : "Scheduled Events"}
             </button>
           ))}
         </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4">
        {tab === "rules" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {rules.map((rule) => {
              const dev = deviceMap[rule.deviceId];
              const sensor = rule.sensorId ? sensorMap[rule.sensorId] : null;
              const thresh = rule.threshold ?? `${rule.thresholdMin}-${rule.thresholdMax}`;

              return (
                <div key={rule.id} className={clsx(
                  "card p-6 flex flex-col gap-6 relative group overflow-hidden transition-all",
                  rule.isEnabled ? "border-accent/20 bg-accent/5" : "opacity-60 grayscale"
                )}>
                  {/* Card Header */}
                  <div className="flex items-center justify-between relative z-10">
                     <div className="flex items-center gap-4">
                        <div className={clsx(
                           "w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all",
                           rule.isEnabled ? "bg-accent text-bg shadow-sm" : "bg-bg-2 text-text-muted"
                        )}>
                           <i className={`fas ${dev?.icon || "fa-robot"}`}></i>
                        </div>
                        <div>
                           <h3 className="text-lg font-black text-heading uppercase tracking-tighter leading-none mb-1">{dev?.name || "System Unit"}</h3>
                           <div className="flex items-center gap-2">
                              <div className={clsx("w-1.5 h-1.5 rounded-full", rule.isEnabled ? "bg-success animate-pulse" : "bg-text-muted")} />
                              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{rule.isEnabled ? "Executing" : "Passive"}</span>
                           </div>
                        </div>
                     </div>
                     <button onClick={() => deleteRule(rule.id)} className="w-8 h-8 rounded-xl bg-bg-2 flex items-center justify-center text-[10px] text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all">
                        <i className="fas fa-trash-alt"></i>
                     </button>
                  </div>

                  {/* Flow Visualization */}
                  <div className="p-4 rounded-2xl bg-bg-2 border border-border flex items-center justify-between relative z-10">
                     <div className="flex items-center gap-3">
                        <div className="text-left">
                           <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">Signal Source</p>
                           <p className="text-[10px] font-black text-heading uppercase">{sensor?.name || "Global"}</p>
                        </div>
                        <div className="h-6 w-px bg-border mx-1" />
                        <div className="text-left font-mono">
                           <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">Condition</p>
                           <p className="text-[11px] font-black text-accent">{rule.conditionType.toUpperCase()} {thresh}{sensor?.unit || ""}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <i className="fas fa-chevron-right text-[10px] text-text-muted opacity-40"></i>
                        <div className="text-right">
                           <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">Action</p>
                           <p className={clsx("text-xs font-black uppercase", rule.action === 'on' ? "text-success" : "text-danger")}>{rule.action.toUpperCase()}</p>
                        </div>
                     </div>
                  </div>

                  {/* Toggle */}
                  <div className="flex items-center justify-between pt-6 border-t border-border/40 relative z-10">
                     {rule.startTime && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-2 text-text-muted text-[10px] font-black tracking-widest uppercase">
                           <i className="fas fa-clock text-[8px]"></i> {rule.startTime} - {rule.endTime}
                        </div>
                     )}
                     <div className="flex-1" />
                     <label className="toggle-wrap">
                        <input type="checkbox" checked={rule.isEnabled} onChange={() => toggleRule(rule.id, !rule.isEnabled)} />
                        <span className="toggle-slider"></span>
                     </label>
                  </div>
                </div>
              );
            })}

            {rules.length === 0 && (
              <div className="col-span-full card p-24 flex flex-col items-center justify-center text-center space-y-4 border-dashed opacity-50">
                 <div className="w-16 h-16 rounded-full bg-bg-2 flex items-center justify-center text-text-muted text-2xl">
                    <i className="fas fa-brain"></i>
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-heading uppercase">No Active Logic</h4>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Connect signals to define autonomous patterns</p>
                 </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((sc) => {
              const days = (sc.days as number[]) || [];
              const dayStr = days.length ? days.map((d) => DAY_LABELS[d]).join(", ") : "DAILY";
              return (
                <div key={sc.id} className={clsx(
                  "card p-4 flex items-center gap-6 group transition-all",
                  !sc.isEnabled && "opacity-60 grayscale"
                )}>
                  <div className={clsx(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm",
                    sc.isEnabled ? "bg-bg-2 text-accent" : "bg-bg-2 text-text-muted"
                  )}>
                    <i className="fas fa-clock-four"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-heading uppercase tracking-tighter leading-none mb-2">{sc.label || "SYSTEM EVENT"}</h4>
                    <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-text-muted">
                       <span className="text-heading">{sc.time}</span>
                       <span className="text-accent">{dayStr}</span>
                       <span className={clsx(sc.action === 'on' ? "text-success" : "text-danger")}>{sc.action.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                     <label className="toggle-wrap scale-90">
                        <input type="checkbox" checked={sc.isEnabled} onChange={() => toggleSchedule(sc.id, !sc.isEnabled)} />
                        <span className="toggle-slider"></span>
                     </label>
                     <button onClick={() => deleteSchedule(sc.id)} className="w-8 h-8 rounded-xl bg-bg-2 flex items-center justify-center text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all">
                        <i className="fas fa-trash-alt text-[10px]"></i>
                     </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-bg/60 backdrop-blur-xl z-[60] flex items-center justify-center p-6 animate-fadeIn">
          <div className="card w-full max-w-lg overflow-hidden animate-slideUp shadow-2xl">
            <div className="px-8 py-6 border-b border-border shadow-sm flex items-center justify-between bg-white/[0.02]">
               <h2 className="text-lg font-black text-heading uppercase tracking-tighter">Construct Pattern</h2>
               <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-danger">
                  <i className="fas fa-times"></i>
               </button>
            </div>
            
            <div className="p-8 space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Trigger Signal</label>
                     <select value={form.sensor_id} onChange={(e) => setForm({ ...form, sensor_id: e.target.value })} className="w-full px-5 py-3.5 rounded-2xl bg-bg-2 border border-border focus:border-accent focus:outline-none text-xs font-bold appearance-none cursor-pointer">
                        <option value="" className="bg-bg uppercase">Manual Trigger</option>
                        {sensors.map((s) => <option key={s.id} value={s.id} className="bg-bg">{s.name.toUpperCase()}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Target Node</label>
                     <select value={form.device_id} onChange={(e) => setForm({ ...form, device_id: e.target.value })} className="w-full px-5 py-3.5 rounded-2xl bg-bg-2 border border-border focus:border-accent focus:outline-none text-xs font-bold appearance-none cursor-pointer">
                        <option value="" className="bg-bg uppercase">Select Node</option>
                        {devices.map((d) => <option key={d.id} value={d.id} className="bg-bg">{d.name.toUpperCase()}</option>)}
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Logic Op</label>
                     <select value={form.condition_type} onChange={(e) => setForm({ ...form, condition_type: e.target.value })} className="w-full px-4 py-3.5 rounded-2xl bg-bg-2 border border-border focus:border-accent focus:outline-none text-xs font-bold appearance-none cursor-pointer">
                        <option value="gt">INCR &gt;</option>
                        <option value="lt">DECR &lt;</option>
                        <option value="between">RANGE</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Threshold</label>
                     <input type="number" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} className="w-full px-4 py-3.5 rounded-2xl bg-bg-2 border border-border focus:border-accent text-xs font-bold" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Desired State</label>
                     <select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} className="w-full px-4 py-3.5 rounded-2xl bg-bg-2 border border-border focus:border-accent focus:outline-none text-xs font-bold appearance-none cursor-pointer">
                        <option value="on">ACTIVE</option>
                        <option value="off">PASSIVE</option>
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Window Start</label>
                     <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="w-full px-5 py-3.5 rounded-2xl bg-bg-2 border border-border focus:border-accent text-xs font-bold" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Window End</label>
                     <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="w-full px-5 py-3.5 rounded-2xl bg-bg-2 border border-border focus:border-accent text-xs font-bold" />
                  </div>
               </div>
            </div>

            <div className="px-8 py-6 bg-white/[0.02] border-t border-border flex gap-4">
               <button onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-2xl bg-bg-2 text-[10px] font-black uppercase tracking-widest text-text-muted">Discard</button>
               <button onClick={addRule} className="flex-1 py-4 rounded-2xl bg-accent text-bg text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-[1.02] active:scale-95 transition-all">Assemble Engine</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
