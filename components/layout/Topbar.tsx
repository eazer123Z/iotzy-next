"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import clsx from "clsx";

const PAGE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/devices": "Devices",
  "/sensors": "Sensors",
  "/automation": "Logic Grid",
  "/camera": "Vision HUD",
  "/analytics": "System Logs",
  "/settings": "Settings Hub",
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
  const [clock, setClock] = useState("--:--");
  const [date, setDate] = useState("");
  const [mounted, setMounted] = useState(false);

  const deviceCount = Object.keys(devices).length;
  const activeCount = Object.values(deviceStates).filter(Boolean).length;
  const pageTitle = PAGE_TITLES[pathname] || "Console";

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
      setDate(now.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }).toUpperCase());
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 right-0 h-[var(--topbar-h)] z-40 bg-bg border-b border-border flex items-center justify-between px-6 left-0 lg:left-[var(--sidebar-w)] transition-all">
      {/* Left Area (Title) */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden w-10 h-10 flex items-center justify-center text-text-secondary hover:text-accent rounded-xl hover:bg-accent-bg transition-all"
        >
          <i className="fas fa-bars-staggered"></i>
        </button>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[3px] text-txt-muted opacity-40">System</span>
            <span className="text-border">/</span>
          </div>
          <h1 className="font-black text-lg text-heading tracking-tight animate-fadeIn">{pageTitle}</h1>
        </div>
      </div>

      {/* Right Area (Status & Context) */}
      <div className="flex items-center gap-4">
        {/* Quick Stats Group */}
        <div className="hidden xl:flex items-center gap-6 px-6 py-2 rounded-2xl bg-bg-2 border border-border/40">
           <div className="flex items-center gap-2 group">
              <i className="fas fa-plug text-accent text-xs transition-transform group-hover:scale-125"></i>
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-txt-muted uppercase tracking-widest leading-none mb-1">Active Nodes</span>
                 <span className="text-xs font-black text-heading leading-tight">{activeCount}<span className="text-txt-muted opacity-40 ml-0.5">/{deviceCount}</span></span>
              </div>
           </div>
           <div className="w-px h-6 bg-border/40"></div>
           <div className="flex items-center gap-2 group">
              <div className={clsx(
                "w-1.5 h-1.5 rounded-full",
                mqttConnected ? "bg-success shadow-[0_0_8px_var(--success)] animate-pulse" : "bg-text-muted"
              )} />
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-txt-muted uppercase tracking-widest leading-none mb-1">Neural Sync</span>
                 <span className={clsx("text-xs font-black leading-tight", mqttConnected ? "text-success" : "text-txt-muted")}>
                    {mqttConnected ? "ONLINE" : "OFFLINE"}
                 </span>
              </div>
           </div>
        </div>

        {/* Global Clock */}
        {mounted && (
          <div className="hidden md:flex flex-col items-end px-4 border-r border-border/40">
            <span className="text-sm font-black font-mono text-heading leading-none tracking-tighter">{clock}</span>
            <span className="text-[9px] font-black text-txt-muted tracking-[1.5px] mt-1 opacity-50 uppercase">{date}</span>
          </div>
        )}

        {/* User Context */}
        <div className="flex items-center gap-3 active:scale-95 transition-transform group">
          <div className="flex flex-col items-end hidden sm:flex">
             <span className="text-[10px] font-black text-heading uppercase tracking-tight">{username}</span>
             <span className="text-[8px] font-black text-accent uppercase tracking-widest">Active Operator</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-bg-2 border border-border/40 flex items-center justify-center text-text shadow-sm group-hover:border-accent transition-all">
             <i className="fas fa-user-shield text-sm"></i>
          </div>
        </div>
      </div>
    </header>
  );
}
