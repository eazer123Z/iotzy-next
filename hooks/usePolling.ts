"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/lib/store";

const POLL_ACTIVE = 5000; // 5s when tab active
const POLL_INACTIVE = 30000; // 30s when tab hidden

export function usePolling() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { setDevices, setSensors, setCv, setLogs } = useAppStore();

  const sync = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success) return;

      if (data.devices) setDevices(data.devices);
      if (data.sensors) setSensors(data.sensors);
      if (data.cvState) setCv(data.cvState);
    } catch (e) {
      // silent fail
    }
  }, [setDevices, setSensors, setCv]);

  const syncLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/logs");
      if (!res.ok) return;
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (e) {}
  }, [setLogs]);

  useEffect(() => {
    // Initial sync
    sync();
    syncLogs();

    // Start polling
    timerRef.current = setInterval(sync, POLL_ACTIVE);

    // Visibility-aware polling
    const handleVisibility = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (document.hidden) {
        timerRef.current = setInterval(sync, POLL_INACTIVE);
      } else {
        sync(); // immediate sync on focus
        timerRef.current = setInterval(sync, POLL_ACTIVE);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [sync, syncLogs]);
}
