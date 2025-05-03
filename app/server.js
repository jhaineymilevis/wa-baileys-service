import express from "express";
import dotenv from "dotenv";
import initBaileys from "./services/baileys.js";
import sendMessage from "./controllers/send-messages.js";
import getQR from "./controllers/get-qr.js";

dotenv.config();

export const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

const PORT = process.env.PORT || 3000;

let httpServer; // ⬅️ fuera de cualquier función
let currentSocket; // para ir reemplazando la conexión Baileys

async function start() {
  currentSocket = await initBaileys();
  if (!httpServer) {
    httpServer = await createServer(); // 👉 solo la primera vez
    console.log("📞 REST API ready on port", PORT);
  }
  console.log("✅ WhatsApp socket listo");
}

async function createServer() {
  // -- REST API
  const app = express();
  app.use(express.json());

  // send message endpoint
  app.post("/send-message", async (req, res) => {
    sendMessage(currentSocket, req, res);
  });

  // expose the QR so remote users can scan it in a browser
  app.get("/qr", (req, res) => {
    getQR(latestQRImg);
  });

  // simple health‑check
  app.get("/health", (req, res) => res.json({ status: "ok" }));

  return app.listen(PORT, () =>
    console.log(`📞 REST API listening on http://0.0.0.0:${PORT}`)
  );
}
start();
