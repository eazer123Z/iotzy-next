"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import BottomNav from "@/components/layout/BottomNav";
import ChatFAB from "@/components/chat/ChatFAB";
import { usePolling } from "@/hooks/usePolling";
import { useMQTT } from "@/hooks/useMQTT";
import { useAppStore } from "@/lib/store";

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
    mqttPort?: number | null;
    mqttUseSsl?: boolean | null;
    mqttUsername?: string | null;
    mqttPath?: string | null;
  };
}

export default function DashboardLayoutClient({
  children,
  user,
  settings,
}: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Real-time polling
  usePolling();

  // MQTT connection
  const mqttConfig = settings.mqttBroker
    ? {
        broker: settings.mqttBroker,
        port: settings.mqttPort || 8884,
        path: settings.mqttPath || "/mqtt",
        ssl: settings.mqttUseSsl ?? true,
        username: settings.mqttUsername || undefined,
      }
    : null;

  const { connected: mqttConnected } = useMQTT(mqttConfig);

  // Sync MQTT connection status to store
  const setMqttConnected = useAppStore((s) => s.setMqttConnected);
  useEffect(() => {
    setMqttConnected(mqttConnected);
  }, [mqttConnected, setMqttConnected]);

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
