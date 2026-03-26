"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import type { Sensor } from "@/types";

const SENSOR_ICONS: Record<string, { icon: string; color: string }> = {
  temperature: { icon: "fa-temperature-half", color: "text-red-400" },
  humidity: { icon: "fa-droplet", color: "text-blue-400" },
  air_quality: { icon: "fa-wind", color: "text-green-400" },
  presence: { icon: "fa-user-check", color: "text-purple-400" },
  brightness: { icon: "fa-sun", color: "text-yellow-400" },
  motion: { icon: "fa-person-running", color: "text-orange-400" },
  smoke: { icon: "fa-fire", color: "text-red-500" },
  gas: { icon: "fa-triangle-exclamation", color: "text-amber-500" },
};

export default function SensorsContent({
  sensors: initialSensors,
}: {
  sensors: Sensor[];
}) {
  const { sensors, sensorData, setSensors } = useAppStore();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "temperature",
    unit: "",
    topic: "",
  });

  useEffect(() => {
    setSensors(initialSensors);
  }, []);

  const filtered = Object.values(sensors).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd() {
    if (!form.name.trim() || !form.topic.trim()) return;
    const method = editId ? "PUT" : "POST";
    const body = editId ? { id: Number(editId), ...form } : form;

    const res = await fetch("/api/sensors", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setShowAdd(false);
      setEditId(null);
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
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-heading">Sensor</h1>
          <p className="text-sm text-txt-secondary mt-1">
            Monitor data sensor secara real-time.
          </p>
        </div>
        <button
          onClick={() => {
            setShowAdd(true);
            setEditId(null);
            setForm({ name: "", type: "temperature", unit: "", topic: "" });
          }}
          className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/80 transition"
        >
          <i className="fas fa-plus mr-2"></i>Tambah
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-sm"></i>
        <input
          type="text"
          placeholder="Cari sensor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-accent transition"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-txt-muted">
          <i className="fas fa-signal text-4xl opacity-20 mb-3 block"></i>
          <p className="text-sm">
            {search ? "Tidak ada sensor ditemukan" : "Belum ada sensor"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const meta = SENSOR_ICONS[s.type] || {
              icon: "fa-microchip",
              color: "text-txt-muted",
            };
            const value = sensorData[String(s.id)] ?? s.latestValue;
            const isOnline =
              s.lastSeen &&
              new Date(s.lastSeen).getTime() > Date.now() - 5 * 60 * 1000;

            return (
              <div key={s.id} className="card p-5 group">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-xl ${meta.color}`}
                  >
                    <i className={`fas ${meta.icon}`}></i>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOnline ? "bg-success" : "bg-txt-muted"
                      }`}
                    />
                    <button
                      onClick={() => handleDelete(String(s.id))}
                      className="p-1.5 rounded-lg hover:bg-danger/10 text-danger opacity-0 group-hover:opacity-100 transition"
                    >
                      <i className="fas fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>
                <div className="font-semibold text-sm mb-1">{s.name}</div>
                <div className="text-[11px] text-txt-muted mb-3">
                  {s.topic}
                </div>
                <div className="text-2xl font-bold">
                  {value != null ? `${value}${s.unit || ""}` : "—"}
                </div>
                <div className="text-[10px] text-txt-muted mt-1">
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
            <h3 className="text-lg font-bold mb-4">
              {editId ? "Edit Sensor" : "Tambah Sensor"}
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nama sensor"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-accent"
              />
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-accent"
              >
                {Object.keys(SENSOR_ICONS).map((t) => (
                  <option key={t} value={t}>
                    {t.replace("_", " ")}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Unit (°C, %, ppm, dll)"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-accent"
              />
              <input
                type="text"
                placeholder="Topic MQTT"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setShowAdd(false);
                  setEditId(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-surface transition"
              >
                Batal
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/80 transition"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
