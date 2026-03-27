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
    info: { label: "Information", icon: "fa-info-circle", class: "text-accent bg-accent/10 border-accent/20" },
    success: { label: "Execution", icon: "fa-check-circle", class: "text-success bg-success/10 border-success/20" },
    warning: { label: "Alert", icon: "fa-exclamation-triangle", class: "text-warning bg-warning/10 border-warning/20" },
    error: { label: "Critical", icon: "fa-skull-crossbones", class: "text-danger bg-danger/10 border-danger/20" },
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1600px] mx-auto pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-1">
           <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_var(--accent)]" />
              <span className="text-[10px] font-black uppercase tracking-[3px] text-accent opacity-70">Data Layer</span>
           </div>
           <h2 className="text-3xl font-black text-heading tracking-tight">Neural <span className="text-text-muted opacity-30">Activity Logs</span></h2>
           <p className="text-sm text-text-secondary font-medium opacity-60">Complete audit trail of system events and node interactions.</p>
        </div>
        
        <button
          onClick={exportCSV}
          className="px-6 py-3 rounded-2xl bg-surface/50 backdrop-blur-md border border-border/40 text-text-secondary font-black text-[10px] uppercase tracking-widest hover:border-accent/40 hover:text-accent transition-all flex items-center gap-2 group"
        >
          <i className="fas fa-download group-hover:scale-110 transition-transform"></i>
          <span>Dump Neural DB (CSV)</span>
        </button>
      </div>

      {/* ── Performance Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Logs", value: stats.total, icon: "fa-database", color: "text-accent", glow: "shadow-[0_0_20px_rgba(0,242,255,0.1)]" },
          { label: "Today Context", value: stats.today, icon: "fa-bolt", color: "text-success", glow: "shadow-[0_0_20px_rgba(0,255,157,0.1)]" },
          { label: "Active Alerts", value: stats.warnings, icon: "fa-shield-halved", color: "text-warning", glow: "shadow-[0_0_20px_rgba(255,191,0,0.1)]" },
          { label: "Critical Faults", value: stats.errors, icon: "fa-diamond-exclamation", color: "text-danger", glow: "shadow-[0_0_20px_rgba(255,59,48,0.1)]" },
        ].map((s) => (
          <div key={s.label} className={clsx("relative p-6 rounded-[32px] bg-surface/30 border border-border/40 backdrop-blur-[var(--glass-blur)] group overflow-hidden transition-all duration-500 hover:-translate-y-1", s.glow)}>
             <div className="flex items-center justify-between relative z-10">
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-text-muted uppercase tracking-[2px] mb-2">{s.label}</span>
                   <span className={clsx("text-3xl font-black font-mono tracking-tighter", s.color)}>{s.value.toLocaleString()}</span>
                </div>
                <div className={clsx("w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl transition-all duration-500 group-hover:scale-110", s.color)}>
                   <i className={`fas ${s.icon}`}></i>
                </div>
             </div>
             {/* Decorative Background Icon */}
             <i className={`fas ${s.icon} absolute -bottom-4 -right-4 text-6xl opacity-[0.03] group-hover:scale-125 transition-transform duration-1000 rotate-12`}></i>
          </div>
        ))}
      </div>

      {/* ── Log Management Interface ── */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-4 px-2">
           {/* Filters */}
           <div className="flex p-1 gap-2 rounded-2xl bg-surface/50 border border-border/40 w-fit backdrop-blur-md overflow-x-auto max-w-full">
             {["all", "info", "success", "warning", "error"].map((t) => (
               <button
                 key={t}
                 onClick={() => setFilter(t)}
                 className={clsx(
                   "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                   filter === t 
                     ? "bg-accent text-bg shadow-[0_0_15px_var(--accent-glow)]" 
                     : "text-text-muted hover:text-heading hover:bg-white/5"
                 )}
               >
                 {t === "all" ? "Stream All" : t}
               </button>
             ))}
           </div>

           {/* Search Input */}
           <div className="relative group flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                 <i className="fas fa-search text-text-muted text-xs group-focus-within:text-accent transition-colors"></i>
              </div>
              <input
                type="text"
                placeholder="Query neutral activity logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-surface/50 backdrop-blur-md border border-border/40 text-sm focus:outline-none focus:border-accent/40 focus:shadow-[0_0_20px_rgba(0,242,255,0.05)] transition-all placeholder:text-text-muted/50 font-semibold"
              />
           </div>
        </div>

        {/* ── Log Table Container ── */}
        <div className="rounded-[32px] bg-surface/30 backdrop-blur-[var(--glass-blur)] border border-border/40 overflow-hidden shadow-2xl relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/40 bg-white/5">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[2px] text-text-muted">Temporal Timestamp</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[2px] text-text-muted">Identified Node</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[2px] text-text-muted">Action Trace</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[2px] text-text-muted text-right">Signature Logic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-24 text-center">
                       <i className="fas fa-microchip text-4xl text-text-muted opacity-10 mb-4 block"></i>
                       <p className="text-sm font-bold text-text-muted opacity-50">Zero activity events found in specified time window.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((log) => {
                    const cfg = typeConfig[log.logType] || { label: "Unknown", icon: "fa-terminal", class: "text-text-muted bg-white/5" };
                    return (
                      <tr key={log.id} className="group hover:bg-accent/[0.02] transition-colors">
                        <td className="px-8 py-5">
                           <div className="flex flex-col">
                              <span className="text-xs font-mono font-bold text-text-secondary">{new Date(log.createdAt).toLocaleDateString("id-ID")}</span>
                              <span className="text-[10px] font-mono font-black text-accent opacity-60 tracking-tighter uppercase">{new Date(log.createdAt).toLocaleTimeString("id-ID")}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs text-text-muted">
                                 <i className="fas fa-plug"></i>
                              </div>
                              <span className="text-xs font-black text-heading uppercase tracking-tight">{log.deviceName}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex flex-col">
                              <span className="text-xs font-bold text-text-secondary leading-tight">{log.activity}</span>
                              <span className="text-[9px] font-black text-text-muted uppercase tracking-widest mt-1 opacity-40">T-SRC: {log.triggerType}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <div className={clsx(
                             "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all group-hover:scale-105",
                             cfg.class
                           )}>
                              <i className={`fas ${cfg.icon} text-[10px]`}></i>
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
