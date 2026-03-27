"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { href: "/", icon: "fa-atom", label: "Neural" },
  { href: "/devices", icon: "fa-plug", label: "Nodes" },
  { href: "/sensors", icon: "fa-signal", label: "Data" },
  { href: "/automation", icon: "fa-brain", label: "Logic" },
  { href: "/camera", icon: "fa-eye", label: "Vision" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-6 left-6 right-6 lg:hidden z-50">
      <div className="flex items-center justify-around py-3 px-2 rounded-[28px] bg-surface-solid/80 backdrop-blur-2xl border border-border/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "relative flex flex-col items-center gap-1.5 px-4 py-2 transition-all duration-500",
                isActive ? "text-accent scale-110" : "text-text-muted hover:text-text-secondary"
              )}
            >
              {isActive && (
                <div className="absolute -top-1 w-1 h-1 rounded-full bg-accent shadow-[0_0_8px_var(--accent)] animate-pulse" />
              )}
              <div className={clsx(
                "w-10 h-10 rounded-2xl flex items-center justify-center text-lg transition-all",
                isActive ? "bg-accent/10 shadow-[inset_0_0_10px_rgba(0,242,255,0.2)]" : "bg-transparent"
              )}>
                <i className={`fas ${item.icon}`}></i>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
