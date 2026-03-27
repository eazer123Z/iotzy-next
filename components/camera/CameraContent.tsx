"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { useCV } from "@/hooks/useCV";

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
  const [showModal, setShowModal] = useState(false);
  const [config, setConfig] = useState(settings);

  // Auto-start logic
  useEffect(() => {
    if (cvState.isActive && cv.modelLoaded) {
      cv.startDetection();
    }
  }, [cv.modelLoaded]);

  const conditionMap: Record<string, { label: string; color: string }> = {
    dark: { label: "LOW LIGHT", color: "text-blue-400" },
    normal: { label: "OPTIMAL", color: "text-success" },
    bright: { label: "HIGH LIGHT", color: "text-warning" },
  };
  const cond = conditionMap[cv.lightCondition] || { label: cv.lightCondition.toUpperCase(), color: "text-text-muted" };

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
    setShowModal(false);
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1400px] mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)]" />
            <span className="text-[10px] font-black uppercase tracking-[3px] text-text-muted">Visual Intelligence Node</span>
          </div>
          <h1 className="text-3xl font-black text-heading tracking-tighter">Computer Vision</h1>
          <p className="text-text-secondary text-sm font-bold opacity-60">Real-time object detection and environmental analysis.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowModal(true)} 
            className="px-6 py-3 rounded-2xl bg-bg-2 border border-border text-text-muted text-[10px] font-black uppercase tracking-widest hover:text-heading transition-all flex items-center gap-2"
          >
            <i className="fas fa-cog"></i>
            <span>Calibration</span>
          </button>
          <button
            onClick={cv.detecting ? handleStop : handleStart}
            className={clsx(
              "px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center gap-2",
              cv.detecting ? "bg-bg-2 text-danger border border-danger/20" : "bg-accent text-bg"
            )}
          >
            <i className={clsx("fas", cv.detecting ? "fa-power-off" : "fa-play")}></i>
            <span>{cv.detecting ? "Disconnect" : "Initialize"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 px-4">
        {/* ── Feed ── */}
        <div className="xl:col-span-8 space-y-6">
           <div className="relative aspect-video rounded-[32px] bg-bg-2 border border-border overflow-hidden group shadow-sm">
              <video ref={cv.videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
              <canvas ref={cv.canvasRef} className="absolute inset-0 w-full h-full" />

              {/* HUD Overlay */}
              <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                 <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-2">
                       <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg/40 backdrop-blur-md border border-border w-fit">
                          <div className={clsx("w-1.5 h-1.5 rounded-full", cv.detecting ? "bg-success animate-pulse" : "bg-text-muted")} />
                          <span className="text-[9px] font-black uppercase text-heading tracking-widest">{cv.detecting ? "Live Link" : "Standby"}</span>
                       </div>
                    </div>
                    {cv.detecting && (
                       <div className="px-4 py-2 rounded-xl bg-accent/10 backdrop-blur-md border border-accent/20 text-accent flex items-center gap-4">
                          <div className="text-right">
                             <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Identification</p>
                             <p className="text-sm font-black tracking-tight">{cv.personCount} ENTITIES</p>
                          </div>
                          <i className="fas fa-user-check text-sm opacity-60"></i>
                       </div>
                    )}
                 </div>

                 {!cv.detecting && (
                    <div className="m-auto flex flex-col items-center gap-4 text-center opacity-40">
                       <i className="fas fa-eye-slash text-4xl"></i>
                       <div>
                          <p className="text-xs font-black uppercase tracking-tighter text-heading">Optical Array Off</p>
                          <p className="text-[9px] font-bold text-text-muted uppercase tracking-[2px]">Waiting for signal</p>
                       </div>
                    </div>
                 )}

                 {cv.detecting && (
                    <div className="flex items-end justify-between">
                       <div className="flex gap-4">
                          <div className="flex flex-col">
                             <span className="text-[7px] font-black text-text-muted uppercase tracking-widest">Process Node</span>
                             <span className="text-[9px] font-black font-mono text-accent">CV-CORE-UXL</span>
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[7px] font-black text-text-muted uppercase tracking-widest">FPS Rate</span>
                             <span className="text-[9px] font-black font-mono text-success">{cv.fps} HZ</span>
                          </div>
                       </div>
                       <div className="text-[8px] font-black text-text-muted uppercase tracking-[3px]">Secure Protocol Active</div>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* ── Telemetry ── */}
        <div className="xl:col-span-4 flex flex-col gap-6">
           {/* Card: Entity Status */}
           <div className="card p-8 flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center justify-between opacity-60">
                 <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Entity Tracking</span>
                 <i className="fas fa-users-viewfinder text-sm text-accent"></i>
              </div>
              <div>
                 <h3 className="text-4xl font-black text-heading tracking-tighter mb-1">{cv.personCount}</h3>
                 <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Detected in Frame</p>
              </div>
           </div>

           {/* Card: Luminance */}
           <div className="card p-8 flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center justify-between opacity-60">
                 <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Luminance</span>
                 <i className="fas fa-sun text-sm text-warning"></i>
              </div>
              <div>
                 <div className="flex items-baseline gap-3 mb-2">
                    <h3 className="text-4xl font-black text-heading tracking-tighter">{cv.brightness}%</h3>
                    <span className={clsx("text-[10px] font-black uppercase tracking-widest", cond.color)}>{cond.label}</span>
                 </div>
                 <div className="h-1.5 w-full bg-bg-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent transition-all duration-1000" 
                      style={{ width: `${cv.brightness}%` }} 
                    />
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-bg/60 backdrop-blur-xl z-[60] flex items-center justify-center p-6 animate-fadeIn">
          <div className="card w-full max-w-lg overflow-hidden animate-slideUp shadow-2xl">
            <div className="px-8 py-6 border-b border-border shadow-sm flex items-center justify-between bg-white/[0.02]">
               <h2 className="text-lg font-black text-heading uppercase tracking-tighter">Calibration</h2>
               <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-danger">
                  <i className="fas fa-times"></i>
               </button>
            </div>
            
            <div className="p-8 space-y-8">
               {/* Confidence */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Confidence Threshold</label>
                     <span className="text-xs font-black text-accent">{Math.round(config.confidence * 100)}%</span>
                  </div>
                  <div className="relative h-2 w-full bg-bg-2 rounded-full overflow-hidden">
                     <input 
                       type="range" min="0" max="100" value={config.confidence * 100}
                       onChange={(e) => setConfig({ ...config, confidence: Number(e.target.value) / 100 })} 
                       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                     />
                     <div className="h-full bg-accent transition-all duration-150 pointer-events-none" style={{ width: `${config.confidence * 100}%` }} />
                  </div>
               </div>

               {/* Thresholds */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Luminance Floor</label>
                     <input type="number" step="0.1" value={config.darkThreshold} onChange={(e) => setConfig({ ...config, darkThreshold: Number(e.target.value) })} className="w-full px-5 py-3.5 rounded-2xl bg-bg-2 border border-border focus:border-accent focus:outline-none text-xs font-bold" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Luminance Ceiling</label>
                     <input type="number" step="0.1" value={config.brightThreshold} onChange={(e) => setConfig({ ...config, brightThreshold: Number(e.target.value) })} className="w-full px-5 py-3.5 rounded-2xl bg-bg-2 border border-border focus:border-accent focus:outline-none text-xs font-bold" />
                  </div>
               </div>

               {/* Modules */}
               <div className="grid grid-cols-2 gap-4 pt-2">
                  {[
                    { key: "humanEnabled", label: "Human Tracking", icon: "fa-user-plus" },
                    { key: "lightEnabled", label: "Lux Analysis", icon: "fa-cloud-sun" },
                  ].map((item) => (
                    <button 
                      key={item.key} 
                      onClick={() => setConfig({ ...config, [item.key]: !(config as any)[item.key] })}
                      className={clsx(
                        "flex flex-col items-center gap-4 p-6 rounded-2xl border transition-all",
                        (config as any)[item.key] ? "bg-accent/5 border-accent/20 text-accent" : "bg-bg-2 border-border text-text-muted"
                      )}
                    >
                      <i className={clsx("fas", item.icon, "text-xl opacity-60")}></i>
                      <div className="text-center leading-tight">
                         <span className="text-[10px] font-black uppercase block">{item.label}</span>
                         <span className="text-[8px] font-black uppercase opacity-60">Status: {(config as any)[item.key] ? "Active" : "Null"}</span>
                      </div>
                    </button>
                  ))}
               </div>
            </div>

            <div className="px-8 py-6 bg-white/[0.02] border-t border-border flex gap-4">
               <button onClick={() => { setShowModal(false); setConfig(settings); }} className="flex-1 py-4 rounded-2xl bg-bg-2 text-[10px] font-black uppercase tracking-widest text-text-muted">Discard</button>
               <button onClick={saveConfig} className="flex-1 py-4 rounded-2xl bg-accent text-bg text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-[1.02] active:scale-95 transition-all">Apply Params</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
