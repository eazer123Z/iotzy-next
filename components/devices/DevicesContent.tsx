"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import clsx from "clsx";
import type { Device } from "@/types";

const DEVICE_ICONS: Record<string, string> = {
  light: "fa-lightbulb",
  fan: "fa-wind",
  ac: "fa-snowflake",
  tv: "fa-tv",
  lock: "fa-lock",
  door: "fa-door-open",
  cctv: "fa-video",
  speaker: "fa-volume-up",
  switch: "fa-plug",
};

export default function DevicesContent({
  devices: initialDevices,
}: {
  devices: Device[];
}) {
  const { devices, deviceStates, setDevices, setDeviceState } = useAppStore();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    icon: "fa-plug",
    topic_sub: "",
    topic_pub: "",
  });

  useEffect(() => {
    setDevices(initialDevices);
  }, []);

  const filtered = Object.values(devices).filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleDevice = useCallback(
    async (id: string) => {
      const current = deviceStates[id] ?? false;
      setDeviceState(id, !current);
      await fetch("/api/devices/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(id), state: !current }),
      });
    },
    [deviceStates, setDeviceState]
  );

  async function handleAdd() {
    if (!form.name.trim()) return;
    const method = editId ? "PUT" : "POST";
    const body = editId ? { id: Number(editId), ...form } : form;
    const res = await fetch("/api/devices", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setShowAdd(false);
      setEditId(null);
      setForm({ name: "", icon: "fa-plug", topic_sub: "", topic_pub: "" });
      const data = await fetch("/api/devices").then((r) => r.json());
      setDevices(data);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus perangkat ini?")) return;
    await fetch(`/api/devices?id=${id}`, { method: "DELETE" });
    useAppStore.getState().removeDevice(id);
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1600px] mx-auto pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-1">
           <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_var(--accent)]" />
              <span className="text-[10px] font-black uppercase tracking-[3px] text-accent opacity-70">Neural Network</span>
           </div>
           <h2 className="text-3xl font-black text-heading tracking-tight">Devices <span className="text-text-muted opacity-30">Monitoring</span></h2>
           <p className="text-sm text-text-secondary font-medium opacity-60">Manage and automate your connected hardware ecosystem.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                 <i className="fas fa-search text-text-muted text-xs group-focus-within:text-accent transition-colors"></i>
              </div>
              <input
                type="text"
                placeholder="Search command..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 pr-4 py-3 rounded-2xl bg-surface/50 backdrop-blur-md border border-border/40 text-sm focus:outline-none focus:border-accent/50 focus:shadow-[0_0_20px_rgba(0,242,255,0.05)] transition-all w-full md:w-64 placeholder:text-text-muted/50 font-semibold"
              />
           </div>
           <button
             onClick={() => {
               setShowAdd(true);
               setEditId(null);
               setForm({ name: "", icon: "fa-plug", topic_sub: "", topic_pub: "" });
             }}
             className="px-6 py-3 rounded-2xl bg-gradient-to-br from-accent to-accent-light text-bg font-black text-xs uppercase tracking-widest shadow-[0_0_20px_var(--accent-glow)] hover:scale-105 transition-all active:scale-95 flex items-center gap-2"
           >
             <i className="fas fa-plus"></i>
             <span>New Device</span>
           </button>
        </div>
      </div>

      {/* ── Device Grid ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-[32px] bg-surface/20 border border-dashed border-border/40 animate-fadeIn">
           <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-text-muted mb-6">
              <i className="fas fa-microchip text-4xl opacity-20"></i>
           </div>
           <p className="text-lg font-bold text-text-muted mb-6">
              {search ? "No matches found in neural DB" : "No devices connected to this node"}
           </p>
           {!search && (
              <button onClick={() => setShowAdd(true)} className="btn-primary">
                 <i className="fas fa-plus mr-2"></i>Initialize First Device
              </button>
           )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {filtered.map((dev) => {
              const id = String(dev.id);
              const isOn = deviceStates[id] ?? Boolean(dev.lastState);
              return (
                <div
                  key={dev.id}
                  className={clsx(
                    "group relative p-6 rounded-[32px] border transition-all duration-700 cursor-pointer overflow-hidden flex flex-col gap-6",
                    isOn 
                      ? "bg-accent/5 border-accent/40 shadow-[0_0_40px_rgba(0,242,255,0.08)]" 
                      : "bg-surface/30 border-border/40 hover:border-accent/30"
                  )}
                  onClick={() => toggleDevice(id)}
                >
                  {/* Decorative Elements */}
                  <div className={clsx(
                    "absolute -top-10 -right-10 w-32 h-32 bg-accent/5 blur-3xl rounded-full transition-opacity duration-700",
                    isOn ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                  )} />

                  {/* Top Actions */}
                  <div className="flex items-start justify-between relative z-10">
                    <div className={clsx(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-500",
                      isOn ? "bg-accent text-bg shadow-[0_0_20px_var(--accent-glow)] scale-110" : "bg-white/5 text-text-muted"
                    )}>
                       <i className={`fas ${dev.icon}`}></i>
                    </div>
                    
                    <div className="flex gap-2">
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           setEditId(id);
                           setForm({ name: dev.name, icon: dev.icon, topic_sub: dev.topicSub || "", topic_pub: dev.topicPub || "" });
                           setShowAdd(true);
                         }}
                         className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-muted text-[10px] border border-white/5 hover:bg-accent/10 hover:text-accent transition-all"
                       >
                         <i className="fas fa-pen"></i>
                       </button>
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           handleDelete(id);
                         }}
                         className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-muted text-[10px] border border-white/5 hover:bg-danger/10 hover:text-danger transition-all"
                       >
                         <i className="fas fa-trash"></i>
                       </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-1 relative z-10">
                    <h4 className="font-black text-heading text-lg tracking-tight truncate">{dev.name.toUpperCase()}</h4>
                    <div className="flex items-center gap-2">
                       <div className={clsx("w-1.5 h-1.5 rounded-full", isOn ? "bg-success animate-pulse" : "bg-text-muted opacity-40")} />
                       <span className="text-[10px] font-black uppercase tracking-[2px] text-text-muted opacity-60">
                          {dev.topicSub || "NEURAL_LINK_NULL"}
                       </span>
                    </div>
                  </div>

                  {/* Footer Stats & Toggle */}
                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5 relative z-10">
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">Status</span>
                        <span className={clsx("text-xs font-black uppercase tracking-tight", isOn ? "text-accent" : "text-text-muted")}>
                           {isOn ? "Operational" : "Standby"}
                        </span>
                     </div>
                     
                     <div className={clsx(
                        "w-12 h-6 rounded-full relative transition-all duration-500 overflow-hidden",
                        isOn ? "bg-success shadow-[0_0_15px_var(--success-bg)]" : "bg-white/10"
                     )}>
                        <div className={clsx(
                           "absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-500",
                           isOn ? "left-7" : "left-1"
                        )} />
                     </div>
                  </div>
                </div>
              );
           })}
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-lg rounded-[32px] bg-surface-solid border border-border/50 shadow-2xl overflow-hidden animate-slideIn">
            <div className="px-8 py-6 border-b border-border/50 bg-white/5">
               <h3 className="text-xl font-black text-heading tracking-tight uppercase">
                 {editId ? "Update Node" : "Register Node"}
               </h3>
               <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">Configure hardware parameters</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Node Identifier</label>
                 <input
                   type="text"
                   placeholder="e.g. Smart LED Matrix"
                   value={form.name}
                   onChange={(e) => setForm({ ...form, name: e.target.value })}
                   className="w-full px-5 py-3.5 rounded-2xl bg-black/40 border border-border/40 text-sm font-bold placeholder:text-text-muted/40 focus:outline-none focus:border-accent/50 focus:shadow-[0_0_15px_rgba(0,242,255,0.05)] transition-all"
                 />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Visual Signature (Icon)</label>
                <div className="grid grid-cols-5 gap-3">
                  {Object.entries(DEVICE_ICONS).map(([key, icon]) => (
                    <button
                      key={key}
                      onClick={() => setForm({ ...form, icon })}
                      className={clsx(
                        "w-full aspect-square rounded-2xl flex items-center justify-center text-lg transition-all duration-300",
                        form.icon === icon
                          ? "bg-accent text-bg shadow-[0_0_15px_var(--accent-glow)] scale-105"
                          : "bg-white/5 text-text-muted hover:bg-white/10 hover:text-heading"
                      )}
                    >
                      <i className={`fas ${icon}`}></i>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Telemetry Sub</label>
                    <input
                      type="text"
                      placeholder="iotzy/sub/topic"
                      value={form.topic_sub}
                      onChange={(e) => setForm({ ...form, topic_sub: e.target.value })}
                      className="w-full px-5 py-3.5 rounded-2xl bg-black/40 border border-border/40 text-[11px] font-mono focus:outline-none focus:border-accent/50 transition-all font-bold"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Command Pub</label>
                    <input
                      type="text"
                      placeholder="iotzy/pub/topic"
                      value={form.topic_pub}
                      onChange={(e) => setForm({ ...form, topic_pub: e.target.value })}
                      className="w-full px-5 py-3.5 rounded-2xl bg-black/40 border border-border/40 text-[11px] font-mono focus:outline-none focus:border-accent/50 transition-all font-bold"
                    />
                 </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-white/5 border-t border-border/50 flex gap-4">
              <button
                onClick={() => { setShowAdd(false); setEditId(null); }}
                className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-text-secondary font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Abort
              </button>
              <button 
                onClick={handleAdd} 
                className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-accent to-accent-light text-bg font-black text-[10px] uppercase tracking-widest shadow-[0_0_15px_var(--accent-glow)] hover:scale-[1.02] transition-all"
              >
                {editId ? "Confirm Update" : "Establish Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
