import express from "express";
import dotenv from "dotenv";
import initBaileys from "./services/baileys.js";
import sendMessage from "./controllers/send-messages.js";
import getQR from "./controllers/get-qr.js";
import { setCurrentSocket } from "./state.js";

dotenv.config();

export const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

const PORT = process.env.PORT || 3000;

let httpServer; // ⬅️ fuera de cualquier función

async function start() {
  let socket = await initBaileys();
  setCurrentSocket(socket); // 1. guarda el socket en el estado
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
    sendMessage(req, res);
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
