import MESSAGE_TYPES from "../consts/message-types.js";

/**
 * Function to get the message type from a Baileys message object.
 * @param {Object} message - The Baileys message object.
 * @returns {string} - The type of the message (e.g., "text", "image", "video", etc.).
 */
export function getMessageType(message) {
  if (!message || typeof message !== "object") {
    throw new Error("Invalid message object");
  }

  const messageKeys = Object.keys(message.message || {});

  if (messageKeys.includes("conversation")) {
    return MESSAGE_TYPES.TEXT;
  } else if (messageKeys.includes("extendedTextMessage")) {
    return MESSAGE_TYPES.TEXT_EXTENDED;
  } else if (messageKeys.includes("audioMessage")) {
    return MESSAGE_TYPES.AUDIO;
  } else if (messageKeys.includes("imageMessage")) {
    return MESSAGE_TYPES.IMAGE;
  } else if (messageKeys.includes("videoMessage")) {
    return MESSAGE_TYPES.VIDEO;
  } else if (messageKeys.includes("documentMessage")) {
    return MESSAGE_TYPES.DOCUMENT;
  } else if (messageKeys.includes("stickerMessage")) {
    return MESSAGE_TYPES.STICKER;
  } else if (messageKeys.includes("contactMessage")) {
    return MESSAGE_TYPES.CONTACT;
  } else if (messageKeys.includes("locationMessage")) {
    return MESSAGE_TYPES.LOCATION;
  } else if (messageKeys.includes("liveLocationMessage")) {
    return MESSAGE_TYPES.LIVE_LOCATION;
  } else if (messageKeys.includes("reactionMessage")) {
    return MESSAGE_TYPES.REACTION;
  }
  return messageKeys.length > 0 ? messageKeys[0] : "unknown";
}

export function getQuotedMessageText(message) {
  let text = undefined;

  if (message?.conversation) {
    text = message.conversation;
  } else if (message?.extendedTextMessage?.text) {
    text = message.extendedTextMessage.text;
  } else if (message?.imageMessage?.caption) {
    text = message.imageMessage.caption;
  } else if (message?.videoMessage?.caption) {
    text = message.videoMessage.caption;
  } else if (message?.documentMessage?.fileName) {
    text = message.documentMessage.fileName;
  }

  return text;
}
