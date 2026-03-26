"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import type { Device } from "@/types";

const DEVICE_ICONS: Record<string, string> = {
  light: "fa-lightbulb",
  fan: "fa-wind",
  ac: "fa-snowflake",
  tv: "fa-tv",
  lock: "fa-lock",
  door: "fa-door-open",
  cctv: "fa-video",
  speaker: "fa-volume-up",
  switch: "fa-plug",
};

export default function DevicesContent({
  devices: initialDevices,
}: {
  devices: Device[];
}) {
  const { devices, deviceStates, setDevices, setDeviceState } = useAppStore();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    icon: "fa-plug",
    topic_sub: "",
    topic_pub: "",
  });

  useEffect(() => {
    setDevices(initialDevices);
  }, []);

  const filtered = Object.values(devices).filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

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

  async function handleAdd() {
    if (!form.name.trim()) return;
    const method = editId ? "PUT" : "POST";
    const body = editId ? { id: Number(editId), ...form } : form;
    const res = await fetch("/api/devices", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setShowAdd(false);
      setEditId(null);
      setForm({ name: "", icon: "fa-plug", topic_sub: "", topic_pub: "" });
      const data = await fetch("/api/devices").then((r) => r.json());
      setDevices(data);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus perangkat ini?")) return;
    await fetch(`/api/devices?id=${id}`, { method: "DELETE" });
    useAppStore.getState().removeDevice(id);
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-extrabold flex items-center gap-2">
            <i className="fas fa-microchip text-accent"></i> Monitoring Perangkat
          </h3>
          <p className="text-sm text-txt-secondary mt-1">
            Kontrol & status perangkat real-time rumah pintar Anda.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-sm"></i>
            <input
              type="text"
              placeholder="Cari perangkat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-accent transition w-48"
            />
          </div>
          <button
            onClick={() => {
              setShowAdd(true);
              setEditId(null);
              setForm({ name: "", icon: "fa-plug", topic_sub: "", topic_pub: "" });
            }}
            className="btn-primary"
          >
            <i className="fas fa-plus"></i> Tambah Perangkat
          </button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-txt-muted">
          <i className="fas fa-plug text-4xl opacity-20 mb-3 block"></i>
          <p className="text-sm mb-4">
            {search ? "Tidak ada perangkat ditemukan" : "Belum ada perangkat terhubung"}
          </p>
          {!search && (
            <button onClick={() => setShowAdd(true)} className="btn-primary">
              <i className="fas fa-plus mr-2"></i>Tambah Perangkat
            </button>
          )}
        </div>
      ) : (
        <div className="device-card-grid">
          {filtered.map((dev) => {
            const id = String(dev.id);
            const isOn = deviceStates[id] ?? Boolean(dev.lastState);
            return (
              <div
                key={dev.id}
                className={`device-card ${isOn ? "active" : ""}`}
                style={isOn ? { "--card-accent": "var(--accent)" } as any : undefined}
                onClick={() => toggleDevice(id)}
              >
                <div className="card-glow"></div>

                {/* Edit/Delete buttons */}
                <div className="absolute top-3 right-3 flex gap-1.5 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditId(id);
                      setForm({
                        name: dev.name,
                        icon: dev.icon,
                        topic_sub: dev.topicSub || "",
                        topic_pub: dev.topicPub || "",
                      });
                      setShowAdd(true);
                    }}
                    className="w-7 h-7 rounded-lg bg-black/50 border border-white/10 text-txt-secondary text-xs flex items-center justify-center hover:bg-surface-hover hover:text-txt transition"
                  >
                    <i className="fas fa-pen"></i>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(id);
                    }}
                    className="w-7 h-7 rounded-lg bg-black/50 border border-white/10 text-txt-secondary text-xs flex items-center justify-center hover:bg-danger-bg hover:text-danger transition"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>

                {/* Icon */}
                <div className="device-icon-wrap">
                  <i className={`fas ${dev.icon}`}></i>
                </div>

                {/* Info */}
                <div className="text-center z-2">
                  <div className="text-sm font-bold">{dev.name}</div>
                  <div className="text-[10px] text-txt-muted font-mono">
                    {dev.topicSub || "No topic"}
                  </div>
                </div>

                {/* Status Pill */}
                <div className={`device-status-pill ${isOn ? "on" : ""}`}>
                  {isOn ? "ON" : "OFF"}
                </div>

                {/* Toggle */}
                <div
                  className={`toggle-switch ${isOn ? "on" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDevice(id);
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {editId ? "Edit Perangkat" : "Tambah Perangkat"}
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nama perangkat"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
              />
              <div>
                <label className="text-xs text-txt-muted mb-2 block">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(DEVICE_ICONS).map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setForm({ ...form, icon })}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
                        form.icon === icon
                          ? "bg-accent/20 text-accent border border-accent"
                          : "bg-surface border border-border text-txt-muted hover:border-border-hover"
                      }`}
                    >
                      <i className={`fas ${icon}`}></i>
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                placeholder="Topic Subscribe (MQTT)"
                value={form.topic_sub}
                onChange={(e) => setForm({ ...form, topic_sub: e.target.value })}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Topic Publish (MQTT)"
                value={form.topic_pub}
                onChange={(e) => setForm({ ...form, topic_pub: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowAdd(false); setEditId(null); }}
                className="btn-secondary flex-1 justify-center"
              >
                Batal
              </button>
              <button onClick={handleAdd} className="btn-primary flex-1 justify-center">
                {editId ? "Simpan" : "Tambah"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
