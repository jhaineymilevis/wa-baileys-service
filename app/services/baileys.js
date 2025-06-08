// initBaileys.js
import fetch from "node-fetch";
import QRCode from "qrcode";
import { Boom } from "@hapi/boom";
import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { setCurrentSocket, setLatestQRImg } from "../state.js";
import { N8N_WEBHOOK_URL } from "../server.js";
import waitForNetwork from "../utils/network.js";
import getMessageType from "./messages.js";
import MESSAGE_TYPES from "../consts/message-types.js";
import FormData from "form-data";
import fs from "fs";
/* ————————————————————————————————
   AJUSTES RE‑INTENTOS
——————————————————————————————— */
const MAX_BACKOFF = 60_000; // tope 1 min
let backoff = 1_000; // arranca en 1 s

/* ————————————————————————————————
   FUNCIÓN PRINCIPAL
——————————————————————————————— */
export default async function initBaileys() {
  const AUTH_PATH = process.env.AUTH_PATH || "/data/auth"; // default local ./auth
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    connectTimeoutMs: 40_000,
    keepAliveIntervalMs: 10_000,
  });

  /* -------- QR GENERADO -------- */
  sock.ev.on(
    "connection.update",
    async ({ connection, lastDisconnect, qr }) => {
      console.log("connection status", connection);

      if (qr) {
        const latestQRImg = await QRCode.toDataURL(qr);
        setLatestQRImg(latestQRImg);
        console.log("🔑 QR nuevo – abre /qr para escanear");
      }

      /* -------- CONEXIÓN ABIERTA -------- */
      if (connection === "open") {
        console.log("✅ WhatsApp conectado");
        backoff = 1_000; // reset back‑off
        setLatestQRImg(null);
      }

      /* -------- CONEXIÓN CERRADA -------- */
      if (connection === "close") {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        const isLoggedOut = reason === DisconnectReason.loggedOut;
        const timedOut =
          reason === DisconnectReason.timedOut ||
          reason === DisconnectReason.unavailableService ||
          reason === DisconnectReason.connectionClosed ||
          reason === DisconnectReason.restartRequired ||
          reason === DisconnectReason.connectionLost;

        console.log(
          "🔌 Conexión cerrada. Razón =",
          DisconnectReason[reason] || reason
        );

        if (isLoggedOut) {
          console.log("Sesión cerrada → re‑escanea QR");
          return;
        }

        if (timedOut) {
          console.log("🕐 Esperando red y reintentando…");
          await waitForNetwork();
          await new Promise((r) => setTimeout(r, backoff));
          backoff = Math.min(backoff * 2, MAX_BACKOFF);

          try {
            sock.ws.close();
          } catch {}
          const newSock = await initBaileys();
          setCurrentSocket(newSock);
        }
      }
    }
  );

  /* -------- GUARDA CREDENCIALES -------- */
  sock.ev.on("creds.update", saveCreds);

  /* -------- MENSAJES ENTRANTES -------- */
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages?.[0];

    let quotedMessage =
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
        ?.conversation;

    let messageType = getMessageType(msg);

    let audioStream = null;
    if (!msg?.key?.fromMe) {
      const text =
        msg.message.conversation && msg.message.conversation != ""
          ? msg.message.conversation
          : msg.message.extendedTextMessage?.text;

      if (messageType == MESSAGE_TYPES.AUDIO) {
        // Step 1: Download and decrypt audio
        const buffer = await downloadMediaMessage(
          msg,
          "buffer",
          {},
          { logger: console, reuploadRequest: sock.updateMediaMessage }
        );
        const filePath = `./voice_note_${msg.messageTimestamp}.ogg`;
        fs.writeFileSync(filePath, buffer);

        const bufferred = fs.readFileSync(filePath); // Ya desencriptado
        const base64 = bufferred.toString("base64");
        audioStream = base64;
      }

      console.log("📥 Tipo de mensaje:", messageType);
      try {
        await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            from: msg.key.remoteJid,
            messageType,
            text,
            audioStream,
            quotedMessage,
          }),
        });
      } catch (err) {
        console.error("Error enviando al webhook n8n:", err);
      }
    }
  });

  /* -------- LIMPIEZA AL CERRAR PROCESO -------- */
  const closeSocket = () => sock?.ws?.close();
  process.once("SIGINT", closeSocket);
  process.once("SIGTERM", closeSocket);

  return sock;
}
