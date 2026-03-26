"use client";

import { useState, useEffect } from "react";
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
  const { mqttConnected, devices, sensors } = useAppStore();
  const [clock, setClock] = useState("--:--:--");
  const [date, setDate] = useState("");

  const deviceCount = Object.keys(devices).length;
  const activeCount = Object.values(useAppStore.getState().deviceStates).filter(
    Boolean
  ).length;
  const sensorCount = Object.keys(sensors).length;

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("id-ID", { hour12: false })
      );
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

  // Get current page title
  const [pageTitle, setPageTitle] = useState("Overview");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPageTitle(PAGE_TITLES[window.location.pathname] || "Overview");
    }
  }, []);

  return (
    <header className="fixed top-0 right-0 h-topbar bg-bg/80 backdrop-blur-xl border-b border-border z-30 flex items-center justify-between px-5 lg:left-sidebar left-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden text-txt-secondary hover:text-txt p-1"
        >
          <i className="fas fa-bars"></i>
        </button>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-txt-muted font-semibold">IoTzy</span>
          <i className="fas fa-chevron-right text-txt-muted text-[10px]"></i>
          <span className="font-semibold">{pageTitle}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Stats pills */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface text-xs">
            <i className="fas fa-microchip text-accent text-[10px]"></i>
            <span className="font-semibold">{activeCount}</span>
            <span className="text-txt-muted">/{deviceCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface text-xs">
            <i className="fas fa-signal text-success text-[10px]"></i>
            <span className="font-semibold">{sensorCount}</span>
          </div>
        </div>

        {/* MQTT Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface">
          <span
            className={clsx(
              "w-2 h-2 rounded-full",
              mqttConnected ? "bg-success" : "bg-txt-muted"
            )}
          />
          <span className="text-xs font-medium">
            {mqttConnected ? "MQTT" : "Off"}
          </span>
        </div>

        {/* Clock */}
        <div className="text-right hidden sm:block">
          <div className="text-sm font-mono font-semibold">{clock}</div>
          <div className="text-[10px] text-txt-muted">{date}</div>
        </div>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center text-xs font-bold"
          title={username}
        >
          {username.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
