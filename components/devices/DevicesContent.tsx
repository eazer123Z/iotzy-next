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
  const { devices, deviceStates, setDevices, setDeviceState, removeDevice } = useAppStore();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    icon: "fa-plug",
    topic_sub: "",
    topic_pub: "",
    deviceKey: "",
  });

  useEffect(() => {
    setDevices(initialDevices);
  }, [initialDevices, setDevices]);

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

  async function handleSubmit() {
    if (!form.name.trim()) return;
    const method = editId ? "PUT" : "POST";
    const body = editId ? { id: Number(editId), ...form } : form;
    const res = await fetch("/api/devices", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setShowModal(false);
      setEditId(null);
      setForm({ name: "", icon: "fa-plug", topic_sub: "", topic_pub: "", deviceKey: "" });
      const data = await fetch("/api/devices").then((r) => r.json());
      setDevices(data);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Terminate this node link?")) return;
    const res = await fetch(`/api/devices?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      removeDevice(id);
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1400px] mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)]" />
            <span className="text-[10px] font-black uppercase tracking-[3px] text-text-muted">Node Fleet Management</span>
          </div>
          <h1 className="text-3xl font-black text-heading tracking-tighter">Connected Devices</h1>
          <p className="text-text-secondary text-sm font-bold opacity-60">Control and configure your IoT ecosystem hubs.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="relative group">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[10px] text-text-muted"></i>
              <input
                type="text"
                placeholder="Find node..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-6 py-3 rounded-2xl bg-surface border border-border focus:border-accent/40 focus:outline-none focus:shadow-sm transition-all text-xs font-bold w-full md:w-64"
              />
           </div>
           <button
             onClick={() => {
               setEditId(null);
               setForm({ name: "", icon: "fa-plug", topic_sub: "", topic_pub: "", deviceKey: "" });
               setShowModal(true);
             }}
             className="px-6 py-3 rounded-2xl bg-accent text-bg text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-all active:scale-95"
           >
             Initialize Node
           </button>
        </div>
      </div>

      {/* ── Device Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4">
        {filtered.map((dev) => {
          const id = String(dev.id);
          const isOn = deviceStates[id] ?? Boolean(dev.lastState);
          return (
            <div
              key={dev.id}
              className={clsx(
                "card p-6 flex flex-col gap-6 relative overflow-hidden transition-all group",
                isOn ? "border-accent/30 bg-accent/5" : "hover:border-accent/20"
              )}
            >
              {/* Header Info */}
              <div className="flex items-start justify-between relative z-10">
                <div className={clsx(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-500",
                  isOn ? "bg-accent text-bg shadow-sm" : "bg-bg-2 text-text-muted group-hover:text-accent"
                )}>
                   <i className={`fas ${dev.icon}`}></i>
                </div>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       setEditId(id);
                       setForm({ name: dev.name, icon: dev.icon, topic_sub: dev.topicSub || "", topic_pub: dev.topicPub || "", deviceKey: dev.deviceKey || "" });
                       setShowModal(true);
                     }}
                     className="w-8 h-8 rounded-xl bg-bg-2 flex items-center justify-center text-[10px] text-text-muted hover:text-accent transition-colors"
                   >
                     <i className="fas fa-sliders"></i>
                   </button>
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       handleDelete(id);
                     }}
                     className="w-8 h-8 rounded-xl bg-bg-2 flex items-center justify-center text-[10px] text-text-muted hover:text-danger transition-colors"
                   >
                     <i className="fas fa-trash-alt"></i>
                   </button>
                </div>
              </div>

              {/* Identity */}
              <div className="space-y-1 relative z-10">
                <h3 className="text-lg font-black text-heading uppercase tracking-tighter truncate leading-none">{dev.name}</h3>
                <div className="flex items-center gap-2">
                   <div className={clsx("w-1.5 h-1.5 rounded-full", isOn ? "bg-success animate-pulse shadow-[0_0_8px_var(--success)]" : "bg-text-muted")} />
                   <span className="text-[10px] font-black uppercase tracking-[2px] text-text-muted">
                      {dev.type?.toUpperCase() || "NODE"}
                   </span>
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="flex items-center justify-between pt-6 border-t border-border/40 relative z-10 mt-auto">
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">State Control</span>
                    <span className={clsx("text-[10px] font-black uppercase tracking-tight", isOn ? "text-success" : "text-text-muted")}>
                       {isOn ? "CONNECTED" : "STANDBY"}
                    </span>
                 </div>
                 
                 <label className="toggle-wrap">
                    <input type="checkbox" checked={isOn} onChange={() => toggleDevice(id)} />
                    <span className="toggle-slider"></span>
                 </label>
              </div>

              {/* Decorative Abstract */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-accent/5 blur-3xl rounded-full opacity-40" />
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full card p-24 flex flex-col items-center justify-center text-center space-y-4 border-dashed opacity-50">
             <div className="w-16 h-16 rounded-full bg-bg-2 flex items-center justify-center text-text-muted text-2xl">
                <i className="fas fa-satellite"></i>
             </div>
             <div>
                <h4 className="text-sm font-black text-heading uppercase">No Nodes Found</h4>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Adjust search or register new node</p>
             </div>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-bg/60 backdrop-blur-xl z-[60] flex items-center justify-center p-6 animate-fadeIn">
          <div className="card w-full max-w-lg overflow-hidden animate-slideUp shadow-2xl">
            <div className="px-8 py-6 border-b border-border shadow-sm flex items-center justify-between bg-white/[0.02]">
               <h2 className="text-lg font-black text-heading uppercase tracking-tighter">
                  {editId ? "Configure Node" : "Initialize New Node"}
               </h2>
               <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-danger">
                  <i className="fas fa-times"></i>
               </button>
            </div>
            
            <div className="p-8 space-y-6">
               <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Node Identifier</label>
                  <input
                    type="text"
                    placeholder="e.g. Master Living Light"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl bg-bg-2 border border-border focus:border-accent/40 focus:outline-none text-xs font-bold"
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Topic Sub</label>
                     <input
                       type="text"
                       placeholder="topic/status"
                       value={form.topic_sub}
                       onChange={(e) => setForm({ ...form, topic_sub: e.target.value })}
                       className="w-full px-5 py-3.5 rounded-2xl bg-bg-2 border border-border focus:border-accent/40 focus:outline-none text-xs font-mono"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Topic Pub</label>
                     <input
                       type="text"
                       placeholder="topic/cmd"
                       value={form.topic_pub}
                       onChange={(e) => setForm({ ...form, topic_pub: e.target.value })}
                       className="w-full px-5 py-3.5 rounded-2xl bg-bg-2 border border-border focus:border-accent/40 focus:outline-none text-xs font-mono"
                     />
                  </div>
               </div>

               <div className="space-y-4">
                  <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Visual Profile</label>
                  <div className="grid grid-cols-5 gap-3">
                     {Object.entries(DEVICE_ICONS).map(([key, icon]) => (
                        <button
                          key={key}
                          onClick={() => setForm({ ...form, icon })}
                          className={clsx(
                            "w-full aspect-square rounded-xl flex items-center justify-center text-lg transition-all",
                            form.icon === icon ? "bg-accent text-bg shadow-sm scale-110" : "bg-bg-2 text-text-muted hover:bg-surface"
                          )}
                        >
                           <i className={`fas ${icon}`}></i>
                        </button>
                     ))}
                  </div>
               </div>
            </div>

            <div className="px-8 py-6 bg-white/[0.02] border-t border-border flex gap-4">
               <button onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-2xl bg-bg-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-heading transition-colors">Discard</button>
               <button onClick={handleSubmit} className="flex-1 py-4 rounded-2xl bg-accent text-bg text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-[1.02] active:scale-95 transition-all">
                  {editId ? "Update Link" : "Establish Link"}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
