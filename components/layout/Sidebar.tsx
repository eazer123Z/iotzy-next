"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import clsx from "clsx";

const navItems = [
  { href: "/", icon: "fa-house", label: "Overview" },
  { href: "/devices", icon: "fa-plug", label: "Devices" },
  { href: "/sensors", icon: "fa-signal", label: "Sensors" },
  { href: "/automation", icon: "fa-robot", label: "Automation" },
  { href: "/camera", icon: "fa-eye", label: "Vision HUD" },
  { href: "/analytics", icon: "fa-chart-pie", label: "Analytics" },
  { href: "/settings", icon: "fa-gear", label: "Settings" },
];

interface SidebarProps {
  user: { username: string; fullName: string | null; role: string };
  settings: { mqttBroker?: string | null };
}

export default function Sidebar({ user, settings }: SidebarProps) {
  const pathname = usePathname();
  const mqttConnected = useAppStore((s) => s.mqttConnected);

  const handleLogout = async () => {
     // Gunakan redirect murni untuk membersihkan session via cookie
     window.location.href = "/api/auth/logout";
  };

  return (
    <aside className="w-[var(--sidebar-w)] h-screen bg-bg border-r border-border flex flex-col z-50">
      {/* Brand Header */}
      <div className="h-[var(--topbar-h)] flex items-center px-8 border-b border-border/50">
        <Link href="/" className="flex items-center gap-3 active:scale-95 transition-transform group">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-bg shadow-[0_5px_15px_var(--accent-glow)] group-hover:rotate-12 transition-transform">
            <i className="fas fa-atom text-xl"></i>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter text-heading leading-none">IoTzy</h1>
            <span className="text-[9px] font-black uppercase tracking-[2px] text-accent opacity-50">System v4.0</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-8 px-4 space-y-1 overflow-y-auto scrollbar-hide">
        <div className="px-4 mb-4">
           <span className="text-[10px] font-black uppercase tracking-[3px] text-txt-muted opacity-40">Main Console</span>
        </div>
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[13px] font-bold transition-all duration-300 group",
                isActive
                  ? "bg-accent text-bg shadow-sm"
                  : "text-text-secondary hover:bg-accent-bg hover:text-accent"
              )}
            >
              <i className={clsx("fas", item.icon, "w-5 text-center transition-transform group-hover:scale-110")}></i>
              <span className="tracking-tight">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1 h-1 rounded-full bg-bg opacity-50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section (Refined) */}
      <div className="p-4 border-t border-border/50 bg-bg-2/50">
        <div className="p-4 rounded-3xl bg-surface border border-border/40 mb-4 transition-all hover:border-accent/20 group">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-xl bg-bg-2 flex items-center justify-center text-accent text-sm border border-border/40 font-black group-hover:border-accent/30 transition-colors">
                {user.username.charAt(0).toUpperCase()}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-heading truncate uppercase tracking-tight">
                  {user.fullName || user.username}
                </p>
                <p className="text-[9px] font-black text-txt-muted uppercase tracking-[1px]">{user.role}</p>
             </div>
          </div>

          <div className="flex items-center justify-between px-1">
             <div className="flex items-center gap-2">
                <div className={clsx(
                  "w-1.5 h-1.5 rounded-full",
                  mqttConnected ? "bg-success shadow-[0_0_8px_var(--success)] animate-pulse" : "bg-text-muted"
                )} />
                <span className="text-[9px] font-black text-txt-muted uppercase tracking-widest leading-none">
                  {mqttConnected ? "Sync On" : "Sync Off"}
                </span>
             </div>
             <div style={{fontSize: '8px'}} className="font-mono text-txt-muted opacity-30 tracking-tighter truncate max-w-[100px]">
                {settings.mqttBroker || "Local"}
             </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-txt-muted hover:text-danger hover:bg-danger-bg transition-all active:scale-95"
        >
          <i className="fas fa-power-off"></i>
          Terminate Link
        </button>
      </div>
    </aside>
  );
}
