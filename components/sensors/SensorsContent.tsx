"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import clsx from "clsx";
import type { Sensor } from "@/types";

const SENSOR_META: Record<string, { icon: string; color: string; bg: string; barClass: string; unit: string }> = {
  temperature: { icon: "fa-temperature-half", color: "text-red-400", bg: "bg-red-500/10", barClass: "temp-bar", unit: "°C" },
  humidity: { icon: "fa-droplet", color: "text-blue-400", bg: "bg-blue-500/10", barClass: "humidity-bar", unit: "%" },
  air_quality: { icon: "fa-wind", color: "text-green-400", bg: "bg-green-500/10", barClass: "air-bar", unit: "AQI" },
  presence: { icon: "fa-user-check", color: "text-purple-400", bg: "bg-purple-500/10", barClass: "", unit: "" },
  brightness: { icon: "fa-sun", color: "text-yellow-400", bg: "bg-yellow-500/10", barClass: "brightness-bar", unit: "%" },
  motion: { icon: "fa-person-running", color: "text-orange-400", bg: "bg-orange-500/10", barClass: "", unit: "" },
  smoke: { icon: "fa-fire", color: "text-red-500", bg: "bg-red-500/10", barClass: "smoke-bar", unit: "ppm" },
  gas: { icon: "fa-triangle-exclamation", color: "text-amber-500", bg: "bg-amber-500/10", barClass: "gas-bar", unit: "ppm" },
};

export default function SensorsContent({
  sensors: initialSensors,
}: {
  sensors: Sensor[];
}) {
  const { sensors, sensorData, sensorHistory, setSensors } = useAppStore();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", type: "temperature", unit: "", topic: "" });

  useEffect(() => {
    setSensors(initialSensors);
  }, []);

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
      setShowAdd(false);
      setForm({ name: "", type: "temperature", unit: "", topic: "" });
      const data = await fetch("/api/sensors").then((r) => r.json());
      setSensors(data);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus sensor ini?")) return;
    await fetch(`/api/sensors?id=${id}`, { method: "DELETE" });
    useAppStore.getState().removeSensor(id);
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1600px] mx-auto pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-1">
           <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_var(--accent)]" />
              <span className="text-[10px] font-black uppercase tracking-[3px] text-accent opacity-70">Sensing Layer</span>
           </div>
           <h2 className="text-3xl font-black text-heading tracking-tight">Environmental <span className="text-text-muted opacity-30">Telemetry</span></h2>
           <p className="text-sm text-text-secondary font-medium opacity-60">Real-time data synchronization from your hardware sensor array.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                 <i className="fas fa-search text-text-muted text-xs group-focus-within:text-accent transition-colors"></i>
              </div>
              <input
                type="text"
                placeholder="Lookup sensor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 pr-4 py-3 rounded-2xl bg-surface/50 backdrop-blur-md border border-border/40 text-sm focus:outline-none focus:border-accent/50 focus:shadow-[0_0_20px_rgba(0,242,255,0.05)] transition-all w-full md:w-64 placeholder:text-text-muted/50 font-semibold"
              />
           </div>
           <button
             onClick={() => setShowAdd(true)}
             className="px-6 py-3 rounded-2xl bg-gradient-to-br from-accent to-accent-light text-bg font-black text-xs uppercase tracking-widest shadow-[0_0_20px_var(--accent-glow)] hover:scale-105 transition-all active:scale-95 flex items-center gap-2"
           >
             <i className="fas fa-plus"></i>
             <span>Add Sensor</span>
           </button>
        </div>
      </div>

      {/* ── Sensor Grid ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-[32px] bg-surface/20 border border-dashed border-border/40 animate-fadeIn text-center">
           <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-text-muted mb-6">
              <i className="fas fa-signal text-4xl opacity-20"></i>
           </div>
           <p className="text-lg font-bold text-text-muted mb-4">
              {search ? "No matches found in frequency list" : "Sensor array is empty. No signals detected."}
           </p>
           {!search && (
              <button onClick={() => setShowAdd(true)} className="btn-primary">
                 <i className="fas fa-plus mr-2"></i>Register New Sensor
              </button>
           )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((s) => {
            const id = String(s.id);
            const meta = SENSOR_META[s.type] || { icon: "fa-microchip", color: "text-text-muted", bg: "bg-surface", barClass: "default-bar", unit: "" };
            const value = sensorData[id] ?? s.latestValue;
            const isOnline = s.lastSeen && new Date(s.lastSeen).getTime() > Date.now() - 5 * 60 * 1000;
            const pct = value != null ? Math.min(100, Math.max(0, (Number(value) / (s.type === "temperature" ? 50 : 100)) * 100)) : 0;

            return (
              <div key={s.id} className="group relative p-6 rounded-[32px] bg-surface/30 backdrop-blur-[var(--glass-blur)] border border-border/40 transition-all duration-500 hover:border-accent/40 hover:-translate-y-1 hover:shadow-2xl overflow-hidden flex flex-col gap-6">
                
                {/* Visual Accent Layer */}
                <div className={clsx(
                  "absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-5 transition-opacity duration-700 group-hover:opacity-20",
                  meta.color.replace('text-', 'bg-')
                )} />

                {/* Header Section */}
                <div className="flex items-start justify-between relative z-10">
                   <div className="flex items-center gap-4">
                      <div className={clsx(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-white/5 transition-all duration-500",
                        meta.bg, meta.color, "group-hover:scale-110"
                      )}>
                        <i className={`fas ${meta.icon}`}></i>
                      </div>
                      <div>
                         <h4 className="font-black text-heading text-lg tracking-tight uppercase truncate max-w-[120px]">{s.name}</h4>
                         <div className="flex items-center gap-2">
                            <span className={clsx("w-1.5 h-1.5 rounded-full", isOnline ? "bg-success shadow-[0_0_8px_var(--success)] animate-pulse" : "bg-text-muted opacity-40")} />
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[1px]">{isOnline ? "Broadcasting" : "Silent"}</span>
                         </div>
                      </div>
                   </div>

                   <button
                     onClick={() => handleDelete(id)}
                     className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-muted text-[10px] border border-white/5 hover:bg-danger/10 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                   >
                     <i className="fas fa-trash"></i>
                   </button>
                </div>

                {/* Data Value Container */}
                <div className="relative z-10">
                   <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-heading font-mono tracking-tighter">
                         {value != null ? value : "—"}
                      </span>
                      <span className="text-sm font-black text-text-muted uppercase tracking-widest leading-none">
                         {s.unit || meta.unit}
                      </span>
                   </div>
                </div>

                {/* Performance Track (Progress) */}
                {(meta.barClass || true) && s.type !== 'presence' && (
                  <div className="space-y-2 relative z-10">
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
                      <div 
                        className={clsx(
                          "h-full rounded-full transition-all duration-1000 relative",
                          meta.barClass ? "progress-fill " + meta.barClass : "bg-accent opacity-80"
                        )} 
                        style={{ width: `${pct}%` }} 
                      >
                         <div className="absolute inset-0 bg-white/20 blur-sm" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-black text-text-muted uppercase tracking-[1.5px] opacity-50">
                      <span>Baseline (0)</span>
                      <span>Target ({s.type === "temperature" ? "50" : "100"})</span>
                    </div>
                  </div>
                )}

                {/* Presence Signature */}
                {s.type === "presence" && (
                   <div className="flex items-center justify-between p-3 rounded-2xl bg-black/20 border border-white/5 relative z-10">
                      <span className="text-[10px] font-black uppercase text-text-secondary tracking-widest pl-1">Detection Logic</span>
                      <div className="flex items-center gap-2 pr-1">
                         <span className={clsx("text-xs font-black uppercase tracking-tight", (value ?? 0) > 0 ? "text-success" : "text-text-muted")}>
                            {(value ?? 0) > 0 ? "Detected" : "Clear"}
                         </span>
                         <div className={clsx("w-3 h-3 rounded-full transition-all", (value ?? 0) > 0 ? "bg-success shadow-[0_0_10px_var(--success)]" : "bg-white/5")} />
                      </div>
                   </div>
                )}

                {/* Network Footer */}
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">Signal Meta</span>
                      <span className="text-[10px] font-mono text-text-secondary truncate max-w-[140px] opacity-60 italic">{s.topic}</span>
                   </div>
                   <div className="text-right">
                      <span className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none mb-1 block">Last Pulse</span>
                      <span className="text-[10px] font-bold text-text-secondary">
                         {s.lastSeen ? new Date(s.lastSeen).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) : "—:—"}
                      </span>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-lg rounded-[32px] bg-surface-solid border border-border/50 shadow-2xl overflow-hidden animate-slideIn">
            <div className="px-8 py-6 border-b border-border/50 bg-white/5">
               <h3 className="text-xl font-black text-heading tracking-tight uppercase">Register Neural Sensor</h3>
               <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">Bind new data stream to telemetry array</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Signal Name</label>
                 <input
                   type="text"
                   placeholder="e.g. Ambient Thermal Probe"
                   value={form.name}
                   onChange={(e) => setForm({ ...form, name: e.target.value })}
                   className="w-full px-5 py-3.5 rounded-2xl bg-black/40 border border-border/40 text-sm font-bold placeholder:text-text-muted/40 focus:outline-none focus:border-accent/50 transition-all shadow-inner"
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Telemetry Type</label>
                   <select 
                     value={form.type} 
                     onChange={(e) => setForm({ ...form, type: e.target.value })} 
                     className="w-full px-5 py-3.5 rounded-2xl bg-black/40 border border-border/40 text-sm font-bold focus:outline-none focus:border-accent/50 transition-all appearance-none cursor-pointer"
                   >
                     {Object.keys(SENSOR_META).map((t) => (
                       <option key={t} value={t} className="bg-surface-solid text-heading font-bold">{t.replace("_", " ").toUpperCase()}</option>
                     ))}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Data Unit</label>
                   <input 
                     type="text" 
                     placeholder="°C, %, ppm, etc" 
                     value={form.unit} 
                     onChange={(e) => setForm({ ...form, unit: e.target.value })} 
                     className="w-full px-5 py-3.5 rounded-2xl bg-black/40 border border-border/40 text-sm font-bold focus:outline-none focus:border-accent/50 transition-all shadow-inner" 
                   />
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Network Access Topic (MQTT)</label>
                <input 
                  type="text" 
                  placeholder="iotzy/sensors/thermal_01" 
                  value={form.topic} 
                  onChange={(e) => setForm({ ...form, topic: e.target.value })} 
                  className="w-full px-5 py-3.5 rounded-2xl bg-black/40 border border-border/40 text-[11px] font-mono font-bold focus:outline-none focus:border-accent/50 transition-all" 
                />
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
                onClick={handleAdd} 
                className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-accent to-accent-light text-bg font-black text-[10px] uppercase tracking-widest shadow-[0_0_15px_var(--accent-glow)] hover:scale-[1.02] transition-all"
              >
                Register Data Stream
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
