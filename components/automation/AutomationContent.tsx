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
  const [showAddRule, setShowAddRule] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    sensor_id: "",
    device_id: "",
    condition_type: "gt",
    threshold: "",
    action: "on",
    start_time: "",
    end_time: "",
  });

  async function toggleRule(id: number, enabled: boolean) {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isEnabled: enabled } : r))
    );
    await fetch("/api/automation", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "rule", id, is_enabled: enabled }),
    });
  }

  async function toggleSchedule(id: number, enabled: boolean) {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isEnabled: enabled } : s))
    );
    await fetch("/api/automation", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "schedule", id, is_enabled: enabled }),
    });
  }

  async function deleteRule(id: number) {
    if (!confirm("Hapus rule ini?")) return;
    setRules((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/automation?type=rule&id=${id}`, { method: "DELETE" });
  }

  async function deleteSchedule(id: number) {
    if (!confirm("Hapus jadwal ini?")) return;
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/automation?type=schedule&id=${id}`, { method: "DELETE" });
  }

  async function addRule() {
    if (!ruleForm.device_id) return;
    const res = await fetch("/api/automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "rule",
        sensor_id: ruleForm.sensor_id ? Number(ruleForm.sensor_id) : null,
        device_id: Number(ruleForm.device_id),
        condition_type: ruleForm.condition_type,
        threshold: ruleForm.threshold ? Number(ruleForm.threshold) : null,
        action: ruleForm.action,
        start_time: ruleForm.start_time || null,
        end_time: ruleForm.end_time || null,
      }),
    });
    if (res.ok) {
      setShowAddRule(false);
      // Refresh
      const data = await fetch("/api/automation").then((r) => r.json());
      setRules(data.rules);
    }
  }

  const deviceMap = Object.fromEntries(devices.map((d) => [d.id, d]));
  const sensorMap = Object.fromEntries(sensors.map((s) => [s.id, s]));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-heading">Automasi</h1>
          <p className="text-sm text-txt-secondary mt-1">Atur rules dan jadwal otomatis.</p>
        </div>
        <button
          onClick={() => setShowAddRule(true)}
          className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/80 transition"
        >
          <i className="fas fa-plus mr-2"></i>Tambah Rule
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
        <div className="space-y-3">
          {rules.length === 0 ? (
            <div className="text-center py-16 text-txt-muted">
              <i className="fas fa-robot text-4xl opacity-20 mb-3 block"></i>
              <p className="text-sm">Belum ada aturan otomasi</p>
            </div>
          ) : (
            rules.map((rule) => {
              const dev = deviceMap[rule.deviceId];
              const sensor = rule.sensorId ? sensorMap[rule.sensorId] : null;
              return (
                <div key={rule.id} className="card p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rule.isEnabled ? "bg-accent/20 text-accent" : "bg-surface text-txt-muted"}`}>
                    <i className={`fas ${dev?.icon || "fa-plug"}`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {sensor?.name || "Sensor"} {rule.conditionType} {rule.threshold}{sensor?.unit || ""} → {dev?.name || "Device"} {rule.action}
                    </div>
                    <div className="text-[10px] text-txt-muted">
                      {rule.startTime && rule.endTime ? `${rule.startTime} - ${rule.endTime}` : "Selalu aktif"}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleRule(rule.id, !rule.isEnabled)}
                    className={`w-10 h-6 rounded-full transition ${rule.isEnabled ? "bg-accent" : "bg-txt-muted/20"}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${rule.isEnabled ? "translate-x-5" : "translate-x-1"}`}></div>
                  </button>
                  <button onClick={() => deleteRule(rule.id)} className="p-1.5 rounded-lg hover:bg-danger/10 text-danger">
                    <i className="fas fa-trash text-xs"></i>
                  </button>
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
            schedules.map((sc) => (
              <div key={sc.id} className="card p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sc.isEnabled ? "bg-warning/20 text-warning" : "bg-surface text-txt-muted"}`}>
                  <i className="fas fa-clock"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{sc.label || "Jadwal"}</div>
                  <div className="text-[10px] text-txt-muted">
                    {sc.time} • {(sc.days as number[]).map((d) => DAY_LABELS[d]).join(", ") || "Setiap hari"} • {sc.action}
                  </div>
                </div>
                <button
                  onClick={() => toggleSchedule(sc.id, !sc.isEnabled)}
                  className={`w-10 h-6 rounded-full transition ${sc.isEnabled ? "bg-accent" : "bg-txt-muted/20"}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${sc.isEnabled ? "translate-x-5" : "translate-x-1"}`}></div>
                </button>
                <button onClick={() => deleteSchedule(sc.id)} className="p-1.5 rounded-lg hover:bg-danger/10 text-danger">
                  <i className="fas fa-trash text-xs"></i>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Rule Modal */}
      {showAddRule && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Tambah Rule</h3>
            <div className="space-y-3">
              <select
                value={ruleForm.sensor_id}
                onChange={(e) => setRuleForm({ ...ruleForm, sensor_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm"
              >
                <option value="">Pilih Sensor (opsional)</option>
                {sensors.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
                ))}
              </select>
              <select
                value={ruleForm.device_id}
                onChange={(e) => setRuleForm({ ...ruleForm, device_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm"
              >
                <option value="">Pilih Perangkat</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={ruleForm.condition_type}
                  onChange={(e) => setRuleForm({ ...ruleForm, condition_type: e.target.value })}
                  className="px-4 py-2.5 rounded-xl bg-surface border border-border text-sm"
                >
                  <option value="gt">Lebih dari</option>
                  <option value="lt">Kurang dari</option>
                  <option value="between">Antara</option>
                </select>
                <input
                  type="number"
                  placeholder="Threshold"
                  value={ruleForm.threshold}
                  onChange={(e) => setRuleForm({ ...ruleForm, threshold: e.target.value })}
                  className="px-4 py-2.5 rounded-xl bg-surface border border-border text-sm"
                />
              </div>
              <select
                value={ruleForm.action}
                onChange={(e) => setRuleForm({ ...ruleForm, action: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm"
              >
                <option value="on">Nyalakan</option>
                <option value="off">Matikan</option>
              </select>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddRule(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-surface transition">Batal</button>
              <button onClick={addRule} className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/80 transition">Tambah</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
