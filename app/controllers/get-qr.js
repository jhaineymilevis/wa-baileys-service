import { latestQRImg } from "../state.js";

/**
 * Generates a QR code from the given text.
 * @param {string} text - The text to encode in the QR code.
 * @returns {Promise<string>} - A promise that resolves to the QR code as a data URL.
 */
const getQR = async (req, res) => {
  try {
    if (!latestQRImg) {
      return res
        .status(404)
        .send(
          "<h3>No QR code available – either already authenticated, or wait a few seconds for it to appear.</h3>"
        );
    }
    res.send(
      `<!DOCTYPE html><html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif"><div><h2>Scan this QR with WhatsApp</h2><img src="${latestQRImg}" /><p style="text-align:center;">Refresh if it expires.</p></div></body></html>`
    );
  } catch (error) {
    console.error("Error generating QR code:", error);
    res.status(503).json({ error: error });
  }
};

export default getQR;
