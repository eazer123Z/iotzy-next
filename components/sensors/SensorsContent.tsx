"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import clsx from "clsx";
import type { Sensor } from "@/types";

const SENSOR_META: Record<string, { icon: string; color: string; bg: string; unit: string; max: number }> = {
  temperature: { icon: "fa-temperature-half", color: "text-danger", bg: "bg-danger/10", unit: "°C", max: 50 },
  humidity: { icon: "fa-droplet", color: "text-accent", bg: "bg-accent/10", unit: "%", max: 100 },
  air_quality: { icon: "fa-wind", color: "text-success", bg: "bg-success/10", unit: "AQI", max: 300 },
  presence: { icon: "fa-user-check", color: "text-info", bg: "bg-info/10", unit: "", max: 1 },
  brightness: { icon: "fa-sun", color: "text-warning", bg: "bg-warning/10", unit: "%", max: 100 },
  motion: { icon: "fa-person-running", color: "text-danger", bg: "bg-danger/10", unit: "", max: 1 },
  smoke: { icon: "fa-fire", color: "text-danger", bg: "bg-danger/10", unit: "ppm", max: 1000 },
  gas: { icon: "fa-triangle-exclamation", color: "text-warning", bg: "bg-warning/10", unit: "ppm", max: 1000 },
};

export default function SensorsContent({
  sensors: initialSensors,
}: {
  sensors: Sensor[];
}) {
  const { sensors, sensorData, setSensors, removeSensor } = useAppStore();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", type: "temperature", unit: "", topic: "" });

  useEffect(() => {
    setSensors(initialSensors);
  }, [initialSensors, setSensors]);

  const filtered = Object.values(sensors).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd() {
    if (!form.name.trim() || !form.topic.trim()) return;
    const res = await fetch("/api/sensors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ name: "", type: "temperature", unit: "", topic: "" });
      const data = await fetch("/api/sensors").then((r) => r.json());
      setSensors(data);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this data stream?")) return;
    const res = await fetch(`/api/sensors?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      removeSensor(id);
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1400px] mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)]" />
            <span className="text-[10px] font-black uppercase tracking-[3px] text-txt-muted">High Precision Sensing</span>
          </div>
          <h1 className="text-3xl font-black text-heading tracking-tighter">Environmental Data</h1>
          <p className="text-text-secondary text-sm font-bold opacity-60">Real-time telemetry from your wide-area sensor network.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="relative group">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[10px] text-txt-muted"></i>
              <input
                type="text"
                placeholder="Lookup signal..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-6 py-3 rounded-2xl bg-surface border border-border focus:border-accent shadow-sm transition-all text-xs font-bold w-full md:w-64"
              />
           </div>
           <button
             onClick={() => setShowModal(true)}
             className="px-6 py-3 rounded-2xl bg-accent text-bg text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-all active:scale-95"
           >
             Add Sensor Link
           </button>
        </div>
      </div>

      {/* ── Sensor Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 px-4">
        {filtered.map((s) => {
          const id = String(s.id);
          const meta = SENSOR_META[s.type] || { icon: "fa-microchip", color: "text-txt-muted", bg: "bg-surface", unit: "", max: 100 };
          const value = sensorData[id] ?? s.latestValue;
          const isOnline = s.lastSeen && new Date(s.lastSeen).getTime() > Date.now() - 5 * 60 * 1000;
          const pct = value != null ? Math.min(100, Math.max(0, (Number(value) / meta.max) * 100)) : 0;

          return (
            <div key={s.id} className="card p-6 flex flex-col gap-6 relative overflow-hidden group">
              {/* Header */}
              <div className="flex items-start justify-between relative z-10">
                 <div className="flex items-center gap-4">
                    <div className={clsx(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-500",
                      meta.bg, meta.color, "group-hover:scale-110"
                    )}>
                      <i className={`fas ${meta.icon}`}></i>
                    </div>
                    <div>
                       <h3 className="text-lg font-black text-heading uppercase tracking-tighter truncate leading-none mb-1">{s.name}</h3>
                       <div className="flex items-center gap-2">
                          <div className={clsx("w-1.5 h-1.5 rounded-full", isOnline ? "bg-success shadow-[0_0_8px_var(--success)] animate-pulse" : "bg-text-muted")} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-txt-muted">{isOnline ? "Live" : "Inactive"}</span>
                       </div>
                    </div>
                 </div>

                 <button
                   onClick={() => handleDelete(id)}
                   className="w-8 h-8 rounded-xl bg-bg-2 flex items-center justify-center text-[10px] text-txt-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                 >
                   <i className="fas fa-trash-alt"></i>
                 </button>
              </div>

              {/* Central Value */}
              <div className="relative z-10 flex flex-col">
                 <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-heading font-mono tracking-tighter leading-none">
                       {value != null ? value : "0.0"}
                    </span>
                    <span className="text-xs font-black text-txt-muted uppercase tracking-widest">
                       {s.unit || meta.unit}
                    </span>
                 </div>
                 <span className="text-[9px] font-black text-txt-muted uppercase tracking-[3px] mt-2 opacity-40">System Reading</span>
              </div>

              {/* Progress Detail */}
              {s.type !== 'presence' && s.type !== 'motion' && (
                <div className="space-y-2 relative z-10 mt-auto">
                   <div className="progress-rail">
                      <div className={clsx("progress-bar", meta.color.replace('text-', 'bg-'))} style={{ width: `${pct}%` }} />
                   </div>
                   <div className="flex justify-between items-center text-[8px] font-black text-txt-muted uppercase tracking-widest opacity-60">
                      <span>Baseline</span>
                      <span>Target: {meta.max}</span>
                   </div>
                </div>
              )}

              {/* Logic Indicator (Boolean sensors) */}
              {(s.type === 'presence' || s.type === 'motion') && (
                 <div className="mt-auto relative z-10">
                    <div className={clsx(
                       "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
                       (value ?? 0) > 0 ? "bg-success-bg border-success text-success" : "bg-bg-2 border-border text-txt-muted"
                    )}>
                       <i className={`fas ${(value ?? 0) > 0 ? 'fa-check-circle' : 'fa-circle-notch'} text-[10px]`}></i>
                       <span className="text-[9px] font-black uppercase tracking-widest">{(value ?? 0) > 0 ? "Occupied" : "Unoccupied"}</span>
                    </div>
                 </div>
              )}

              {/* Network Context */}
              <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between text-[8px] font-mono text-txt-muted opacity-40">
                 <span className="truncate max-w-[150px]">{s.topic}</span>
                 <span>{s.lastSeen ? new Date(s.lastSeen).toLocaleTimeString("en-US", { hour12: false, hour: '2-digit', minute: '2-digit' }) : "—:—"}</span>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full card p-24 flex flex-col items-center justify-center text-center space-y-4 border-dashed opacity-50">
             <div className="w-16 h-16 rounded-full bg-bg-2 flex items-center justify-center text-txt-muted text-2xl">
                <i className="fas fa-satellite-dish"></i>
             </div>
             <div>
                <h4 className="text-sm font-black text-heading uppercase">Silent Frequency</h4>
                <p className="text-[10px] font-bold text-txt-muted uppercase tracking-widest">No sensor links found in this range</p>
             </div>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-bg/60 backdrop-blur-xl z-[60] flex items-center justify-center p-6 animate-fadeIn">
          <div className="card w-full max-w-lg overflow-hidden animate-slideUp shadow-2xl">
            <div className="px-8 py-6 border-b border-border shadow-sm flex items-center justify-between bg-white/[0.02]">
               <h2 className="text-lg font-black text-heading uppercase tracking-tighter">Register New Signal link</h2>
               <button onClick={() => setShowModal(false)} className="text-txt-muted hover:text-danger">
                  <i className="fas fa-times"></i>
               </button>
            </div>
            
            <div className="p-8 space-y-6">
               <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-txt-muted ml-1">Signal Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Server Room Thermal"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl bg-bg-2 border border-border focus:border-accent focus:outline-none text-xs font-bold"
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-txt-muted ml-1">Telemetry Type</label>
                     <select 
                       value={form.type} 
                       onChange={(e) => setForm({ ...form, type: e.target.value })} 
                       className="w-full px-5 py-3.5 rounded-2xl bg-bg-2 border border-border focus:border-accent focus:outline-none text-xs font-bold appearance-none cursor-pointer"
                     >
                       {Object.keys(SENSOR_META).map((t) => (
                         <option key={t} value={t} className="bg-bg text-heading">{t.replace("_", " ").toUpperCase()}</option>
                       ))}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-txt-muted ml-1">Unit Tag</label>
                     <input
                       type="text"
                       placeholder="e.g. °C, %"
                       value={form.unit}
                       onChange={(e) => setForm({ ...form, unit: e.target.value })}
                       className="w-full px-5 py-3.5 rounded-2xl bg-bg-2 border border-border focus:border-accent focus:outline-none text-xs font-bold"
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-txt-muted ml-1">Network Path (Topic)</label>
                  <input
                    type="text"
                    placeholder="iotzy/sensors/therm_01"
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl bg-bg-2 border border-border focus:border-accent focus:outline-none text-xs font-mono"
                  />
               </div>
            </div>

            <div className="px-8 py-6 bg-white/[0.02] border-t border-border flex gap-4">
               <button onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-2xl bg-bg-2 text-[10px] font-black uppercase tracking-widest text-txt-muted">Discard</button>
               <button onClick={handleAdd} className="flex-1 py-4 rounded-2xl bg-accent text-bg text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-[1.02] active:scale-95 transition-all">Establish Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
