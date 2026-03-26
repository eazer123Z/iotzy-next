"use client";

import { useState } from "react";
import type { ActivityLog } from "@/types";

interface Props {
  logs: ActivityLog[];
  stats: { total: number; today: number; errors: number; warnings: number };
}

export default function AnalyticsContent({ logs: initialLogs, stats }: Props) {
  const [logs] = useState(initialLogs);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = logs.filter((l) => {
    if (filter !== "all" && l.logType !== filter) return false;
    if (search && !l.deviceName.toLowerCase().includes(search.toLowerCase()) && !l.activity.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  function exportCSV() {
    const header = "Time,Device,Activity,Trigger,Type\n";
    const rows = filtered
      .map(
        (l) =>
          `"${l.createdAt}","${l.deviceName}","${l.activity}","${l.triggerType}","${l.logType}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `iotzy-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const typeColors: Record<string, string> = {
    info: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    error: "bg-danger/10 text-danger",
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-heading">
            Log & Analytics
          </h1>
          <p className="text-sm text-txt-secondary mt-1">
            Riwayat aktivitas sistem.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-surface transition"
        >
          <i className="fas fa-download mr-2"></i>Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Log", value: stats.total, color: "text-accent" },
          { label: "Hari Ini", value: stats.today, color: "text-success" },
          { label: "Warning", value: stats.warnings, color: "text-warning" },
          { label: "Error", value: stats.errors, color: "text-danger" },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[11px] text-txt-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="flex gap-2">
          {["all", "info", "success", "warning", "error"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === t
                  ? "bg-accent/20 text-accent"
                  : "text-txt-muted hover:bg-surface"
              }`}
            >
              {t === "all" ? "Semua" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-xs"></i>
          <input
            type="text"
            placeholder="Cari log..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface border border-border text-xs focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Log Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-txt-muted text-xs">
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Perangkat</th>
                <th className="px-4 py-3">Aktivitas</th>
                <th className="px-4 py-3">Trigger</th>
                <th className="px-4 py-3">Tipe</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-txt-muted text-sm"
                  >
                    Tidak ada log ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border/50 hover:bg-surface/50 transition"
                  >
                    <td className="px-4 py-3 text-xs text-txt-muted whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 font-medium">{log.deviceName}</td>
                    <td className="px-4 py-3 text-txt-secondary">
                      {log.activity}
                    </td>
                    <td className="px-4 py-3 text-xs text-txt-muted">
                      {log.triggerType}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          typeColors[log.logType] || "bg-surface text-txt-muted"
                        }`}
                      >
                        {log.logType}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
