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
    <aside className="h-full w-sidebar bg-bg-2 border-r border-border flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white text-lg">
          <i className="fas fa-bolt"></i>
        </div>
        <span className="font-extrabold text-lg text-heading">IoTzy</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-txt-muted px-3 mb-2 mt-3 first:mt-0">
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
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-accent-bg text-accent"
                      : "text-txt-secondary hover:bg-surface hover:text-txt"
                  )}
                >
                  <i className={`fas ${item.icon} w-5 text-center`}></i>
                  <span className="flex-1">{item.label}</span>
                  {badge !== null && badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-accent/20 text-accent">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-surface">
          <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center text-sm font-bold">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">
              {user.fullName || user.username}
            </div>
            <div className="text-[10px] text-txt-muted">{user.role}</div>
          </div>
          <Link
            href="/api/auth/logout"
            className="text-txt-muted hover:text-danger transition-colors p-1"
            title="Logout"
          >
            <i className="fas fa-right-from-bracket text-sm"></i>
          </Link>
        </div>

        <div className="flex items-center justify-between px-2 mt-2">
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                "w-2 h-2 rounded-full",
                mqttConnected ? "bg-success" : "bg-txt-muted"
              )}
            />
            <span className="text-[11px] text-txt-muted">
              {mqttConnected ? "Online" : "Offline"}
            </span>
          </div>
          <span className="text-[10px] text-txt-muted truncate max-w-[140px]">
            {settings.mqttBroker || "—"}
          </span>
        </div>
      </div>
    </aside>
  );
}
