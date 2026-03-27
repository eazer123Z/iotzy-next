"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import clsx from "clsx";

const navGroups = [
  {
    label: "Monitor",
    items: [
      { href: "/", icon: "fa-house", label: "Overview", badge: null },
      { href: "/devices", icon: "fa-microchip", label: "Perangkat", badge: "devices" },
      { href: "/sensors", icon: "fa-signal", label: "Sensor", badge: "sensors" },
    ],
  },
  {
    label: "Automasi",
    items: [
      { href: "/automation", icon: "fa-robot", label: "Rules Engine", badge: null },
      { href: "/camera", icon: "fa-eye", label: "Computer Vision", badge: null },
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/analytics", icon: "fa-chart-bar", label: "Log & Analytics", badge: null },
      { href: "/settings", icon: "fa-gear", label: "Pengaturan", badge: null },
    ],
  },
];

interface SidebarProps {
  user: { username: string; fullName: string | null; role: string };
  settings: { mqttBroker?: string | null };
}

export default function Sidebar({ user, settings }: SidebarProps) {
  const pathname = usePathname();
  const { devices, sensors, mqttConnected } = useAppStore();

  const deviceCount = Object.keys(devices).length;
  const sensorCount = Object.keys(sensors).length;

  return (
    <aside className="h-full w-sidebar bg-surface/30 backdrop-blur-[var(--glass-blur)] border-r border-border flex flex-col overflow-y-auto animate-slideIn">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-border/50">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-bg text-xl shadow-[0_0_20px_var(--accent-glow)]">
          <i className="fas fa-bolt"></i>
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-xl text-heading tracking-tight">IoTzy</span>
          <span className="text-[10px] uppercase tracking-[3px] text-accent font-bold -mt-1 opacity-80">Enterprise</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-[2px] text-text-muted px-4 mb-3 opacity-50">
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const badge =
                item.badge === "devices"
                  ? deviceCount
                  : item.badge === "sensors"
                  ? sensorCount
                  : null;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "group flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-semibold transition-all duration-300 relative overflow-hidden",
                    isActive
                      ? "bg-accent-bg text-accent border border-accent/20 shadow-[0_0_15px_rgba(0,242,255,0.05)]"
                      : "text-text-secondary hover:bg-white/5 hover:text-heading"
                  )}
                >
                  <div className={clsx(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300",
                    isActive ? "bg-accent/10" : "bg-white/5 group-hover:bg-accent/10"
                  )}>
                    <i className={`fas ${item.icon} text-base`}></i>
                  </div>
                  <span className="flex-1">{item.label}</span>
                  {badge !== null && badge > 0 && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-accent/20 text-accent border border-accent/20">
                      {badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-accent rounded-r-full" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/50 p-4 bg-black/20">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface/50 border border-border/50 hover:border-accent/30 transition-all duration-300 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-surface-solid to-border flex items-center justify-center text-accent text-lg font-black border border-border shadow-inner">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-heading truncate group-hover:text-accent transition-colors">
              {user.fullName || user.username}
            </div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{user.role}</div>
          </div>
          <Link
            href="/api/auth/logout"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-danger/10 hover:text-danger transition-all"
            title="Logout"
            prefetch={false}
          >
            <i className="fas fa-power-off text-sm"></i>
          </Link>
        </div>

        <div className="flex items-center justify-between px-3 mt-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className={clsx(
                "w-2.5 h-2.5 rounded-full block",
                mqttConnected ? "bg-success shadow-[0_0_10px_var(--success)] animate-pulse" : "bg-text-muted"
              )} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">
              {mqttConnected ? "Connected" : "Discon"}
            </span>
          </div>
          <span className="text-[9px] font-mono text-text-muted truncate max-w-[120px] opacity-40">
            {settings.mqttBroker || "no-broker"}
          </span>
        </div>
      </div>
    </aside>
  );
}
