"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import BottomNav from "@/components/layout/BottomNav";
import ChatFAB from "@/components/chat/ChatFAB";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  user: {
    id: number;
    username: string;
    fullName: string | null;
    role: string;
    theme: string;
  };
  settings: {
    mqttBroker?: string | null;
  };
}

export default function DashboardLayoutClient({
  children,
  user,
  settings,
}: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={user.theme === "light" ? "" : "dark"}>
      <Sidebar user={user} settings={settings} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Topbar
        username={user.username}
        theme={user.theme}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="ml-0 lg:ml-sidebar mt-topbar min-h-[calc(100vh-var(--topbar-h))] p-4 lg:p-6 pb-20 lg:pb-6">
        {children}
      </main>

      <BottomNav />
      <ChatFAB />
    </div>
  );
}
