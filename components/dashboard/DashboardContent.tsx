"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { socket } from "@/lib/socket";
import type { Device, Sensor, CvState, ActivityLog } from "@/types";

interface DashboardContentProps {
  username: string;
  devices: Device[];
  sensors: Sensor[];
  cvState: CvState | null;
  logs: ActivityLog[];
  stats: {
    totalDevices: number;
    activeDevices: number;
    totalSensors: number;
    onlineSensors: number;
  };
  quickControls: string[];
}

export default function DashboardContent({
  username,
  devices: initialDevices,
  sensors: initialSensors,
  cvState,
  logs: initialLogs,
  stats,
  quickControls,
}: DashboardContentProps) {
  const {
    setDevices,
    setSensors,
    setCv,
    setLogs,
    setQuickControls,
    deviceStates,
    setDeviceState,
    cv: liveCv,
    mqttConnected,
  } = useAppStore();
  const [clock, setClock] = useState("--:--:--");

  const [mounted, setMounted] = useState(false);

  // Hydrate store
  useEffect(() => {
    setMounted(true);
    setDevices(initialDevices);
    setSensors(initialSensors);
    if (cvState) setCv(cvState);
    setLogs(initialLogs);
    setQuickControls(quickControls);

    // 🌐 [MQTT WEB-SOCKET BRIDGE] MENGHANCURKAN POLA LAMA
    // 1. Jalankan koneksi socket
    socket.connect();

    // 2. Berlangganan event perangkat yang tertembak dari MQTT via Server.ts
    socket.on("device_update", (payload: { topic: string; data: any }) => {
      console.log("⚡ [WS] Real-Time Sync:", payload);
      // Asumsi Payload "iotzy/{deviceKey}/status" { state: 1 }
      if (payload.data && payload.data.deviceKey) {

        // Temukan ID berdasarkan deviceKey yang dibawa
        const deviceMatch = initialDevices.find(d => d.deviceKey === payload.data.deviceKey);

        if (deviceMatch && payload.data.state !== undefined) {
          // UPDATE STORE STATE SECARA INSTAN TANPA POLLING API
          setDeviceState(String(deviceMatch.id), payload.data.state === 1);
        }
      }
    });

    return () => {
      socket.off("device_update");
      socket.disconnect();
    };
  }, []);

  // Real-time clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  // Quick control toggle
  const toggleDevice = useCallback(
    async (id: string) => {
      const current = deviceStates[id] ?? false;
      setDeviceState(id, !current);
      await fetch("/api/devices/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(id), state: !current }),
      });
    },
    [deviceStates, setDeviceState]
  );

  const activeDevices = Object.values(deviceStates).filter(Boolean).length;
  const personCount = liveCv.personCount ?? cvState?.personCount ?? 0;
  const lightCond = liveCv.lightCondition || cvState?.lightCondition || "unknown";
  const brightnessVal = liveCv.brightness ?? cvState?.brightness ?? 0;

  const condMap: Record<string, { label: string; color: string }> = {
    dark: { label: "Gelap", color: "text-blue-400" },
    normal: { label: "Normal", color: "text-green-400" },
    bright: { label: "Terang", color: "text-yellow-400" },
  };
  const cond = condMap[lightCond] || { label: lightCond, color: "text-txt-muted" };

  return (
    <div className="space-y-6 animate-fadeIn max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-heading">
            Selamat Datang, {username}
          </h1>
          <p className="text-sm text-txt-secondary mt-1">
            Ringkasan kondisi rumah pintar Anda saat ini.
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg font-bold text-heading">{clock}</div>
          <div className="text-[10px] text-txt-muted uppercase tracking-wider">
            {mounted ? new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }) : "—"}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="fa-plug"
          color="text-success"
          bgColor="bg-success/10"
          label="Perangkat Aktif"
          value={activeDevices}
          sub={`dari ${stats.totalDevices} perangkat`}
        />
        <StatCard
          icon="fa-gauge-high"
          color="text-info"
          bgColor="bg-info/10"
          label="Sensor Aktif"
          value={stats.onlineSensors}
          sub={`dari ${stats.totalSensors} sensor`}
        />
        <StatCard
          icon="fa-bell"
          color="text-warning"
          bgColor="bg-warning/10"
          label="Notifikasi"
          value={0}
          sub="Sistem normal"
        />
        <StatCard
          icon="fa-cloud"
          color="text-accent-light"
          bgColor="bg-accent/10"
          label="Koneksi Cloud"
          value={mqttConnected ? "Online" : "Offline"}
          sub="MQTT"
        />
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chart + Activity */}
        <div className="lg:col-span-2 space-y-4">
          {/* Chart Card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <i className="fas fa-chart-line"></i> Monitoring Sensor
              </span>
              <select className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs">
                <option>Semua Sensor</option>
                {initialSensors.map((s) => (
                  <option key={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="card-body">
              <div className="h-[200px] flex items-end justify-center gap-2 px-4">
                {[40, 60, 35, 80, 55, 70, 45, 65, 50, 75, 30, 85].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-accent/40 to-accent-light/60 transition-all duration-500"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <p className="text-center text-txt-muted text-xs mt-3">
                Grafik sedang disiapkan...
              </p>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <i className="fas fa-clock-rotate-left"></i> Aktivitas Terbaru
              </span>
            </div>
            <div className="card-body">
              {initialLogs.length === 0 ? (
                <p className="text-txt-muted text-sm text-center py-4">
                  Belum ada aktivitas tercatat.
                </p>
              ) : (
                <div className="space-y-3">
                  {initialLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface/50 transition-colors"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${log.logType === "success"
                            ? "bg-success/10 text-success"
                            : log.logType === "warning"
                              ? "bg-warning/10 text-warning"
                              : "bg-accent/10 text-accent"
                          }`}
                      >
                        <i
                          className={`fas ${log.triggerType === "Manual"
                              ? "fa-hand-pointer"
                              : log.triggerType === "Automation"
                                ? "fa-robot"
                                : "fa-microchip"
                            }`}
                        ></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {log.deviceName} — {log.activity}
                        </div>
                        <div className="text-[11px] text-txt-muted">
                          {mounted ? new Date(log.createdAt).toLocaleTimeString("id-ID") : "--:--"} •{" "}
                          {log.triggerType}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Controls + CV + Room */}
        <div className="space-y-4">
          {/* Quick Controls */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <i className="fas fa-bolt"></i> Kontrol Cepat
              </span>
              <button className="icon-btn" title="Pilih perangkat">
                <i className="fas fa-gear text-xs"></i>
              </button>
            </div>
            <div className="card-body">
              {quickControls.length === 0 ? (
                <p className="text-txt-muted text-xs text-center py-4">
                  Belum ada perangkat favorit.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {quickControls.map((id) => {
                    const dev = initialDevices.find(
                      (d) => String(d.id) === id
                    );
                    if (!dev) return null;
                    const isOn =
                      deviceStates[id] ?? Boolean(dev.lastState);
                    return (
                      <button
                        key={id}
                        onClick={() => toggleDevice(id)}
                        className={`p-3 rounded-xl border text-center transition-all ${isOn
                            ? "bg-accent/10 border-accent/30"
                            : "bg-surface border-border"
                          }`}
                      >
                        <i
                          className={`fas ${dev.icon} text-lg ${isOn ? "text-accent" : "text-txt-muted"
                            }`}
                        ></i>
                        <div className="text-xs font-medium mt-1 truncate">
                          {dev.name}
                        </div>
                        <div
                          className={`text-[10px] mt-0.5 font-bold ${isOn ? "text-success" : "text-txt-muted"
                            }`}
                        >
                          {isOn ? "ON" : "OFF"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* CV Preview */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <i className="fas fa-eye"></i> Computer Vision
              </span>
              <a href="/camera" className="text-xs text-accent hover:underline">
                Detail <i className="fas fa-arrow-right text-[10px]"></i>
              </a>
            </div>
            <div className="card-body">
              <div className="aspect-video rounded-xl bg-surface border border-border flex items-center justify-center text-txt-muted text-xs">
                <div className="text-center">
                  <i className="fas fa-video-slash text-2xl opacity-30 mb-1 block"></i>
                  Preview kamera nonaktif
                </div>
              </div>
            </div>
          </div>

          {/* Room Condition */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <i className="fas fa-shield-halved"></i> Kondisi Ruangan
              </span>
            </div>
            <div className="card-body space-y-3">
              <SummaryItem
                icon="fa-users"
                color="text-accent"
                label="Kehadiran Orang"
                value={
                  personCount > 0
                    ? `Terdeteksi (${personCount})`
                    : "Tidak Terdeteksi"
                }
              />
              <SummaryItem
                icon="fa-lightbulb"
                color="text-warning"
                label="Kondisi Cahaya"
                value={`${cond.label} (${brightnessVal}%)`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ───

function StatCard({
  icon,
  color,
  bgColor,
  label,
  value,
  sub,
}: {
  icon: string;
  color: string;
  bgColor: string;
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="card p-4 flex items-center gap-4 hover:border-border-hover hover:-translate-y-0.5 transition-all">
      <div
        className={`w-11 h-11 rounded-xl ${bgColor} ${color} flex items-center justify-center text-lg`}
      >
        <i className={`fas ${icon}`}></i>
      </div>
      <div>
        <div className="text-xl font-extrabold text-heading">{value}</div>
        <div className="text-[11px] font-medium text-txt-secondary">{label}</div>
        <div className="text-[10px] text-txt-muted">{sub}</div>
      </div>
    </div>
  );
}

function SummaryItem({
  icon,
  color,
  label,
  value,
}: {
  icon: string;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <i className={`fas ${icon} ${color} text-sm w-5 text-center`}></i>
      <div>
        <div className="text-[10px] text-txt-muted">{label}</div>
        <div className="text-sm font-semibold text-heading">{value}</div>
      </div>
    </div>
  );
}
