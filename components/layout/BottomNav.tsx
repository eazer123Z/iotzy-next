"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { href: "/", icon: "fa-house", label: "Home" },
  { href: "/devices", icon: "fa-plug", label: "Nodes" },
  { href: "/sensors", icon: "fa-signal", label: "Data" },
  { href: "/automation", icon: "fa-robot", label: "Auto" },
  { href: "/camera", icon: "fa-eye", label: "Vision" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-6 left-6 right-6 lg:hidden z-50">
      <div className="flex items-center justify-around py-3 px-2 rounded-[24px] bg-bg border border-border/60 shadow-lg backdrop-blur-xl">
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
                "relative flex flex-col items-center gap-1.5 px-4 py-2 transition-all duration-300 active:scale-90",
                isActive ? "text-accent" : "text-text-muted hover:text-text-secondary"
              )}
            >
              <div className={clsx(
                "w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all",
                isActive ? "bg-accent-bg" : "bg-transparent"
              )}>
                <i className={`fas ${item.icon}`}></i>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
              {isActive && (
                <div className="absolute top-0 w-1 h-1 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
