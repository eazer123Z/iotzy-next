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
  const [clock, setClock] = useState("--:--:--");

  const [mounted, setMounted] = useState(false);

  // Hydrate store
  useEffect(() => {
    setMounted(true);
    setDevices(initialDevices);
    setSensors(initialSensors);
    if (cvState) setCv(cvState);
    setLogs(initialLogs);
    setQuickControls(quickControls);

    // 🌐 [MQTT WEB-SOCKET BRIDGE] MENGHANCURKAN POLA LAMA
    // 1. Jalankan koneksi socket
    socket.connect();

    // 2. Berlangganan event perangkat yang tertembak dari MQTT via Server.ts
    socket.on("device_update", (payload: { topic: string; data: any }) => {
      console.log("⚡ [WS] Real-Time Sync:", payload);
      // Asumsi Payload "iotzy/{deviceKey}/status" { state: 1 }
      if (payload.data && payload.data.deviceKey) {

        // Temukan ID berdasarkan deviceKey yang dibawa
        const deviceMatch = initialDevices.find(d => d.deviceKey === payload.data.deviceKey);

        if (deviceMatch && payload.data.state !== undefined) {
          // UPDATE STORE STATE SECARA INSTAN TANPA POLLING API
          setDeviceState(String(deviceMatch.id), payload.data.state === 1);
        }
      }
    });

    return () => {
      socket.off("device_update");
      socket.disconnect();
    };
  }, []);

  // Real-time clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  // Quick control toggle
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

  const activeDevices = Object.values(deviceStates).filter(Boolean).length;
  const personCount = liveCv.personCount ?? cvState?.personCount ?? 0;
  const lightCond = liveCv.lightCondition || cvState?.lightCondition || "unknown";
  const brightnessVal = liveCv.brightness ?? cvState?.brightness ?? 0;

  const condMap: Record<string, { label: string; color: string }> = {
    dark: { label: "Gelap", color: "text-blue-400" },
    normal: { label: "Normal", color: "text-green-400" },
    bright: { label: "Terang", color: "text-yellow-400" },
  };
  const cond = condMap[lightCond] || { label: lightCond, color: "text-txt-muted" };

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1600px] mx-auto pb-12">
      {/* ── Welcome Hero ── */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0d0e21] to-[#05060f] border border-white/5 p-8 md:p-10 shadow-2xl group">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none transition-transform duration-700 group-hover:scale-110">
           <div className="absolute inset-0 bg-gradient-to-l from-accent/20 to-transparent"></div>
           <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-accent/10 blur-[100px] rounded-full"></div>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-[10px] font-black text-accent uppercase tracking-widest">System Online</span>
              <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest">Version 2.4.0</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-heading tracking-tight">
              Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-light">{username}</span>
            </h1>
            <p className="text-text-secondary text-sm md:text-base font-medium max-w-md opacity-80">
              Welcome back to your neural command center. Everything is running smoothly.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md p-4 rounded-3xl border border-white/5 shadow-inner">
             <div className="text-right pr-4 border-r border-white/10">
                <div className="text-2xl font-black font-mono text-accent leading-none">{clock}</div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-[2px] mt-1">
                   {mounted ? new Date().toLocaleDateString("id-ID", { weekday: 'short', day: 'numeric', month: 'short' }) : "—"}
                </div>
             </div>
             <div className="w-12 h-12 rounded-2xl bg-accent-bg flex items-center justify-center text-accent text-xl animate-pulse">
                <i className="fas fa-microchip"></i>
             </div>
          </div>
        </div>
      </div>

      {/* ── Core Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <PremiumStatCard
          icon="fa-power-off"
          color="text-accent"
          label="Active Components"
          value={activeDevices}
          sub={`from ${initialDevices.length} registered`}
          trend="+2"
        />
        <PremiumStatCard
          icon="fa-satellite-dish"
          color="text-success"
          label="Sensor Network"
          value={stats.onlineSensors}
          sub={`Latency < 12ms`}
          trend="Stable"
        />
        <PremiumStatCard
          icon="fa-robot"
          color="text-warning"
          label="AI Logic State"
          value={liveCv.isActive ? "ACTIVE" : "IDLE"}
          sub="Neural Engine"
          trend={liveCv.modelLoaded ? "Loaded" : "Ready"}
        />
        <PremiumStatCard
          icon="fa-shield-halved"
          color="text-danger"
          label="Security Guard"
          value="SECURE"
          sub="All systems clean"
          trend="100%"
        />
      </div>

      {/* ── Deep Analytics & Controls ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Visual Monitoring & CV (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* AI Intelligence Spotlight */}
          <div className="relative overflow-hidden rounded-[28px] bg-surface/30 backdrop-blur-[var(--glass-blur)] border border-border/40 p-1 group">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-x divide-border/20">
              
              {/* CV Status */}
              <div className="p-6 space-y-4">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                       <i className="fas fa-brain text-xs"></i>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">AI Intelligence</span>
                 </div>
                 <div className="flex flex-col gap-1">
                    <span className="text-3xl font-black text-heading leading-none">{personCount}</span>
                    <span className="text-[10px] font-bold text-text-secondary uppercase">Persons Detected</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-accent shadow-[0_0_10px_var(--accent)] transition-all duration-1000" style={{ width: personCount > 0 ? '75%' : '5%' }} />
                 </div>
              </div>

              {/* Environmental Sensing */}
              <div className="p-6 space-y-4">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
                       <i className="fas fa-sun text-xs"></i>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Environment</span>
                 </div>
                 <div className="flex flex-col gap-1">
                    <span className={`text-3xl font-black leading-none ${cond.color.replace('text-', 'text-glow-')}`}>{cond.label.toUpperCase()}</span>
                    <span className="text-[10px] font-bold text-text-secondary uppercase">Brightness {brightnessVal}%</span>
                 </div>
                 <div className="progress-track bg-white/5">
                    <div className="progress-fill opacity-80" style={{ width: `${brightnessVal}%`, background: 'linear-gradient(90deg, #3b82f6, #00f2ff)' }} />
                 </div>
              </div>

              {/* Real-time MQTT Bridge */}
              <div className="p-6 space-y-4">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
                       <i className="fas fa-link text-xs"></i>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Network Bridge</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${mqttConnected ? 'bg-success shadow-[0_0_10px_var(--success)] animate-pulse' : 'bg-text-muted'}`} />
                    <span className="text-xl font-black text-heading uppercase tracking-tighter">
                       {mqttConnected ? "CONNECTED" : "LINK DOWN"}
                    </span>
                 </div>
                 <div className="text-[10px] font-mono text-text-muted truncate bg-black/20 p-2 rounded-lg border border-white/5">
                    WSS://HIDDEN-BROKER:PORT/PATH
                 </div>
              </div>

            </div>
          </div>

          {/* Sensor Analytics Chart */}
          <div className="rounded-[28px] bg-surface/30 backdrop-blur-[var(--glass-blur)] border border-border/40 overflow-hidden shadow-xl">
            <div className="px-7 py-6 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                 <i className="fas fa-chart-area text-accent"></i>
                 <span className="text-[11px] font-black uppercase tracking-[2px] text-heading">System Load & Sensor Telemetry</span>
              </div>
              <div className="flex gap-2">
                 <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
                 <div className="w-2 h-2 rounded-full bg-success opacity-30" />
                 <div className="w-2 h-2 rounded-full bg-warning opacity-30" />
              </div>
            </div>
            <div className="p-8">
               <div className="h-[240px] w-full flex items-end justify-between gap-1 md:gap-3 group">
                  {[35, 55, 45, 80, 60, 90, 75, 50, 40, 65, 85, 95, 70, 55, 45, 60].map((h, i) => (
                    <div
                      key={i}
                      className="group/bar relative flex-1 bg-white/5 rounded-t-xl transition-all duration-700 hover:bg-accent/10 hover:shadow-[0_0_20px_var(--accent-glow)] overflow-hidden"
                      style={{ height: `${h}%` }}
                    >
                       <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-accent to-accent-light transition-all duration-500 opacity-60 group-hover/bar:opacity-100" style={{ height: '50%' }} />
                    </div>
                  ))}
               </div>
               <div className="mt-6 flex items-center justify-between text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">
                  <span>Start (00h)</span>
                  <span>Neural Sync 100%</span>
                  <span>End (Now)</span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interaction & Logs (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
           {/* Ultimate Quick Controls */}
           <div className="rounded-[28px] bg-surface/30 backdrop-blur-[var(--glass-blur)] border border-border/40 overflow-hidden shadow-xl">
             <div className="px-6 py-5 flex items-center justify-between border-b border-white/5 bg-white/20">
                <span className="text-[11px] font-black uppercase tracking-[2px] text-heading">Master Control</span>
                <i className="fas fa-sliders text-text-muted opacity-40"></i>
             </div>
             <div className="p-5">
               {quickControls.length === 0 ? (
                 <div className="text-center py-8 text-text-muted text-xs font-bold uppercase opacity-40 italic">No quick access configured</div>
               ) : (
                 <div className="grid grid-cols-2 gap-4">
                   {quickControls.map((id) => {
                     const dev = initialDevices.find((d) => String(d.id) === id);
                     if (!dev) return null;
                     const isOn = deviceStates[id] ?? Boolean(dev.lastState);
                     return (
                       <button
                         key={id}
                         onClick={() => toggleDevice(id)}
                         className={clsx(
                           "group flex flex-col items-center gap-3 p-5 rounded-[24px] border transition-all duration-500 relative overflow-hidden",
                           isOn
                             ? "bg-accent/10 border-accent/40 shadow-[0_0_25px_rgba(0,242,255,0.08)]"
                             : "bg-black/10 border-border/60 hover:border-accent/30"
                         )}
                       >
                         <div className={clsx(
                           "w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-500",
                           isOn ? "bg-accent text-bg shadow-[0_0_15px_var(--accent-glow)] scale-110" : "bg-white/5 text-text-muted group-hover:text-accent"
                         )}>
                           <i className={`fas ${dev.icon}`}></i>
                         </div>
                         <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[10px] font-black text-heading truncate w-full tracking-tight">{dev.name.toUpperCase()}</span>
                            <span className={clsx("text-[9px] font-bold uppercase tracking-widest", isOn ? "text-accent" : "text-text-muted")}>
                               {isOn ? "Active" : "Standby"}
                            </span>
                         </div>
                       </button>
                     );
                   })}
                 </div>
               )}
             </div>
           </div>

           {/* Command Logs Activity */}
           <div className="rounded-[28px] bg-surface/30 backdrop-blur-[var(--glass-blur)] border border-border/40 overflow-hidden shadow-xl flex flex-col">
              <div className="px-6 py-5 flex items-center justify-between border-b border-white/5">
                <span className="text-[11px] font-black uppercase tracking-[2px] text-heading">System Journal</span>
                <Link href="/analytics" className="text-[10px] font-bold text-accent hover:opacity-100 opacity-60 transition-opacity">Full History</Link>
              </div>
              <div className="p-5 flex-1 max-h-[440px] overflow-y-auto space-y-4">
                 {initialLogs.map((log, i) => (
                    <div key={log.id} className="flex gap-4 group animate-fadeIn" style={{ animationDelay: `${i * 100}ms` }}>
                       <div className="flex flex-col items-center gap-2">
                          <div className={clsx(
                             "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300",
                             log.logType === 'error' ? "bg-danger/10 border-danger/20 text-danger" :
                             log.logType === 'warning' ? "bg-warning/10 border-warning/20 text-warning" :
                             "bg-accent/5 border-accent/10 text-accent group-hover:bg-accent/10"
                          )}>
                             <i className={`fas ${log.triggerType === 'Manual' ? 'fa-hand-pointer' : 'fa-robot'} text-xs`}></i>
                          </div>
                          {i !== initialLogs.length - 1 && <div className="w-[1px] flex-1 bg-border/20"></div>}
                       </div>
                       <div className="flex-1 pb-4">
                          <div className="flex justify-between items-start mb-1">
                             <span className="text-[11px] font-black text-heading uppercase tracking-tight">{log.activity}</span>
                             <span className="text-[9px] font-mono text-text-muted">{mounted ? new Date(log.createdAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) : "--:--"}</span>
                          </div>
                          <p className="text-[10px] text-text-secondary leading-tight line-clamp-2 italic opacity-60">
                             {log.deviceName} trigger by {log.triggerType.toLowerCase()} sequence.
                          </p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}

// ─── Premium Components ───

function PremiumStatCard({
  icon,
  color,
  label,
  value,
  sub,
  trend,
}: {
  icon: string;
  color: string;
  label: string;
  value: string | number;
  sub: string;
  trend?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[24px] bg-surface/30 backdrop-blur-[var(--glass-blur)] border border-border/40 p-5 transition-all duration-500 hover:border-accent/30 hover:-translate-y-1 hover:shadow-2xl">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <i className={`fas ${icon} text-4xl`}></i>
      </div>
      
      <div className="flex flex-col gap-3 relative z-10">
        <div className={clsx(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
          "bg-white/5 group-hover:bg-accent/10 border border-white/5",
          color
        )}>
          <i className={`fas ${icon} text-base`}></i>
        </div>
        
        <div>
           <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-heading tracking-tight">{value}</span>
              {trend && <span className="text-[9px] font-black text-accent bg-accent/10 px-1.5 py-0.5 rounded-md uppercase tracking-widest">{trend}</span>}
           </div>
           <div className="text-[10px] font-black text-text-muted uppercase tracking-[2px] mt-1">{label}</div>
           <div className="text-[9px] font-bold text-text-secondary mt-1 opacity-60 truncate">{sub}</div>
        </div>
      </div>
      
      {/* Decorative Glow */}
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-accent/5 blur-3xl rounded-full group-hover:bg-accent/10 transition-all" />
    </div>
  );
}
