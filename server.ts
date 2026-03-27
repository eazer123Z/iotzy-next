import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import mqtt from "mqtt";
import dotenv from "dotenv";

dotenv.config();

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// MQTT Setup
const MQTT_BROKER = process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com:1883";
const MQTT_USERNAME = process.env.MQTT_USERNAME || "";
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || "";

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Attach Socket.IO to native HTTP server
  const io = new SocketIOServer(server, {
    cors: { origin: "*" },
    path: "/api/socketio",
  });

  console.log(`🔌 [MQTT] Connecting to Broker: ${MQTT_BROKER}...`);
  const mqttClient = mqtt.connect(MQTT_BROKER, {
    username: MQTT_USERNAME || undefined,
    password: MQTT_PASSWORD || undefined,
    reconnectPeriod: 5000,
  });

  mqttClient.on("connect", () => {
    console.log("✅ [MQTT] Terhubung ke Broker!");
    // Subscribing to wildcard topic for all device statuses
    mqttClient.subscribe("iotzy/+/status", (err) => {
      if (err) console.error("❌ [MQTT] Gagal Subscribe:", err);
      else console.log("📡 [MQTT] Subscribed to iotzy/+/status");
    });
  });

  mqttClient.on("error", (err) => {
    console.error("❌ [MQTT] Error:", err.message);
  });

  // When MQTT message arrives, directly broadcast to WebSocket clients!
  // NO DB FETCHING, NO POLLING (Instant Sub-50ms Latency)
  mqttClient.on("message", (topic, message) => {
    const payloadStr = message.toString();
    console.log(`📨 [MQTT] Received [${topic}]: ${payloadStr}`);
    
    try {
      const data = JSON.parse(payloadStr);
      // Data expected format: { deviceKey: "Lampu1", state: 1, extras: {...} }
      
      // Emit to all connected Web UI clients immediately
      io.emit("device_update", {
        topic,
        data
      });
      
    } catch (e) {
      console.error("❌ [MQTT] Invalid JSON Payload from NodeMCU", e);
    }
  });

  // Socket.IO Client Handling
  io.on("connection", (socket) => {
    console.log(`⚡ [Socket.IO] Klien Terhubung: ${socket.id}`);
    
    socket.on("disconnect", () => {
      console.log(`🔌 [Socket.IO] Klien Terputus: ${socket.id}`);
    });
  });

  server
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`🚀 [Next.js] Ready on http://${hostname}:${port}`);
    });
});
