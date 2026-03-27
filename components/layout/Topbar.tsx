"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import clsx from "clsx";

const PAGE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/devices": "Perangkat",
  "/sensors": "Sensor",
  "/automation": "Rules Engine",
  "/camera": "Computer Vision",
  "/analytics": "Log & Analytics",
  "/settings": "Pengaturan",
};

interface TopbarProps {
  username: string;
  theme: string;
  onToggleSidebar: () => void;
}

export default function Topbar({
  username,
  theme,
  onToggleSidebar,
}: TopbarProps) {
  const pathname = usePathname();
  const mqttConnected = useAppStore((s) => s.mqttConnected);
  const deviceStates = useAppStore((s) => s.deviceStates);
  const devices = useAppStore((s) => s.devices);
  const sensors = useAppStore((s) => s.sensors);
  const [clock, setClock] = useState("--:--:--");
  const [date, setDate] = useState("");
  const [mounted, setMounted] = useState(false);

  const deviceCount = Object.keys(devices).length;
  const activeCount = Object.values(deviceStates).filter(Boolean).length;
  const sensorCount = Object.keys(sensors).length;

  // Derive page title from pathname (reactive)
  const pageTitle = PAGE_TITLES[pathname] || "Overview";

  // Clock — only start after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString("id-ID", { hour12: false }));
      setDate(
        now
          .toLocaleDateString("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })
          .toUpperCase()
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 right-0 h-topbar z-30 flex items-center justify-between px-6 left-0 lg:left-[var(--sidebar-w)] transition-all duration-300">
      <div className="absolute inset-x-4 inset-y-2 bg-surface/40 backdrop-blur-[var(--glass-blur)] border border-border/50 rounded-2xl shadow-lg flex items-center justify-between px-5">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden w-10 h-10 flex items-center justify-center text-text-secondary hover:text-accent rounded-xl hover:bg-white/5 transition-all duration-300"
          >
            <i className="fas fa-bars-staggered text-lg"></i>
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-[3px] text-text-muted opacity-40">IoTzy</span>
              <span className="text-border">/</span>
            </div>
            <h1 className="font-black text-heading tracking-tight animate-fadeIn">{pageTitle}</h1>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          {/* Stats Bar */}
          <div className="hidden xl:flex items-center gap-3 bg-black/20 p-1 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 px-3 py-1 color-filter transition-all hover:bg-white/5 rounded-lg group">
              <i className="fas fa-microchip text-accent text-xs group-hover:scale-110 transition-transform"></i>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-text-muted leading-none">DEVICES</span>
                <span className="text-xs font-bold text-heading leading-tight">{activeCount}<span className="text-text-muted font-medium opacity-50 ml-0.5">/{deviceCount}</span></span>
              </div>
            </div>
            <div className="w-px h-6 bg-border/50"></div>
            <div className="flex items-center gap-2 px-3 py-1 color-filter transition-all hover:bg-white/5 rounded-lg group">
              <i className="fas fa-signal text-success text-xs group-hover:scale-110 transition-transform"></i>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-text-muted leading-none">SENSORS</span>
                <span className="text-xs font-bold text-heading leading-tight">{sensorCount}</span>
              </div>
            </div>
          </div>

          {/* MQTT Status Chip */}
          <div className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-500",
            mqttConnected 
              ? "bg-success/5 border-success/20 text-success shadow-[0_0_15px_rgba(0,255,157,0.05)]" 
              : "bg-surface/50 border-border/50 text-text-muted"
          )}>
            <div className={clsx(
              "w-1.5 h-1.5 rounded-full",
              mqttConnected ? "bg-success animate-pulse shadow-[0_0_8px_var(--success)]" : "bg-text-muted"
            )} />
            <span className="text-[10px] font-black tracking-widest uppercase">{mqttConnected ? "MQTT ONLINE" : "OFFLINE"}</span>
          </div>

          {/* Clock Section */}
          {mounted && (
            <div className="hidden md:flex flex-col items-end pr-1 border-r border-border/50 mr-1">
              <span className="text-sm font-black font-mono text-heading leading-none tracking-tighter">{clock}</span>
              <span className="text-[9px] font-black text-text-muted tracking-[1px] mt-0.5 opacity-60 uppercase">{date}</span>
            </div>
          )}

          {/* Profile Circle */}
          <div className="group relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-light p-[1px] cursor-pointer hover:shadow-[0_0_15px_var(--accent-glow)] transition-all duration-300">
              <div className="w-full h-full rounded-xl bg-surface-solid flex items-center justify-center text-accent font-black text-sm uppercase">
                {username.charAt(0)}
              </div>
            </div>
            {/* Simple Glow effect */}
            <div className="absolute -inset-1 bg-accent/20 blur-xl opacity-0 group-hover:opacity-40 transition-opacity rounded-full"></div>
          </div>
        </div>
      </div>
    </header>
  );
}
