import mqtt, { MqttClient } from "mqtt";
import { prisma } from "./db";

// Global cache for Next.js (survives HMR and route changes)
const globalForMqtt = globalThis as unknown as { 
  mqttClient: MqttClient | undefined;
  messageHandler: ((topic: string, message: Buffer) => void) | undefined;
};

export class MqttManager {
  static setMessageHandler(handler: (topic: string, message: Buffer) => void) {
    globalForMqtt.messageHandler = handler;
    if (globalForMqtt.mqttClient) {
      // Re-attach in case client exists
      globalForMqtt.mqttClient.removeAllListeners("message");
      globalForMqtt.mqttClient.on("message", handler);
    }
  }

  static async connect() {
    if (globalForMqtt.mqttClient && globalForMqtt.mqttClient.connected) {
      return globalForMqtt.mqttClient;
    }

    try {
      const settings = await prisma.userSettings.findFirst({
        where: { userId: 1 }, // Assuming Single Node / Admin
      });

      if (!settings) {
        console.warn("⚠️ [MQTT] Tidak ada UserSettings di Database untuk userId: 1");
        return null;
      }

      const broker = settings.mqttBroker || "broker.hivemq.com";
      const cleanBroker = broker.replace(/^mqtts?:\/\//, ""); // remove prefix if entered by mistake
      const port = settings.mqttPort || (settings.mqttUseSsl ? 8883 : 1883);
      const protocol = settings.mqttUseSsl ? "mqtts" : "mqtt";
      const uri = `${protocol}://${cleanBroker}:${port}${settings.mqttPath || ""}`;

      console.log(`🔌 [MQTT] Mencoba terhubung ke Broker Dinamis: ${uri}...`);

      const client = mqtt.connect(uri, {
        username: settings.mqttUsername || undefined,
        password: settings.mqttPasswordEnc || undefined,
        clientId: settings.mqttClientId || `iotzy-srvr-${Math.random().toString(16).slice(2, 8)}`,
        reconnectPeriod: 5000,
        keepalive: 60,
      });

      globalForMqtt.mqttClient = client;

      client.on("connect", () => {
        console.log(`✅ [MQTT] Berhasil Terhubung ke Database Broker (${uri})`);
        client.subscribe("iotzy/+/status");
      });

      client.on("error", (err) => {
        console.error(`❌ [MQTT] Error Koneksi (${uri}):`, err.message);
      });

      // Attach global handler if it was registered (by server.ts)
      if (globalForMqtt.messageHandler) {
        client.on("message", globalForMqtt.messageHandler);
      }

      return client;
    } catch (error: any) {
      console.error("❌ [MQTT] Fatal Error saat inisialisasi:", error.message);
      return null;
    }
  }

  static async disconnect() {
    if (globalForMqtt.mqttClient) {
      console.log("♻️ [MQTT] Menutup koneksi lama untuk Reload Setting...");
      globalForMqtt.mqttClient.end(true);
      globalForMqtt.mqttClient = undefined;
    }
  }

  static async publish(topic: string, payload: any) {
    let client = globalForMqtt.mqttClient;
    
    // Connect if totally dead
    if (!client || !client.connected) {
      client = await MqttManager.connect() || undefined;
    }

    if (client && client.connected) {
      const messageStr = typeof payload === "string" ? payload : JSON.stringify(payload);
      client.publish(topic, messageStr, { qos: 1 }, (err) => {
        if (err) console.error(`❌ [MQTT] Gagal menembak ke ${topic}:`, err);
        else console.log(`📤 [MQTT-OUTBOUND] Sinyal Terkirim ke [${topic}]: ${messageStr}`);
      });
      return true;
    } else {
      console.warn(`⚠️ [MQTT] Tidak bisa Publish ke ${topic}, koneksi ke Broker terputus.`);
      return false;
    }
  }
}
