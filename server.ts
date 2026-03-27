import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import { MqttManager } from "./lib/mqtt";

dotenv.config();

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

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

  // Inisialisasi MqttManager — Hanya bertugas menyambungkan & mendengarkan
  MqttManager.setMessageHandler((topic, message) => {
    const payloadStr = message.toString();
    console.log(`📨 [MQTT-INBOUND] Received [${topic}]: ${payloadStr}`);

    try {
      const data = JSON.parse(payloadStr);
      // Broadcast langsung ke semua klien Web UI (WebSocket)
      io.emit("device_update", { topic, data });
    } catch (e) {
      console.error("❌ [MQTT] Invalid JSON Payload from NodeMCU", e);
    }
  });

  // Sambungkan ke Broker menggunakan konfigurasi dari Database
  MqttManager.connect();

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
