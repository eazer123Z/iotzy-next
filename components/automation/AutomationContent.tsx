"use client";

import { useState } from "react";
import type { AutomationRule, Schedule } from "@/types";

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

interface Props {
  rules: (AutomationRule & { createdAt: string })[];
  schedules: (Schedule & { createdAt: string })[];
  devices: { id: number; name: string; icon: string; isActive: boolean }[];
  sensors: { id: number; name: string; type: string; unit: string | null }[];
}

export default function AutomationContent({ rules: initialRules, schedules: initialSchedules, devices, sensors }: Props) {
  const [tab, setTab] = useState<"rules" | "schedules">("rules");
  const [rules, setRules] = useState(initialRules);
  const [schedules, setSchedules] = useState(initialSchedules);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    sensor_id: "", device_id: "", condition_type: "gt",
    threshold: "", action: "on", start_time: "", end_time: "",
  });

  const deviceMap = Object.fromEntries(devices.map((d) => [d.id, d]));
  const sensorMap = Object.fromEntries(sensors.map((s) => [s.id, s]));

  async function toggleRule(id: number, enabled: boolean) {
    setRules((p) => p.map((r) => (r.id === id ? { ...r, isEnabled: enabled } : r)));
    await fetch("/api/automation", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "rule", id, is_enabled: enabled }),
    });
  }

  async function toggleSchedule(id: number, enabled: boolean) {
    setSchedules((p) => p.map((s) => (s.id === id ? { ...s, isEnabled: enabled } : s)));
    await fetch("/api/automation", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "schedule", id, is_enabled: enabled }),
    });
  }

  async function deleteRule(id: number) {
    if (!confirm("Hapus rule ini?")) return;
    setRules((p) => p.filter((r) => r.id !== id));
    await fetch(`/api/automation?type=rule&id=${id}`, { method: "DELETE" });
  }

  async function deleteSchedule(id: number) {
    if (!confirm("Hapus jadwal ini?")) return;
    setSchedules((p) => p.filter((s) => s.id !== id));
    await fetch(`/api/automation?type=schedule&id=${id}`, { method: "DELETE" });
  }

  async function addRule() {
    if (!form.device_id) return;
    const res = await fetch("/api/automation", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "rule",
        sensor_id: form.sensor_id ? Number(form.sensor_id) : null,
        device_id: Number(form.device_id),
        condition_type: form.condition_type,
        threshold: form.threshold ? Number(form.threshold) : null,
        action: form.action,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
      }),
    });
    if (res.ok) {
      setShowAdd(false);
      const data = await fetch("/api/automation").then((r) => r.json());
      setRules(data.rules);
    }
  }

  // Templates (from PHP)
  const templates = [
    { name: "Lampu Otomatis", icon: "fa-lightbulb", desc: "Nyala saat gelap" },
    { name: "Kipas Suhu", icon: "fa-wind", desc: "Nyala saat panas" },
    { name: "Kunci Otomatis", icon: "fa-lock", desc: "Terkunci otomatis" },
    { name: "Alarm Asap", icon: "fa-fire", desc: "Alert saat asap terdeteksi" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-extrabold flex items-center gap-2">
            <i className="fas fa-robot text-accent"></i> Rules Engine
          </h3>
          <p className="text-sm text-txt-secondary mt-1">
            Atur otomasi dan jadwal perangkat rumah pintar Anda.
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <i className="fas fa-plus"></i> Tambah Rule
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["rules", "schedules"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === t ? "bg-accent/20 text-accent" : "text-txt-muted hover:bg-surface"
            }`}
          >
            {t === "rules" ? `Rules (${rules.length})` : `Jadwal (${schedules.length})`}
          </button>
        ))}
      </div>

      {/* Rules */}
      {tab === "rules" && (
        <div className="space-y-4">
          {/* Templates */}
          <div className="card p-5">
            <div className="text-[10px] font-bold text-txt-muted uppercase tracking-wider mb-3 border-b border-dashed border-border pb-2">
              Template Cepat
            </div>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <button
                  key={t.name}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-surface border border-border text-xs font-semibold text-txt-secondary hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition"
                >
                  <i className={`fas ${t.icon}`}></i>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Rule Cards */}
          {rules.length === 0 ? (
            <div className="text-center py-16 text-txt-muted">
              <i className="fas fa-robot text-4xl opacity-20 mb-3 block"></i>
              <p className="text-sm">Belum ada aturan otomasi</p>
            </div>
          ) : (
            rules.map((rule) => {
              const dev = deviceMap[rule.deviceId];
              const sensor = rule.sensorId ? sensorMap[rule.sensorId] : null;
              const thresh = rule.threshold ?? `${rule.thresholdMin}-${rule.thresholdMax}`;

              return (
                <div key={rule.id} className="card overflow-hidden" style={{ borderTop: "3px solid var(--border)" }}>
                  <div className="p-4 border-b border-border bg-bg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rule.isEnabled ? "bg-accent/20 text-accent" : "bg-surface text-txt-muted"}`}>
                        <i className={`fas ${dev?.icon || "fa-plug"}`}></i>
                      </div>
                      <div>
                        <div className="font-bold text-sm">{dev?.name || "Unknown Device"}</div>
                        <div className="text-[11px] text-txt-secondary flex items-center gap-2 mt-0.5">
                          {sensor && <span>{sensor.name}</span>}
                          <span className="px-1.5 py-0.5 rounded bg-surface-hover font-mono text-[10px] text-heading font-bold">
                            {rule.conditionType} {thresh}{sensor?.unit || ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rule.isEnabled ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}>
                        {rule.isEnabled ? "ON" : "OFF"}
                      </span>
                      <button onClick={() => deleteRule(rule.id)} className="p-1.5 rounded-lg hover:bg-danger/10 text-danger">
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rule.action === "on" ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}>
                        {rule.action === "on" ? "NYALAKAN" : "MATIKAN"}
                      </span>
                      {rule.startTime && rule.endTime && (
                        <span className="flex items-center gap-1 text-[10px] bg-warning-bg text-warning px-2 py-0.5 rounded font-semibold font-mono">
                          <i className="fas fa-clock text-[8px]"></i> {rule.startTime} - {rule.endTime}
                        </span>
                      )}
                    </div>
                    <div
                      className={`toggle-switch ${rule.isEnabled ? "on" : ""}`}
                      onClick={() => toggleRule(rule.id, !rule.isEnabled)}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Schedules */}
      {tab === "schedules" && (
        <div className="space-y-3">
          {schedules.length === 0 ? (
            <div className="text-center py-16 text-txt-muted">
              <i className="fas fa-clock text-4xl opacity-20 mb-3 block"></i>
              <p className="text-sm">Belum ada jadwal</p>
            </div>
          ) : (
            schedules.map((sc) => {
              const days = (sc.days as number[]) || [];
              const dayStr = days.length ? days.map((d) => DAY_LABELS[d]).join(", ") : "Setiap hari";
              return (
                <div key={sc.id} className="card p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sc.isEnabled ? "bg-warning/20 text-warning" : "bg-surface text-txt-muted"}`}>
                    <i className="fas fa-clock"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm">{sc.label || "Jadwal"}</div>
                    <div className="text-[11px] text-txt-muted">
                      {sc.time} • {dayStr} • {sc.action}
                    </div>
                  </div>
                  <div className={`toggle-switch ${sc.isEnabled ? "on" : ""}`} onClick={() => toggleSchedule(sc.id, !sc.isEnabled)} />
                  <button onClick={() => deleteSchedule(sc.id)} className="p-1.5 rounded-lg hover:bg-danger/10 text-danger">
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add Rule Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Tambah Rule</h3>
            <div className="space-y-3">
              <select value={form.sensor_id} onChange={(e) => setForm({ ...form, sensor_id: e.target.value })} className="input-field">
                <option value="">Pilih Sensor (opsional)</option>
                {sensors.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}
              </select>
              <select value={form.device_id} onChange={(e) => setForm({ ...form, device_id: e.target.value })} className="input-field">
                <option value="">Pilih Perangkat</option>
                {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.condition_type} onChange={(e) => setForm({ ...form, condition_type: e.target.value })} className="input-field">
                  <option value="gt">Lebih dari</option>
                  <option value="lt">Kurang dari</option>
                  <option value="between">Antara</option>
                </select>
                <input type="number" placeholder="Threshold" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} className="input-field" />
              </div>
              <select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} className="input-field">
                <option value="on">Nyalakan</option>
                <option value="off">Matikan</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="time" placeholder="Dari" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="input-field" />
                <input type="time" placeholder="Sampai" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="input-field" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button onClick={addRule} className="btn-primary flex-1 justify-center">Tambah</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
