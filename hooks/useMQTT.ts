"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useAppStore } from "@/lib/store";

interface MqttConfig {
  broker: string;
  port: number;
  path?: string;
  ssl?: boolean;
  username?: string;
}

export function useMQTT(config: MqttConfig | null) {
  const clientRef = useRef<any>(null);
  const [connected, setConnected] = useState(false);
  const { devices, sensors, setDeviceState, setSensorData, addSensorHistory } =
    useAppStore();

  const handleMessage = useCallback(
    (topic: string, message: string) => {
      // Check if topic matches a device
      for (const [id, dev] of Object.entries(devices)) {
        const t = useAppStore.getState().devices[id];
        if (t?.topicSub === topic) {
          const val = message.trim().toLowerCase();
          if (val === "on" || val === "1" || val === "true") {
            setDeviceState(id, true);
          } else if (val === "off" || val === "0" || val === "false") {
            setDeviceState(id, false);
          }
          return;
        }
      }

      // Check if topic matches a sensor
      for (const [id, sensor] of Object.entries(sensors)) {
        const s = useAppStore.getState().sensors[id];
        if (s?.topic === topic) {
          const numVal = parseFloat(message);
          if (!isNaN(numVal)) {
            setSensorData(id, numVal);
            addSensorHistory(id, numVal);
          }
          return;
        }
      }
    },
    [devices, sensors, setDeviceState, setSensorData, addSensorHistory]
  );

  useEffect(() => {
    if (!config?.broker) return;

    let mqttClient: any = null;

    async function connect() {
      try {
        // Dynamic import mqtt.js
        const mqtt = await import("mqtt");

        const protocol = config!.ssl ? "wss" : "ws";
        const url = `${protocol}://${config!.broker}:${config!.port}${config!.path || "/mqtt"}`;

        mqttClient = mqtt.default.connect(url, {
          username: config!.username || undefined,
          reconnectPeriod: 3000,
          connectTimeout: 10000,
        });

        mqttClient.on("connect", () => {
          setConnected(true);
          clientRef.current = mqttClient;

          // Subscribe all device topics
          const state = useAppStore.getState();
          for (const dev of Object.values(state.devices)) {
            if (dev.topicSub) mqttClient.subscribe(dev.topicSub);
          }
          // Subscribe all sensor topics
          for (const sensor of Object.values(state.sensors)) {
            if (sensor.topic) mqttClient.subscribe(sensor.topic);
          }
        });

        mqttClient.on("message", (topic: string, payload: Buffer) => {
          handleMessage(topic, payload.toString());
        });

        mqttClient.on("error", (err: Error) => {
          console.error("MQTT Error:", err.message);
          setConnected(false);
        });

        mqttClient.on("close", () => {
          setConnected(false);
        });
      } catch (e) {
        console.warn("MQTT not available:", e);
      }
    }

    connect();

    return () => {
      if (mqttClient) {
        mqttClient.end(true);
        setConnected(false);
      }
    };
  }, [config?.broker, config?.port, config?.path, config?.ssl, config?.username, handleMessage]);

  // Subscribe to new topics when devices/sensors change
  useEffect(() => {
    const client = clientRef.current;
    if (!client || !connected) return;

    for (const dev of Object.values(devices)) {
      if (dev.topicSub) client.subscribe(dev.topicSub);
    }
    for (const sensor of Object.values(sensors)) {
      if (sensor.topic) client.subscribe(sensor.topic);
    }
  }, [devices, sensors, connected]);

  const publish = useCallback(
    (topic: string, message: string) => {
      if (clientRef.current && connected) {
        clientRef.current.publish(topic, message);
      }
    },
    [connected]
  );

  return { connected, publish };
}
