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
    <header className="fixed top-0 right-0 h-topbar bg-bg/80 backdrop-blur-xl border-b border-border z-30 flex items-center justify-between px-5 left-0 lg:left-[var(--sidebar-w)]">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden text-txt-secondary hover:text-txt p-2 -ml-2 rounded-lg hover:bg-surface transition"
        >
          <i className="fas fa-bars text-lg"></i>
        </button>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-txt-muted font-semibold hidden sm:inline">
            IoTzy
          </span>
          <i className="fas fa-chevron-right text-txt-muted text-[10px] hidden sm:inline"></i>
          <span className="font-bold text-heading">{pageTitle}</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Stats — hidden on mobile */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface text-xs">
            <i className="fas fa-microchip text-accent text-[10px]"></i>
            <span className="font-bold">{activeCount}</span>
            <span className="text-txt-muted">/{deviceCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface text-xs">
            <i className="fas fa-signal text-success text-[10px]"></i>
            <span className="font-bold">{sensorCount}</span>
          </div>
        </div>

        {/* MQTT */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface">
          <span
            className={clsx(
              "w-2 h-2 rounded-full",
              mqttConnected ? "bg-success animate-pulse" : "bg-txt-muted"
            )}
          />
          <span className="text-xs font-medium">
            {mqttConnected ? "MQTT" : "Off"}
          </span>
        </div>

        {/* Clock — hidden on small screens */}
        {mounted && (
          <div className="text-right hidden sm:block">
            <div className="text-sm font-mono font-bold">{clock}</div>
            <div className="text-[10px] text-txt-muted">{date}</div>
          </div>
        )}

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center text-xs font-bold uppercase"
          title={username}
        >
          {username.charAt(0)}
        </div>
      </div>
    </header>
  );
}
