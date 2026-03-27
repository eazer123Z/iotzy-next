"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { socket } from "@/lib/socket";
import clsx from "clsx";
import type { Device, Sensor, CvState, ActivityLog } from "@/types";

interface DashboardContentProps {
  username: string;
  devices: Device[];
  sensors: Sensor[];
  cvState: CvState | null;
  logs: ActivityLog[];
  stats: {
    totalDevices: number;
    activeDevices: number;
    totalSensors: number;
    onlineSensors: number;
  };
  quickControls: string[];
}

export default function DashboardContent({
  username,
  devices: initialDevices,
  sensors: initialSensors,
  cvState,
  logs: initialLogs,
  stats,
  quickControls,
}: DashboardContentProps) {
  const {
    setDevices,
    setSensors,
    setCv,
    setLogs,
    setQuickControls,
    deviceStates,
    setDeviceState,
    cv: liveCv,
    mqttConnected,
  } = useAppStore();
  
  const [mounted, setMounted] = useState(false);

  // Hydrate store & Socket logic
  useEffect(() => {
    setMounted(true);
    setDevices(initialDevices);
    setSensors(initialSensors);
    if (cvState) setCv(cvState);
    setLogs(initialLogs);
    setQuickControls(quickControls);

    socket.connect();
    socket.on("device_update", (payload: { topic: string; data: any }) => {
      if (payload.data && payload.data.deviceKey) {
        const deviceMatch = initialDevices.find(d => d.deviceKey === payload.data.deviceKey);
        if (deviceMatch && payload.data.state !== undefined) {
          setDeviceState(String(deviceMatch.id), payload.data.state === 1);
        }
      }
    });

    return () => {
      socket.off("device_update");
      socket.disconnect();
    };
  }, [initialDevices, initialSensors, cvState, initialLogs, quickControls, setDevices, setSensors, setCv, setLogs, setQuickControls, setDeviceState]);

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

  const activeCount = Object.values(deviceStates).filter(Boolean).length;
  const personCount = liveCv.personCount ?? cvState?.personCount ?? 0;
  const brightnessVal = liveCv.brightness ?? cvState?.brightness ?? 0;

  if (!mounted) return <div className="loading-screen"><div className="loading-spinner" /></div>;

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1400px] mx-auto">
      {/* ── Welcome Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_var(--success)]" />
            <span className="text-[10px] font-black uppercase tracking-[3px] text-text-muted">Node Synchronized</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-heading tracking-tighter">
            System Overview, <span className="text-accent">{username}</span>
          </h1>
          <p className="text-text-secondary text-sm font-bold opacity-60">Everything is under control. Have a smooth session.</p>
        </div>
        
        <div className="hidden md:flex gap-4">
           <div className="px-5 py-3 rounded-2xl bg-surface border border-border shadow-sm flex items-center gap-3">
              <i className="fas fa-calendar-day text-accent text-xs"></i>
              <span className="text-[11px] font-black uppercase tracking-widest text-text">
                 {new Date().toLocaleDateString("en-US", { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
           </div>
        </div>
      </div>

      {/* ── Metric Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        <StatCard icon="fa-plug" color="text-accent" label="Active Nodes" value={activeCount} sub={`${initialDevices.length} Total Nodes`} />
        <StatCard icon="fa-signal" color="text-success" label="Sensors" value={stats.onlineSensors} sub="Stable Network" />
        <StatCard icon="fa-brain" color="text-info" label="Neural Load" value={`${personCount} Ops`} sub="CV Engine Active" />
        <StatCard icon="fa-shield" color="text-warning" label="Status" value="SECURE" sub="Firewall Enabled" />
      </div>

      {/* ── Main Dashboard Area ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4">
        
        {/* Left: Monitoring & Analytics (8/12) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Neural Analytics Summary */}
          <div className="card p-8 group">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                     <i className="fas fa-chart-line"></i>
                  </div>
                  <div>
                     <h3 className="text-xs font-black uppercase tracking-[2px] text-heading leading-none mb-1">Environmental Telemetry</h3>
                     <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest leading-none">Real-time Data Stream</span>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                     <span className="text-[9px] font-black text-text-muted uppercase">Brightness</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-info" />
                     <span className="text-[9px] font-black text-text-muted uppercase">Power Load</span>
                  </div>
               </div>
            </div>

            <div className="h-[200px] w-full flex items-end justify-between gap-1 group/bars">
               {[40, 60, 45, 90, 65, 55, 80, 70, 40, 50, 85, 95, 75, 60, 45, 30, 55, 65, 80, 90, 50].map((h, i) => (
                 <div key={i} className="flex-1 bg-border/20 rounded-t-lg transition-all duration-500 hover:bg-accent/20 relative group/bar" style={{ height: `${h}%` }}>
                    <div className="absolute inset-x-0 bottom-0 bg-accent/40 rounded-t-lg transition-all duration-500 group-hover/bar:bg-accent" style={{ height: '40%' }} />
                 </div>
               ))}
            </div>
            <div className="mt-6 flex justify-between items-center text-[9px] font-black text-text-muted opacity-40 uppercase tracking-widest">
               <span>Start Session</span>
               <div className="h-[1px] flex-1 mx-8 bg-border/20" />
               <span>Live Telemetry</span>
            </div>
          </div>

          {/* Quick Node Controls */}
          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black uppercase tracking-[2px] text-text-muted">Quick Access Nodes</h3>
                <Link href="/devices" className="text-[10px] font-black text-accent hover:underline uppercase tracking-widest transition-all">View All Nodes</Link>
             </div>
             <div className="node-grid">
                {quickControls.length === 0 ? (
                  <div className="col-span-full card p-10 text-center text-[10px] font-bold text-text-muted uppercase italic tracking-widest">No nodes found in quick access dashboard.</div>
                ) : (
                  quickControls.map((id) => {
                    const dev = initialDevices.find((d) => String(d.id) === id);
                    if (!dev) return null;
                    const isOn = deviceStates[id] ?? Boolean(dev.lastState);
                    return (
                      <div key={id} className="node-card hover:bg-surface-hover transition-all group">
                         <div className="flex items-center justify-between pointer-events-none">
                            <div className="node-icon text-text-muted group-hover:text-accent">
                               <i className={`fas ${dev.icon}`}></i>
                            </div>
                            <div className={clsx("badge", isOn ? "badge-success" : "badge-info")}>{isOn ? "Active" : "Idle"}</div>
                         </div>
                         <div className="mt-2">
                            <h4 className="text-sm font-black text-heading uppercase tracking-tight truncate">{dev.name}</h4>
                            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{dev.type}</p>
                         </div>
                         <div className="mt-4 flex items-center justify-between border-t border-border/20 pt-4">
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Manual Override</span>
                            <label className="toggle-wrap">
                               <input type="checkbox" checked={isOn} onChange={() => toggleDevice(id)} />
                               <span className="toggle-slider"></span>
                            </label>
                         </div>
                      </div>
                    );
                  })
                )}
             </div>
          </div>
        </div>

        {/* Right: Activity & Intelligence (4/12) */}
        <div className="lg:col-span-4 space-y-8">
           
           {/* Intelligence Widget */}
           <div className="card p-6 bg-gradient-to-br from-surface to-bg relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/5 blur-3xl rounded-full" />
              <div className="flex items-center gap-3 mb-6 relative z-10">
                 <div className="w-10 h-10 rounded-2xl bg-accent-bg flex items-center justify-center text-accent">
                    <i className="fas fa-bolt-lightning text-sm"></i>
                 </div>
                 <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-heading leading-none">Neural Hub</h3>
                    <span className="text-[9px] font-bold text-text-muted uppercase">Sub-System Status</span>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 relative z-10">
                 <div className="p-4 rounded-2xl bg-black/10 border border-border/20">
                    <span className="text-[8px] font-black text-text-muted uppercase tracking-widest block mb-1">Brightness</span>
                    <span className="text-xl font-black text-heading font-mono">{brightnessVal}%</span>
                    <div className="progress-rail mt-3">
                       <div className="progress-bar bg-accent" style={{ width: `${brightnessVal}%` }} />
                    </div>
                 </div>
                 <div className="p-4 rounded-2xl bg-black/10 border border-border/20">
                    <span className="text-[8px] font-black text-text-muted uppercase tracking-widest block mb-1">MQTT Traffic</span>
                    <span className="text-xl font-black text-success font-mono">1.2kb/s</span>
                    <div className="progress-rail mt-3">
                       <div className="progress-bar bg-success" style={{ width: '65%' }} />
                    </div>
                 </div>
              </div>
           </div>

           {/* System Logs */}
           <div className="card flex flex-col h-[520px]">
              <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between">
                 <h3 className="text-[10px] font-black uppercase tracking-[3px] text-text-muted opacity-40">System Journal</h3>
                 <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-border" />
                    <div className="w-1.5 h-1.5 rounded-full bg-border" />
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scrollbar-hide">
                 {initialLogs.map((log, i) => (
                    <div key={i} className="flex gap-4 group animate-fadeIn" style={{ animationDelay: `${i * 50}ms` }}>
                       <div className="flex flex-col items-center">
                          <div className={clsx(
                             "w-8 h-8 rounded-xl flex items-center justify-center text-[10px] border transition-all duration-300",
                             log.logType === 'error' ? "bg-danger-bg border-danger/20 text-danger" : "bg-bg-2 border-border/50 text-text-muted group-hover:text-accent group-hover:border-accent/40"
                          )}>
                             <i className={`fas ${log.triggerType === 'Manual' ? 'fa-user' : 'fa-robot'}`}></i>
                          </div>
                          {i !== initialLogs.length - 1 && <div className="w-[1px] flex-1 bg-border/20 mt-2"></div>}
                       </div>
                       <div className="flex-1 min-w-0 pb-2">
                          <div className="flex justify-between items-start">
                             <h4 className="text-xs font-black text-heading uppercase tracking-tight truncate">{log.activity}</h4>
                             <span className="text-[8px] font-mono text-text-muted mt-1">{new Date(log.createdAt).toLocaleTimeString("en-US", { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-[10px] font-semibold text-text-secondary leading-normal opacity-50 truncate">{log.deviceName} system execute.</p>
                       </div>
                    </div>
                 ))}
              </div>
              <Link href="/analytics" className="m-4 py-3 rounded-2xl bg-bg-2 border border-border/40 text-[9px] font-black uppercase tracking-widest text-text-muted text-center hover:bg-accent-bg hover:text-accent transition-all">Expand View Log</Link>
           </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, color, label, value, sub }: { icon: string; color: string; label: string; value: string | number; sub: string }) {
  return (
    <div className="card p-6 flex flex-col gap-4 relative overflow-hidden group hover:bg-surface-hover">
       <div className={`w-12 h-12 rounded-2xl ${color.replace('text-', 'bg-')}/10 flex items-center justify-center ${color} text-xl transition-transform duration-500 group-hover:scale-110`}>
          <i className={`fas ${icon}`}></i>
       </div>
       <div>
          <span className="text-[28px] font-black text-heading font-mono leading-none tracking-tighter">{value}</span>
          <h4 className="text-[10px] font-black uppercase tracking-[2.5px] text-text-muted mt-2 leading-none opacity-40">{label}</h4>
          <p className="text-[9px] font-bold text-text-secondary mt-2 opacity-60 italic">{sub}</p>
       </div>
       <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
          <i className={`fas ${icon} text-5xl`}></i>
       </div>
    </div>
  );
}
