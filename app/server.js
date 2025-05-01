// ---- server.js ----
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { Boom } from "@hapi/boom";

dotenv.config();

const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

async function start() {
  // persist auth files in ./auth
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    printQRInTerminal: true, // scan once, files are cached afterwards
    auth: state,
  });

  // handle connection lifecycle
  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error /** @type {Boom} */?.output?.statusCode !==
        DisconnectReason.loggedOut;
      console.log("connection closed. reconnect =", shouldReconnect);
      if (shouldReconnect) start();
    }
    if (connection === "open") console.log("✅ WhatsApp connection ready");
  });

  sock.ev.on("creds.update", saveCreds);

  // forward every new incoming text to n8n
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages?.[0];
    if (!msg?.key?.fromMe && msg.message?.conversation) {
      try {
        await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            from: msg.key.remoteJid,
            text: msg.message.conversation,
          }),
        });
      } catch (err) {
        console.error("Error sending to n8n webhook:", err);
      }
    }
  });

  // minimal REST API
  const app = express();
  app.use(express.json());

  app.post("/send-message", async (req, res) => {
    const { to, text } = req.body || {};
    if (!to || !text)
      return res.status(400).json({ error: "`to` and `text` are required" });
    try {
      const jid = to.includes("@s.whatsapp.net") ? to : `${to}@s.whatsapp.net`;
      await sock.sendMessage(jid, { text });
      res.json({ status: "sent" });
    } catch (e) {
      console.error("sendMessage error:", e);
      res.status(500).json({ error: "failed to send" });
    }
  });

  app.listen(PORT, () =>
    console.log(`📞 REST API listening on http://0.0.0.0:${PORT}`)
  );
}

start();
