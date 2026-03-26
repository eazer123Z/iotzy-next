"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface CVCallbacks {
  onPersonCount?: (count: number) => void;
  onLightChange?: (condition: string, brightness: number) => void;
}

interface DetectionResult {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

export function useCV() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const callbacksRef = useRef<CVCallbacks>({});

  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [personCount, setPersonCount] = useState(0);
  const [brightness, setBrightness] = useState(0);
  const [lightCondition, setLightCondition] = useState("unknown");
  const [fps, setFps] = useState(0);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showDebug, setShowDebug] = useState(true);
  const [confidence, setConfidence] = useState(0.6);

  const frameCountRef = useRef(0);
  const fpsTimerRef = useRef<NodeJS.Timeout>();

  // Load TF.js + COCO-SSD model
  const loadModel = useCallback(async () => {
    if (modelRef.current || modelLoading) return;
    setModelLoading(true);

    try {
      // Dynamic load TF.js
      const tf = await import("@tensorflow/tfjs");
      await import("@tensorflow/tfjs-backend-webgl");

      // Dynamic load COCO-SSD
      const cocoSsd = await import("@tensorflow-models/coco-ssd");

      await tf.ready();
      const model = await cocoSsd.load({
        base: "lite_mobilenet_v2",
      });

      modelRef.current = model;
      setModelLoaded(true);

      // Update server
      await fetch("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_state",
          model_loaded: true,
        }),
      });
    } catch (e) {
      console.error("Failed to load CV model:", e);
    } finally {
      setModelLoading(false);
    }
  }, [modelLoading]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 640, height: 480 },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Update server
      await fetch("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_state",
          is_active: true,
        }),
      });

      return true;
    } catch (e) {
      console.error("Camera access failed:", e);
      return false;
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Update server
    await fetch("/api/cv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_state",
        is_active: false,
        person_count: 0,
      }),
    });
  }, []);

  // Analyze brightness from video frame
  const analyzeLight = useCallback((video: HTMLVideoElement) => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, 64, 48);
    const imageData = ctx.getImageData(0, 0, 64, 48);
    const data = imageData.data;

    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      // Luminance formula
      totalBrightness += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    }

    const avg = totalBrightness / (data.length / 4) / 255;
    const pct = Math.round(avg * 100);

    setBrightness(pct);

    let condition = "normal";
    if (avg < 0.3) condition = "dark";
    else if (avg > 0.7) condition = "bright";

    setLightCondition(condition);
    callbacksRef.current.onLightChange?.(condition, pct);

    return condition;
  }, []);

  // Detection loop
  const startDetection = useCallback(async () => {
    if (!modelRef.current || !videoRef.current) return;

    setDetecting(true);

    // FPS counter
    frameCountRef.current = 0;
    fpsTimerRef.current = setInterval(() => {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000);

    const detect = async () => {
      if (!modelRef.current || !videoRef.current || !detecting) return;

      const video = videoRef.current;
      if (video.readyState !== 4) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        const predictions: DetectionResult[] = await modelRef.current.detect(video);
        frameCountRef.current++;

        // Count persons
        const persons = predictions.filter(
          (p) => p.class === "person" && p.score >= confidence
        );
        const count = persons.length;
        setPersonCount(count);
        callbacksRef.current.onPersonCount?.(count);

        // Analyze light every 10 frames
        if (frameCountRef.current % 10 === 0) {
          analyzeLight(video);
        }

        // Draw bounding boxes
        if (canvasRef.current && showBoxes) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const pred of predictions) {
              if (pred.score < confidence) continue;
              const [x, y, w, h] = pred.bbox;

              ctx.strokeStyle = pred.class === "person" ? "#3b82f6" : "#10b981";
              ctx.lineWidth = 2;
              ctx.strokeRect(x, y, w, h);

              ctx.fillStyle = pred.class === "person" ? "#3b82f6" : "#10b981";
              ctx.font = "12px sans-serif";
              ctx.fillText(
                `${pred.class} ${Math.round(pred.score * 100)}%`,
                x,
                y > 20 ? y - 5 : y + 15
              );
            }
          }
        }
      } catch (e) {
        // detection error, skip frame
      }

      rafRef.current = requestAnimationFrame(detect);
    };

    rafRef.current = requestAnimationFrame(detect);
  }, [confidence, showBoxes, analyzeLight]);

  // Stop detection
  const stopDetection = useCallback(async () => {
    setDetecting(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (fpsTimerRef.current) clearInterval(fpsTimerRef.current);

    // Update server
    await fetch("/api/cv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_state",
        is_active: false,
        person_count: 0,
      }),
    });
  }, []);

  // Set callbacks
  const setCallbacks = useCallback((callbacks: CVCallbacks) => {
    callbacksRef.current = callbacks;
  }, []);

  // Sync state to server periodically
  useEffect(() => {
    if (!detecting) return;

    const interval = setInterval(async () => {
      await fetch("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_state",
          is_active: true,
          model_loaded: modelLoaded,
          person_count: personCount,
          brightness,
          light_condition: lightCondition,
        }),
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [detecting, modelLoaded, personCount, brightness, lightCondition]);

  return {
    videoRef,
    canvasRef,
    modelLoaded,
    modelLoading,
    detecting,
    personCount,
    brightness,
    lightCondition,
    fps,
    showBoxes,
    showDebug,
    confidence,
    loadModel,
    startCamera,
    stopCamera,
    startDetection,
    stopDetection,
    setShowBoxes,
    setShowDebug,
    setConfidence,
    setCallbacks,
  };
}
