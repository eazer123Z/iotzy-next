"use client";

import { useEffect, useState } from "react";
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

  async function toggleDevice(id: string) {
    const currentState = deviceStates[id];
    const newState = !currentState;
    setDeviceState(id, newState);

    await fetch("/api/devices/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: Number(id), state: newState }),
    });
  }

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
      // Refresh
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
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-heading">Perangkat</h1>
          <p className="text-sm text-txt-secondary mt-1">
            Kelola semua perangkat IoT Anda.
          </p>
        </div>
        <button
          onClick={() => {
            setShowAdd(true);
            setEditId(null);
            setForm({ name: "", icon: "fa-plug", topic_sub: "", topic_pub: "" });
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
          placeholder="Cari perangkat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-accent transition"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-txt-muted">
          <i className="fas fa-microchip text-4xl opacity-20 mb-3 block"></i>
          <p className="text-sm">
            {search ? "Tidak ada perangkat ditemukan" : "Belum ada perangkat"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((dev) => {
            const isOn = deviceStates[String(dev.id)] ?? Boolean(dev.lastState);
            return (
              <div
                key={dev.id}
                className="card p-5 group hover:border-accent/30 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${
                      isOn
                        ? "bg-accent/20 text-accent"
                        : "bg-surface text-txt-muted"
                    }`}
                  >
                    <i className={`fas ${dev.icon}`}></i>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => {
                        setEditId(String(dev.id));
                        setForm({
                          name: dev.name,
                          icon: dev.icon,
                          topic_sub: dev.topicSub || "",
                          topic_pub: dev.topicPub || "",
                        });
                        setShowAdd(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-surface text-txt-muted"
                    >
                      <i className="fas fa-pen text-xs"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(String(dev.id))}
                      className="p-1.5 rounded-lg hover:bg-danger/10 text-danger"
                    >
                      <i className="fas fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="font-semibold text-sm">{dev.name}</div>
                  <div className="text-[11px] text-txt-muted mt-0.5">
                    {dev.topicSub || "No topic"}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isOn
                        ? "bg-success/10 text-success"
                        : "bg-txt-muted/10 text-txt-muted"
                    }`}
                  >
                    {isOn ? "ON" : "OFF"}
                  </span>
                  <button
                    onClick={() => toggleDevice(String(dev.id))}
                    className={`w-10 h-6 rounded-full transition-all ${
                      isOn ? "bg-accent" : "bg-txt-muted/20"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        isOn ? "translate-x-5" : "translate-x-1"
                      }`}
                    ></div>
                  </button>
                </div>
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
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-accent"
              />
              <div>
                <label className="text-xs text-txt-muted mb-1 block">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(DEVICE_ICONS).map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setForm({ ...form, icon })}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
                        form.icon === icon
                          ? "bg-accent/20 text-accent border border-accent"
                          : "bg-surface border border-border text-txt-muted"
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
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-accent"
              />
              <input
                type="text"
                placeholder="Topic Publish (MQTT)"
                value={form.topic_pub}
                onChange={(e) => setForm({ ...form, topic_pub: e.target.value })}
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
                {editId ? "Simpan" : "Tambah"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
