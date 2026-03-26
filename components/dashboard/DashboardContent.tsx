"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
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
  const { setDevices, setSensors, setCv, setLogs, setQuickControls } =
    useAppStore();

  // Hydrate store from server data
  useEffect(() => {
    setDevices(initialDevices);
    setSensors(initialSensors);
    if (cvState) setCv(cvState);
    setLogs(initialLogs);
    setQuickControls(quickControls);
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-heading">
            Selamat Datang, {username}
          </h1>
          <p className="text-sm text-txt-secondary mt-1">
            Ringkasan kondisi rumah pintar Anda saat ini.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="fa-plug"
          color="text-success"
          bgColor="bg-success/10"
          label="Perangkat Aktif"
          value={stats.activeDevices}
          sub={`dari ${stats.totalDevices} perangkat`}
        />
        <StatCard
          icon="fa-gauge-high"
          color="text-accent"
          bgColor="bg-accent/10"
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
          color="text-purple-400"
          bgColor="bg-purple-500/10"
          label="Koneksi Cloud"
          value="—"
          sub="Siap terhubung"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chart + Activity */}
        <div className="lg:col-span-2 space-y-4">
          {/* Chart Placeholder */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <i className="fas fa-chart-line text-accent text-sm"></i>
              <span className="font-semibold text-sm">Monitoring Sensor</span>
            </div>
            <div className="h-[200px] flex items-center justify-center text-txt-muted text-sm">
              <div className="text-center">
                <i className="fas fa-chart-area text-3xl opacity-20 mb-2 block"></i>
                Grafik akan muncul saat sensor mengirim data
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <i className="fas fa-clock-rotate-left text-accent text-sm"></i>
              <span className="font-semibold text-sm">Aktivitas Terbaru</span>
            </div>
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
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${
                        log.logType === "success"
                          ? "bg-success/10 text-success"
                          : log.logType === "warning"
                          ? "bg-warning/10 text-warning"
                          : "bg-accent/10 text-accent"
                      }`}
                    >
                      <i
                        className={`fas ${
                          log.triggerType === "Manual"
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
                        {new Date(log.createdAt).toLocaleTimeString("id-ID")} •{" "}
                        {log.triggerType}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Controls + CV + Room Summary */}
        <div className="space-y-4">
          {/* Quick Controls */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <i className="fas fa-bolt text-warning text-sm"></i>
                <span className="font-semibold text-sm">Kontrol Cepat</span>
              </div>
            </div>
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
                  return (
                    <div
                      key={id}
                      className="p-3 rounded-xl bg-surface border border-border text-center"
                    >
                      <i
                        className={`fas ${dev.icon} text-lg text-txt-secondary`}
                      ></i>
                      <div className="text-xs font-medium mt-1 truncate">
                        {dev.name}
                      </div>
                      <div className="text-[10px] text-txt-muted mt-0.5">
                        {dev.lastState ? "ON" : "OFF"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CV Preview */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <i className="fas fa-eye text-accent text-sm"></i>
              <span className="font-semibold text-sm">Computer Vision</span>
            </div>
            <div className="h-[120px] rounded-xl bg-surface border border-border flex items-center justify-center text-txt-muted text-xs">
              <div className="text-center">
                <i className="fas fa-video-slash text-xl opacity-30 mb-1 block"></i>
                Preview kamera nonaktif
              </div>
            </div>
          </div>

          {/* Room Summary */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <i className="fas fa-shield-halved text-success text-sm"></i>
              <span className="font-semibold text-sm">Kondisi Ruangan</span>
            </div>
            <div className="space-y-3">
              <SummaryItem
                icon="fa-users"
                color="text-accent"
                label="Kehadiran Orang"
                value={
                  cvState && cvState.personCount > 0
                    ? `Terdeteksi (${cvState.personCount})`
                    : "Tidak Terdeteksi"
                }
              />
              <SummaryItem
                icon="fa-lightbulb"
                color="text-warning"
                label="Kondisi Cahaya"
                value={
                  cvState
                    ? `${
                        cvState.lightCondition === "dark"
                          ? "Gelap"
                          : cvState.lightCondition === "bright"
                          ? "Terang"
                          : "Normal"
                      } (${cvState.brightness}%)`
                    : "Memindai..."
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ───

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
    <div className="card p-4 flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-xl ${bgColor} ${color} flex items-center justify-center text-lg`}
      >
        <i className={`fas ${icon}`}></i>
      </div>
      <div>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-[11px] font-medium text-txt-muted">{label}</div>
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
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}
