"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import type { AutomationRule } from "@/types";

interface AutomationState {
  rules: AutomationRule[];
  settings: {
    automationLamp: boolean;
    automationFan: boolean;
    automationLock: boolean;
    lampOnThreshold: number;
    lampOffThreshold: number;
    fanTempHigh: number;
    fanTempNormal: number;
    lockDelay: number;
  } | null;
}

export function useAutomation(publish?: (topic: string, msg: string) => void) {
  const rulesRef = useRef<AutomationRule[]>([]);
  const triggeredRef = useRef<Record<string, boolean>>({});
  const { sensorData, deviceStates, setDeviceState, devices } = useAppStore();

  // Load rules
  const loadRules = useCallback(async () => {
    try {
      const res = await fetch("/api/automation");
      const data = await res.json();
      if (data.rules) {
        rulesRef.current = data.rules;
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    loadRules();
    const interval = setInterval(loadRules, 30000); // refresh rules every 30s
    return () => clearInterval(interval);
  }, [loadRules]);

  // Evaluate rules when sensor data changes
  useEffect(() => {
    const rules = rulesRef.current;
    if (!rules.length) return;

    for (const rule of rules) {
      if (!rule.isEnabled) continue;
      if (!rule.sensorId || !rule.deviceId) continue;

      const sensorValue = sensorData[String(rule.sensorId)];
      if (sensorValue === null || sensorValue === undefined) continue;

      const devId = String(rule.deviceId);
      const ruleKey = `${rule.id}-${devId}`;

      let shouldTrigger = false;
      const val = Number(sensorValue);

      switch (rule.conditionType) {
        case "gt":
          shouldTrigger = val > Number(rule.threshold);
          break;
        case "lt":
          shouldTrigger = val < Number(rule.threshold);
          break;
        case "between":
          shouldTrigger =
            val >= Number(rule.thresholdMin) &&
            val <= Number(rule.thresholdMax);
          break;
      }

      if (shouldTrigger && !triggeredRef.current[ruleKey]) {
        // Trigger action
        const newState = rule.action === "on";
        triggeredRef.current[ruleKey] = true;

        if (rule.delayMs > 0) {
          setTimeout(() => {
            executeAction(devId, newState, rule);
          }, rule.delayMs);
        } else {
          executeAction(devId, newState, rule);
        }
      } else if (!shouldTrigger) {
        // Reset trigger
        delete triggeredRef.current[ruleKey];
      }
    }
  }, [sensorData, setDeviceState]);

  const executeAction = useCallback(
    async (deviceId: string, state: boolean, rule: AutomationRule) => {
      // Update state locally
      setDeviceState(deviceId, state);

      // Publish to MQTT if available
      const dev = useAppStore.getState().devices[deviceId];
      if (publish && dev?.topicPub) {
        publish(dev.topicPub, state ? "on" : "off");
      }

      // Sync to server
      await fetch("/api/devices/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Number(deviceId),
          state,
          trigger: "Automation",
        }),
      });
    },
    [setDeviceState, publish]
  );

  // Built-in automation (lamp, fan, lock)
  const evaluateBuiltIn = useCallback(
    async (
      settings: AutomationState["settings"],
      cvState?: { personCount: number; lightCondition: string }
    ) => {
      if (!settings) return;

      // Lamp automation based on light condition
      if (settings.automationLamp && cvState) {
        const isDark = cvState.lightCondition === "dark";
        // Find lamp devices
        for (const [id, dev] of Object.entries(useAppStore.getState().devices)) {
          if (dev.name.toLowerCase().includes("lampu") || dev.type === "light") {
            const current = useAppStore.getState().deviceStates[id];
            if (isDark && !current) {
              setDeviceState(id, true);
              if (publish && dev.topicPub) publish(dev.topicPub, "on");
            } else if (!isDark && current) {
              setDeviceState(id, false);
              if (publish && dev.topicPub) publish(dev.topicPub, "off");
            }
          }
        }
      }
    },
    [setDeviceState, publish]
  );

  return { loadRules, evaluateBuiltIn };
}
