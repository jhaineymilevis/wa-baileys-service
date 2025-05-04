import { setCurrentSocket, setLatestQRImg } from "../state.js";

import fetch from "node-fetch";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import { N8N_WEBHOOK_URL } from "../server.js";

async function initBaileys() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
  });

  // Baileys connection lifecycle
  sock.ev.on(
    "connection.update",
    async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        let latestQRImg = await QRCode.toDataURL(qr);
        setLatestQRImg(latestQRImg);
        console.log("🔑 New QR code generated – browse /qr to scan");
      }

      if (connection === "close") {
        const boomErr = /** @type {Boom | undefined} */ (lastDisconnect?.error);
        const shouldReconnect =
          boomErr?.output?.statusCode !== DisconnectReason.loggedOut;
        const reason = lastDisconnect?.error?.output?.statusCode;
        console.log("connection closed. reasson =", reason);
        if (shouldReconnect) {
          console.log("🕐 Reconectando socket…");
          let sock = await initBaileys(); // NO vuelvas a llamar createServer
          setCurrentSocket(sock); // 1. guarda el socket en el estado
        } else {
          console.log("Sesión cerrada, hay que re‑escanear QR");
        }
      }
      if (connection === "open") {
        console.log("✅ WhatsApp connection ready");

        setLatestQRImg(null);
      }
    }
  );

  sock.ev.on("creds.update", saveCreds);

  // forward every incoming text to n8n
  sock.ev.on("messages.upsert", async ({ messages }) => {
    console.log("New message received:", messages);

    const msg = messages?.[0];

    if (
      !msg?.key?.fromMe &&
      (msg.message?.conversation || msg.message?.extendedTextMessage)
    ) {
      try {
        console.log(
          "text:",
          msg.message.conversation
            ? msg.message.conversation
            : msg.message?.extendedTextMessage?.text
        );

        await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            from: msg.key.remoteJid,
            text: msg.message.conversation
              ? msg.message.conversation
              : msg.message?.extendedTextMessage?.text,
          }),
        });
      } catch (err) {
        console.error("Error sending to n8n webhook:", err);
      }
    }
  });

  return sock;
}

export default initBaileys;
