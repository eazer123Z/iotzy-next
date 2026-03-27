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
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState(settings);

  // Auto-start if was active
  useEffect(() => {
    if (cvState.isActive && cv.modelLoaded) {
      cv.startDetection();
    }
  }, [cv.modelLoaded]);

  const conditionMap: Record<string, { label: string; color: string; bg: string }> = {
    dark: { label: "LOW LIGHT", color: "text-blue-400", bg: "bg-blue-400/10" },
    normal: { label: "OPTIMAL", color: "text-green-400", bg: "bg-green-400/10" },
    bright: { label: "HIGH LIGHT", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  };
  const cond = conditionMap[cv.lightCondition] || { label: cv.lightCondition.toUpperCase(), color: "text-text-muted", bg: "bg-white/5" };

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
    <div className="space-y-8 animate-fadeIn max-w-[1600px] mx-auto pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-1">
           <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_var(--accent)]" />
              <span className="text-[10px] font-black uppercase tracking-[3px] text-accent opacity-70">Vision System</span>
           </div>
           <h2 className="text-3xl font-black text-heading tracking-tight">Computer <span className="text-text-muted opacity-30">Vision Beta</span></h2>
           <p className="text-sm text-text-secondary font-medium opacity-60">Advanced human detection and environmental lighting analysis.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setShowSettings(true)} 
             className="px-6 py-3 rounded-2xl bg-surface/50 backdrop-blur-md border border-border/40 text-text-secondary font-black text-[10px] uppercase tracking-widest hover:border-accent/40 hover:text-accent transition-all flex items-center gap-2"
           >
              <i className="fas fa-microchip"></i>
              <span>Core Config</span>
           </button>
           <button
             onClick={cv.detecting ? handleStop : handleStart}
             className={clsx(
               "px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-2xl",
               cv.detecting 
                 ? "bg-danger text-white shadow-[0_0_20px_rgba(255,59,48,0.3)] hover:bg-danger-light" 
                 : "bg-accent text-bg shadow-[0_0_20px_var(--accent-glow)] hover:scale-105"
             )}
           >
             <i className={clsx("fas", cv.detecting ? "fa-stop-circle" : "fa-play-circle")}></i>
             <span>{cv.detecting ? "Terminate" : "Initialize"}</span>
             {cv.modelLoading && <span className="ml-1 opacity-50 shrink-0">(Syncing...)</span>}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* ── Primary Visual Feed ── */}
        <div className="xl:col-span-8 flex flex-col gap-6">
           <div className="relative aspect-video rounded-[40px] bg-black/40 border border-border/30 overflow-hidden shadow-2xl group group-hover:border-accent/20 transition-all duration-700">
              <video ref={cv.videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
              <canvas ref={cv.canvasRef} className="absolute inset-0 w-full h-full" />

              {/* Status HUD Overlay */}
              <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                 <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-2">
                       <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 w-fit">
                          <div className={clsx("w-2 h-2 rounded-full", cv.detecting ? "bg-success animate-pulse shadow-[0_0_10px_var(--success)]" : "bg-text-muted")} />
                          <span className="text-[10px] font-black uppercase text-heading tracking-[2px]">{cv.detecting ? "Live Stream" : "Link Offline"}</span>
                       </div>
                       {cv.detecting && (
                          <div className="px-3 py-1 rounded-lg bg-black/40 backdrop-blur-sm border border-white/5 text-[9px] font-mono text-accent w-fit uppercase font-bold tracking-tighter">
                             FPS: {cv.fps} :: DATA_STABLE
                          </div>
                       )}
                    </div>
                    
                    {cv.detecting && (
                       <div className="flex flex-col gap-2 items-end">
                          <div className="px-4 py-2 rounded-2xl bg-accent/10 backdrop-blur-xl border border-accent/30 text-accent flex items-center gap-3">
                             <div className="flex flex-col leading-none">
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-0.5">Identification</span>
                                <span className="text-xl font-black font-mono tracking-tighter">{cv.personCount} PERSONS</span>
                             </div>
                             <i className="fas fa-users-viewfinder text-xl"></i>
                          </div>
                       </div>
                    )}
                 </div>

                 {!cv.detecting && (
                    <div className="m-auto flex flex-col items-center gap-4 text-center">
                       <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-text-muted border border-white/10">
                          <i className="fas fa-eye-slash text-3xl opacity-20"></i>
                       </div>
                       <div className="space-y-1">
                          <h4 className="text-lg font-black text-heading uppercase tracking-tight">Vision Node Idle</h4>
                          <p className="text-xs font-bold text-text-muted uppercase tracking-[2px] opacity-60">Waiting for initialization signal...</p>
                       </div>
                    </div>
                 )}

                 {cv.detecting && (
                    <div className="flex items-end justify-between">
                       <div className="flex gap-4">
                          <div className="flex flex-col">
                             <span className="text-[8px] font-black text-text-muted uppercase tracking-[3px] mb-1">Process ID</span>
                             <span className="text-[10px] font-black font-mono text-accent">CV_NOD_00X1FF</span>
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[8px] font-black text-text-muted uppercase tracking-[3px] mb-1">Encryption</span>
                             <span className="text-[10px] font-black font-mono text-success">AES_ACTIVE</span>
                          </div>
                       </div>
                       <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/60 border border-white/10">
                          <i className={clsx("fas fa-circle-nodes text-xs", cv.detecting ? "text-accent animate-spin-slow" : "text-text-muted")} />
                          <span className="text-[10px] font-black text-heading uppercase tracking-widest">Neural Sync Operational</span>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* ── Telemetry Sidebar ── */}
        <div className="xl:col-span-4 flex flex-col gap-6">
           <div className="grid grid-cols-1 gap-6 flex-1">
              
              {/* Persons Card */}
              <div className="relative p-8 rounded-[40px] bg-surface/30 border border-border/40 backdrop-blur-[var(--glass-blur)] overflow-hidden group">
                 <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full" />
                 <div className="relative z-10 flex flex-col justify-between h-full space-y-8">
                    <div className="flex items-center justify-between">
                       <span className="text-[11px] font-black text-text-muted uppercase tracking-[3px]">Human Correlation</span>
                       <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                          <i className="fas fa-users-rays"></i>
                       </div>
                    </div>
                    <div>
                       <div className="text-5xl font-black font-mono text-heading tracking-tighter mb-2">{cv.personCount}</div>
                       <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">Tracked Entities</span>
                          <div className="h-px bg-white/5 flex-1" />
                       </div>
                    </div>
                    <p className="text-[10px] font-bold text-text-muted opacity-60 leading-relaxed uppercase tracking-[1px]">Dynamic pattern matching against stored kinetic profiles.</p>
                 </div>
              </div>

              {/* Luminance Card */}
              <div className="relative p-8 rounded-[40px] bg-surface/30 border border-border/40 backdrop-blur-[var(--glass-blur)] overflow-hidden group">
                 <div className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-500/10 blur-3xl rounded-full" />
                 <div className="relative z-10 flex flex-col justify-between h-full space-y-8">
                    <div className="flex items-center justify-between">
                       <span className="text-[11px] font-black text-text-muted uppercase tracking-[3px]">Luminance Index</span>
                       <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center border border-yellow-500/20">
                          <i className="fas fa-expand"></i>
                       </div>
                    </div>
                    <div>
                       <div className="flex items-baseline gap-2">
                          <div className="text-5xl font-black font-mono text-heading tracking-tighter mb-2">{cv.brightness}%</div>
                          <span className={clsx("text-xs font-black uppercase tracking-tight", cond.color)}>{cond.label}</span>
                       </div>
                       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-1 mt-2">
                          <div 
                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-1000 shadow-[0_0_10px_rgba(234,179,8,0.2)]" 
                            style={{ width: `${cv.brightness}%` }} 
                          />
                       </div>
                    </div>
                    <p className="text-[10px] font-bold text-text-muted opacity-60 leading-relaxed uppercase tracking-[1px]">Real-time environmental lux calculation from visual array.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* ── Settings Modal ── */}
      {showSettings && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-lg rounded-[32px] bg-surface-solid border border-border/50 shadow-2xl overflow-hidden animate-slideIn">
            <div className="px-8 py-6 border-b border-border/50 bg-white/5">
               <h3 className="text-xl font-black text-heading tracking-tight uppercase">Neural Configuration</h3>
               <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">Adjust computer vision sensitivity</p>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Inference Confidence</label>
                    <span className="text-xs font-mono font-black text-accent">{Math.round(config.confidence * 100)}%</span>
                 </div>
                 <div className="relative h-2 w-full bg-black/40 rounded-full overflow-hidden group">
                    <input 
                      type="range" min="0" max="100" value={config.confidence * 100}
                      onChange={(e) => setConfig({ ...config, confidence: Number(e.target.value) / 100 })} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                    <div className="h-full bg-accent shadow-[0_0_15px_var(--accent-glow)] transition-all pointer-events-none" style={{ width: `${config.confidence * 100}%` }} />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Dark Thresh</label>
                    <input
                      type="number" step="0.1" value={config.darkThreshold}
                      onChange={(e) => setConfig({ ...config, darkThreshold: Number(e.target.value) })}
                      className="w-full px-5 py-3.5 rounded-2xl bg-black/40 border border-border/40 text-sm font-bold text-heading focus:outline-none focus:border-accent/50 transition-all font-mono"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Bright Thresh</label>
                    <input
                      type="number" step="0.1" value={config.brightThreshold}
                      onChange={(e) => setConfig({ ...config, brightThreshold: Number(e.target.value) })}
                      className="w-full px-5 py-3.5 rounded-2xl bg-black/40 border border-border/40 text-sm font-bold text-heading focus:outline-none focus:border-accent/50 transition-all font-mono"
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 {[
                   { key: "humanEnabled", label: "Human Detection", icon: "fa-person" },
                   { key: "lightEnabled", label: "Light Analysis", icon: "fa-bolt-lightning" },
                 ].map((item) => (
                   <button 
                     key={item.key} 
                     onClick={() => setConfig({ ...config, [item.key]: !(config as any)[item.key] })}
                     className={clsx(
                       "flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all duration-300",
                       (config as any)[item.key] 
                         ? "bg-accent/10 border-accent/40 text-accent shadow-[0_0_20px_rgba(0,242,255,0.1)]" 
                         : "bg-black/20 border-border/40 text-text-muted opacity-60"
                     )}
                   >
                     <i className={clsx("fas", item.icon, "text-xl")}></i>
                     <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase tracking-tight">{item.label}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Status: {(config as any)[item.key] ? "ENABLED" : "NULL"}</span>
                     </div>
                   </button>
                 ))}
              </div>
            </div>

            <div className="px-8 py-6 bg-white/5 border-t border-border/50 flex gap-4">
              <button 
                onClick={() => { setShowSettings(false); setConfig(settings); }} 
                className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-text-secondary font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Abort
              </button>
              <button 
                onClick={saveConfig} 
                className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-accent to-accent-light text-bg font-black text-[10px] uppercase tracking-widest shadow-[0_0_15px_var(--accent-glow)] hover:scale-[1.02] transition-all"
              >
                Sync Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
