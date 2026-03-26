"use client";

import { useEffect, useState } from "react";
import { useCV } from "@/hooks/useCV";
import { useAutomation } from "@/hooks/useAutomation";

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
  const cv = useCV();
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState(settings);

  // Auto-start if was active
  useEffect(() => {
    if (cvState.isActive && cv.modelLoaded) {
      cv.startDetection();
    }
  }, [cv.modelLoaded]);

  const conditionMap: Record<string, { label: string; color: string }> = {
    dark: { label: "Gelap", color: "text-blue-400" },
    normal: { label: "Normal", color: "text-green-400" },
    bright: { label: "Terang", color: "text-yellow-400" },
  };
  const cond = conditionMap[cv.lightCondition] || { label: cv.lightCondition, color: "text-txt-muted" };

  async function handleStart() {
    await cv.loadModel();
    const camOk = await cv.startCamera();
    if (camOk) {
      setTimeout(() => cv.startDetection(), 500);
    }
  }

  async function handleStop() {
    await cv.stopDetection();
    await cv.stopCamera();
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
    cv.setConfidence(config.confidence);
    setShowSettings(false);
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-extrabold flex items-center gap-2">
            <i className="fas fa-eye text-accent"></i> Computer Vision
          </h3>
          <p className="text-sm text-txt-secondary mt-1">
            Deteksi orang & analisis cahaya real-time.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSettings(true)} className="btn-secondary">
            <i className="fas fa-gear"></i> Settings
          </button>
          <button
            onClick={cv.detecting ? handleStop : handleStart}
            className={cv.detecting ? "btn-danger" : "btn-primary"}
          >
            <i className={`fas ${cv.detecting ? "fa-stop" : "fa-play"}`}></i>
            {cv.detecting ? "Stop" : "Start"}
            {cv.modelLoading && " (Loading...)"}
          </button>
        </div>
      </div>

      {/* Camera Feed */}
      <div className="card overflow-hidden">
        <div className="relative aspect-video bg-surface flex items-center justify-center">
          <video ref={cv.videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
          <canvas ref={cv.canvasRef} className="absolute inset-0 w-full h-full" />

          {!cv.detecting && (
            <div className="text-center text-txt-muted z-10">
              <i className="fas fa-video-slash text-4xl opacity-20 mb-3 block"></i>
              <p className="text-sm">Kamera nonaktif</p>
            </div>
          )}

          {/* Stats overlay */}
          {cv.detecting && (
            <>
              <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-xl p-3 text-xs space-y-1 z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                  <span>Live</span>
                </div>
                <div>FPS: <span className="font-bold">{cv.fps}</span></div>
              </div>
              {cv.showDebug && (
                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-xl p-3 text-xs space-y-1 z-10">
                  <div>People: <span className="font-bold">{cv.personCount}</span></div>
                  <div>Light: <span className={`font-bold ${cond.color}`}>{cond.label}</span></div>
                  <div>Brightness: <span className="font-bold">{cv.brightness}%</span></div>
                </div>
              )}
            </>
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
              <div className="text-2xl font-bold">{cv.personCount}</div>
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
              <div className="text-2xl font-bold">{cv.brightness}%</div>
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
              <div className={`text-2xl font-bold ${cond.color}`}>{cond.label}</div>
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
                <label className="text-xs text-txt-muted mb-1 block">Min Confidence ({Math.round(config.confidence * 100)}%)</label>
                <input type="range" min="0" max="100" value={config.confidence * 100}
                  onChange={(e) => setConfig({ ...config, confidence: Number(e.target.value) / 100 })} className="w-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-txt-muted mb-1 block">Ambang Gelap</label>
                  <input type="number" step="0.1" value={config.darkThreshold}
                    onChange={(e) => setConfig({ ...config, darkThreshold: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-txt-muted mb-1 block">Ambang Terang</label>
                  <input type="number" step="0.1" value={config.brightThreshold}
                    onChange={(e) => setConfig({ ...config, brightThreshold: Number(e.target.value) })} className="input-field" />
                </div>
              </div>
              <div className="flex gap-3">
                {[
                  { key: "humanEnabled", label: "Deteksi Orang" },
                  { key: "lightEnabled", label: "Analisis Cahaya" },
                ].map((item) => (
                  <button key={item.key} onClick={() => setConfig({ ...config, [item.key]: !(config as any)[item.key] })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                      (config as any)[item.key] ? "bg-accent/20 text-accent" : "bg-surface border border-border text-txt-muted"
                    }`}>
                    {item.label}: {(config as any)[item.key] ? "ON" : "OFF"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowSettings(false)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button onClick={saveConfig} className="btn-primary flex-1 justify-center">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
