"use client";

import { useState } from "react";

interface CvState {
  isActive: boolean;
  modelLoaded: boolean;
  personCount: number;
  brightness: number;
  lightCondition: string;
}

interface Props {
  cvState: CvState;
  settings: {
    confidence: number;
    darkThreshold: number;
    brightThreshold: number;
    humanEnabled: boolean;
    lightEnabled: boolean;
  };
}

export default function CameraContent({ cvState, settings }: Props) {
  const [isActive, setIsActive] = useState(cvState.isActive);
  const [stats, setStats] = useState(cvState);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState(settings);

  async function toggleDetection() {
    const newState = !isActive;
    setIsActive(newState);
    await fetch("/api/cv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_state",
        is_active: newState,
      }),
    });
  }

  async function saveConfig() {
    await fetch("/api/cv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_config",
        min_confidence: config.confidence,
        dark_threshold: config.darkThreshold,
        bright_threshold: config.brightThreshold,
        human_enabled: config.humanEnabled,
        light_enabled: config.lightEnabled,
      }),
    });
    setShowSettings(false);
  }

  const conditionMap: Record<string, { label: string; color: string }> = {
    dark: { label: "Gelap", color: "text-blue-400" },
    normal: { label: "Normal", color: "text-green-400" },
    bright: { label: "Terang", color: "text-yellow-400" },
  };

  const cond = conditionMap[stats.lightCondition] || {
    label: stats.lightCondition,
    color: "text-txt-muted",
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-heading">
            Computer Vision
          </h1>
          <p className="text-sm text-txt-secondary mt-1">
            Deteksi orang & analisis cahaya real-time.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-surface transition"
          >
            <i className="fas fa-gear mr-2"></i>Settings
          </button>
          <button
            onClick={toggleDetection}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              isActive
                ? "bg-danger/20 text-danger hover:bg-danger/30"
                : "bg-accent text-white hover:bg-accent/80"
            }`}
          >
            <i className={`fas ${isActive ? "fa-stop" : "fa-play"} mr-2`}></i>
            {isActive ? "Stop" : "Start"}
          </button>
        </div>
      </div>

      {/* Camera Feed */}
      <div className="card overflow-hidden">
        <div className="relative aspect-video bg-surface flex items-center justify-center">
          {isActive ? (
            <div className="text-center text-txt-muted">
              <i className="fas fa-video text-4xl opacity-30 mb-3 block"></i>
              <p className="text-sm">
                Camera feed akan tampil di sini
              </p>
              <p className="text-[11px] mt-1">
                TensorFlow.js COCO-SSD (client-side)
              </p>
            </div>
          ) : (
            <div className="text-center text-txt-muted">
              <i className="fas fa-video-slash text-4xl opacity-20 mb-3 block"></i>
              <p className="text-sm">Kamera nonaktif</p>
            </div>
          )}

          {/* Stats overlay */}
          {isActive && (
            <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-xl p-3 text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                <span>Live</span>
              </div>
              <div>
                FPS: <span className="font-bold">—</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <i className="fas fa-users"></i>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.personCount}</div>
              <div className="text-[11px] text-txt-muted">Orang Terdeteksi</div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center">
              <i className="fas fa-sun"></i>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.brightness}%</div>
              <div className="text-[11px] text-txt-muted">Kecerahan</div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <i className="fas fa-lightbulb"></i>
            </div>
            <div>
              <div className={`text-2xl font-bold ${cond.color}`}>
                {cond.label}
              </div>
              <div className="text-[11px] text-txt-muted">Kondisi Cahaya</div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Pengaturan CV</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-txt-muted block mb-1">
                  Min Confidence ({Math.round(config.confidence * 100)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.confidence * 100}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      confidence: Number(e.target.value) / 100,
                    })
                  }
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-txt-muted block mb-1">
                    Ambang Gelap
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.darkThreshold}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        darkThreshold: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-txt-muted block mb-1">
                    Ambang Terang
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.brightThreshold}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        brightThreshold: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                {[
                  { key: "humanEnabled", label: "Deteksi Orang" },
                  { key: "lightEnabled", label: "Analisis Cahaya" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() =>
                      setConfig({
                        ...config,
                        [item.key]: !(config as any)[item.key],
                      })
                    }
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                      (config as any)[item.key]
                        ? "bg-accent/20 text-accent"
                        : "bg-surface border border-border text-txt-muted"
                    }`}
                  >
                    {item.label}: {(config as any)[item.key] ? "ON" : "OFF"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-surface transition"
              >
                Batal
              </button>
              <button
                onClick={saveConfig}
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
