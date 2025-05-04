import { currentSocket } from "../state.js";

/**
 * Sends a WhatsApp message to a specific number.
 * @param {string} phoneNumber - The recipient's phone number in international format (e.g., '1234567890@s.whatsapp.net').
 * @param {string} message - The message to send.
 */
async function sendMessage(req, res) {
  let sock = currentSocket;
  const { to, text, image } = req.body || {};

  if (!to || !text)
    return res.status(400).json({ error: "`to` and `text` are required" });
  try {
    const jid = to.includes("@s.whatsapp.net") ? to : `${to}@s.whatsapp.net`;

    let message = { text };

    if (image && image != null) {
      message = { image: { url: image }, caption: text };
    }

    await sock.presenceSubscribe(jid); // ① avisa que te interesan sus presencias
    await sock.sendPresenceUpdate("composing", jid); // ② empieza la animación “escribiendo”

    setTimeout(() => {
      sock.sendPresenceUpdate("paused", jid); // ③ detiene la animación
    }, 2000);

    await sock.sendMessage(jid, message);
    res.json({ status: "sent" });
  } catch (e) {
    console.error("sendMessage error:", e);
    res.status(500).json({ error: "failed to send" });
  }
}

export default sendMessage;
