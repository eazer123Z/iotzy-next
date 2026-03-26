"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { href: "/", icon: "fa-house", label: "Home" },
  { href: "/devices", icon: "fa-microchip", label: "Device" },
  { href: "/sensors", icon: "fa-signal", label: "Sensor" },
  { href: "/automation", icon: "fa-robot", label: "Auto" },
  { href: "/camera", icon: "fa-eye", label: "Camera" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-2 border-t border-border z-40 lg:hidden">
      <div className="flex items-center justify-around py-2">
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
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-medium transition",
                isActive
                  ? "text-accent"
                  : "text-txt-muted hover:text-txt-secondary"
              )}
            >
              <i className={`fas ${item.icon} text-base`}></i>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
