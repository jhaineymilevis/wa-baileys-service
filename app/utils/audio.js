import { downloadMediaMessage } from "@whiskeysockets/baileys";

export async function getAudioStream(msg, sock) {
  // Step 1: Download and decrypt audio
  const buffer = await downloadMediaMessage(
    msg,
    "buffer",
    {},
    { logger: console, reuploadRequest: sock.updateMediaMessage }
  );
  const filePath = `./voice_note_${msg.messageTimestamp}.ogg`;

  let audioStream = await convertFileToBase64(filePath, buffer);

  return audioStream;
}
