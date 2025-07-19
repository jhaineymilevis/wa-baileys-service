import { downloadMediaMessage } from "@whiskeysockets/baileys";

export async function getImageStream(msg, sock) {
  const buffer = await downloadMediaMessage(
    msg,
    "buffer",
    {},
    { logger: console, reuploadRequest: sock.updateMediaMessage }
  );

  const filePath = `./image_${msg.messageTimestamp}.jpg`;

  const base64Image = await convertFileToBase64(filePath, buffer);

  const mimeType = "image/jpeg"; // o detectarlo con alguna librería si varía

  let base64DataUri = `data:${mimeType};base64,${base64Image}`;

  return base64DataUri;
}
