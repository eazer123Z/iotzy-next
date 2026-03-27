"use client";

import { useState } from "react";
import clsx from "clsx";
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

  const typeConfig: Record<string, { label: string; icon: string; class: string }> = {
    info: { label: "Information", icon: "fa-info-circle", class: "text-accent bg-accent-bg border-accent" },
    success: { label: "Success", icon: "fa-check-circle", class: "text-success bg-success-bg border-success" },
    warning: { label: "Warning", icon: "fa-exclamation-triangle", class: "text-warning bg-warning-bg border-warning" },
    error: { label: "Failure", icon: "fa-times-circle", class: "text-danger bg-danger-bg border-danger" },
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1400px] mx-auto pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)]" />
            <span className="text-[10px] font-black uppercase tracking-[3px] text-text-muted">Data Intelligence</span>
          </div>
          <h1 className="text-3xl font-black text-heading tracking-tighter">System Analytics</h1>
          <p className="text-text-secondary text-sm font-bold opacity-60">Complete audit trail of neural events and interactions.</p>
        </div>
        
        <button
          onClick={exportCSV}
          className="px-6 py-3 rounded-2xl bg-bg-2 border border-border text-text-secondary font-black text-[10px] uppercase tracking-widest hover:border-accent hover:text-accent shadow-sm transition-all flex items-center gap-3 shadow-sm"
        >
          <i className="fas fa-file-export text-xs"></i>
          <span>Export Database</span>
        </button>
      </div>

      {/* ── Status Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {[
          { label: "Total Volume", value: stats.total, icon: "fa-layer-group", color: "text-accent" },
          { label: "Today Context", value: stats.today, icon: "fa-calendar-day", color: "text-success" },
          { label: "Neural Alerts", value: stats.warnings, icon: "fa-shield-alt", color: "text-warning" },
          { label: "System Faults", value: stats.errors, icon: "fa-exclamation-circle", color: "text-danger" },
        ].map((s) => (
          <div key={s.label} className="card p-6 flex items-center justify-between group">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-text-muted uppercase tracking-[2px] mb-1">{s.label}</span>
              <span className={clsx("text-2xl font-black tracking-tighter", s.color)}>{s.value.toLocaleString()}</span>
            </div>
            <div className={clsx("w-12 h-12 rounded-2xl bg-bg-2 flex items-center justify-center text-lg transition-transform group-hover:scale-110", s.color)}>
              <i className={`fas ${s.icon}`}></i>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters & Search ── */}
      <div className="space-y-6 px-4">
        <div className="flex flex-col lg:flex-row gap-4">
           {/* Tabs */}
           <div className="flex p-1.5 gap-1 rounded-2xl bg-bg-2 border border-border w-fit shadow-sm overflow-x-auto no-scrollbar">
             {["all", "info", "success", "warning", "error"].map((t) => (
               <button
                 key={t}
                 onClick={() => setFilter(t)}
                 className={clsx(
                   "px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                   filter === t 
                     ? "bg-bg text-accent shadow-sm" 
                     : "text-text-muted hover:text-heading"
                 )}
               >
                 {t === "all" ? "Stream All" : t}
               </button>
             ))}
           </div>

           {/* Search Box */}
           <div className="relative group flex-1">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                 <i className="fas fa-search text-text-muted/40 text-xs"></i>
              </div>
              <input
                type="text"
                placeholder="Query activity logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-bg-2 border border-border text-xs font-bold focus:outline-none focus:border-accent shadow-sm transition-all placeholder:text-text-muted/40"
              />
           </div>
        </div>

        {/* ── Data Table ── */}
        <div className="card overflow-hidden shadow-sm">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-2/50 border-b border-border">
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[2px] text-text-muted">Temporal Timestamp</th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[2px] text-text-muted">Node Identifier</th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[2px] text-text-muted">Neural Activity</th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[2px] text-text-muted text-right">Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-24 text-center">
                       <i className="fas fa-database text-4xl text-text-muted/10 mb-4 block"></i>
                       <p className="text-xs font-black uppercase tracking-[2px] text-text-muted opacity-40">Zero telemetry found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((log) => {
                    const cfg = typeConfig[log.logType] || { label: "Event", icon: "fa-terminal", class: "text-text-muted bg-bg-2" };
                    return (
                      <tr key={log.id} className="group hover:bg-bg-2/30 transition-colors">
                        <td className="px-8 py-5">
                           <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-text-secondary">{new Date(log.createdAt).toLocaleDateString("id-ID")}</span>
                              <span className="text-[10px] font-mono font-black text-accent opacity-50 uppercase tracking-tighter">{new Date(log.createdAt).toLocaleTimeString("id-ID")}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-bg-2 border border-border flex items-center justify-center text-[10px] text-text-muted opacity-60">
                                 <i className="fas fa-microchip"></i>
                              </div>
                              <span className="text-xs font-black text-heading uppercase tracking-tight">{log.deviceName}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-text-secondary leading-tight">{log.activity}</span>
                              <span className="text-[9px] font-black text-text-muted uppercase tracking-widest mt-1 opacity-40 font-mono">{log.triggerType}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <div className={clsx(
                             "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all",
                             cfg.class
                           )}>
                              <i className={`fas ${cfg.icon} text-[9px]`}></i>
                              <span>{cfg.label}</span>
                           </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
