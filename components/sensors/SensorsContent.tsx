"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import type { Sensor } from "@/types";

const SENSOR_META: Record<string, { icon: string; color: string; bg: string; barClass: string; unit: string }> = {
  temperature: { icon: "fa-temperature-half", color: "text-red-400", bg: "bg-red-500/10", barClass: "temp-bar", unit: "°C" },
  humidity: { icon: "fa-droplet", color: "text-blue-400", bg: "bg-blue-500/10", barClass: "humidity-bar", unit: "%" },
  air_quality: { icon: "fa-wind", color: "text-green-400", bg: "bg-green-500/10", barClass: "air-bar", unit: "AQI" },
  presence: { icon: "fa-user-check", color: "text-purple-400", bg: "bg-purple-500/10", barClass: "", unit: "" },
  brightness: { icon: "fa-sun", color: "text-yellow-400", bg: "bg-yellow-500/10", barClass: "brightness-bar", unit: "%" },
  motion: { icon: "fa-person-running", color: "text-orange-400", bg: "bg-orange-500/10", barClass: "", unit: "" },
  smoke: { icon: "fa-fire", color: "text-red-500", bg: "bg-red-500/10", barClass: "smoke-bar", unit: "ppm" },
  gas: { icon: "fa-triangle-exclamation", color: "text-amber-500", bg: "bg-amber-500/10", barClass: "gas-bar", unit: "ppm" },
};

export default function SensorsContent({
  sensors: initialSensors,
}: {
  sensors: Sensor[];
}) {
  const { sensors, sensorData, sensorHistory, setSensors } = useAppStore();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", type: "temperature", unit: "", topic: "" });

  useEffect(() => {
    setSensors(initialSensors);
  }, []);

  const filtered = Object.values(sensors).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd() {
    if (!form.name.trim() || !form.topic.trim()) return;
    const res = await fetch("/api/sensors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowAdd(false);
      setForm({ name: "", type: "temperature", unit: "", topic: "" });
      const data = await fetch("/api/sensors").then((r) => r.json());
      setSensors(data);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus sensor ini?")) return;
    await fetch(`/api/sensors?id=${id}`, { method: "DELETE" });
    useAppStore.getState().removeSensor(id);
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-extrabold flex items-center gap-2">
            <i className="fas fa-signal text-accent"></i> Monitoring Sensor
          </h3>
          <p className="text-sm text-txt-secondary mt-1">
            Monitor data sensor secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-sm"></i>
            <input
              type="text"
              placeholder="Cari sensor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-accent transition w-48"
            />
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <i className="fas fa-plus"></i> Tambah Sensor
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-txt-muted">
          <i className="fas fa-signal text-4xl opacity-20 mb-3 block"></i>
          <p className="text-sm">{search ? "Tidak ada sensor ditemukan" : "Belum ada sensor"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const id = String(s.id);
            const meta = SENSOR_META[s.type] || { icon: "fa-microchip", color: "text-txt-muted", bg: "bg-surface", barClass: "default-bar", unit: "" };
            const value = sensorData[id] ?? s.latestValue;
            const history = sensorHistory[id] || [];
            const isOnline = s.lastSeen && new Date(s.lastSeen).getTime() > Date.now() - 5 * 60 * 1000;
            const pct = value != null ? Math.min(100, Math.max(0, (Number(value) / (s.type === "temperature" ? 50 : 100)) * 100)) : 0;

            return (
              <div key={s.id} className="sensor-card group">
                {/* Top */}
                <div className="flex items-start justify-content-between">
                  <div className="flex items-center gap-3">
                    <div className={`sensor-big-icon ${meta.bg} ${meta.color}`}>
                      <i className={`fas ${meta.icon}`}></i>
                    </div>
                    <div>
                      <div className="sensor-name">{s.name}</div>
                      <div className="text-[11px] text-txt-muted capitalize">{s.type.replace("_", " ")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-success" : "bg-txt-muted"}`} />
                    <button
                      onClick={() => handleDelete(id)}
                      className="p-1.5 rounded-lg hover:bg-danger/10 text-danger opacity-0 group-hover:opacity-100 transition"
                    >
                      <i className="fas fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>

                {/* Value */}
                <div>
                  <div className="sensor-value-big">
                    {value != null ? value : "—"}
                    <span className="text-sm font-normal text-txt-muted ml-1">{s.unit || meta.unit}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                {meta.barClass && (
                  <div>
                    <div className="progress-track">
                      <div className={`progress-fill ${meta.barClass}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-txt-muted font-mono mt-1">
                      <span>0</span>
                      <span>{s.type === "temperature" ? "50" : "100"}</span>
                    </div>
                  </div>
                )}

                {/* Presence special */}
                {s.type === "presence" && (
                  <div className="flex items-center gap-3">
                    <div className={`w-3.5 h-3.5 rounded-full transition-all ${(value ?? 0) > 0 ? "bg-success shadow-[0_0_12px_var(--success)]" : "bg-border"}`} />
                    <span className={`text-lg font-bold ${(value ?? 0) > 0 ? "text-success" : "text-txt-muted"}`}>
                      {(value ?? 0) > 0 ? "Terdeteksi" : "Tidak Ada"}
                    </span>
                  </div>
                )}

                {/* Topic */}
                <div className="text-[10px] text-txt-muted font-mono">{s.topic}</div>

                {/* Last seen */}
                <div className="text-[10px] text-txt-muted">
                  {s.lastSeen
                    ? `Last seen: ${new Date(s.lastSeen).toLocaleTimeString("id-ID")}`
                    : "Belum ada data"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Tambah Sensor</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Nama sensor" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                {Object.keys(SENSOR_META).map((t) => (
                  <option key={t} value={t}>{t.replace("_", " ")}</option>
                ))}
              </select>
              <input type="text" placeholder="Unit (°C, %, ppm, dll)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="input-field" />
              <input type="text" placeholder="Topic MQTT" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="input-field" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button onClick={handleAdd} className="btn-primary flex-1 justify-center">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
