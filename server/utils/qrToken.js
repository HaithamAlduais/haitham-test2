/**
 * Rotating QR Token System
 *
 * Generates HMAC-based tokens that change every `intervalSeconds`.
 * Prevents screenshot-sharing: a photo of the QR code becomes invalid
 * after the rotation window passes.
 *
 * Token = HMAC-SHA256(secret, floor(timestamp / interval))
 * Validation accepts current window OR previous window (grace period).
 */

const crypto = require("crypto");

/**
 * Generate a token for the current time window.
 * @param {string} secret - Session-specific secret (random UUID)
 * @param {number} intervalSeconds - Rotation interval (default 120s = 2 min)
 * @returns {{ token: string, expiresAt: number }} Token + expiry timestamp (ms)
 */
function generateQrToken(secret, intervalSeconds = 120) {
  const now = Math.floor(Date.now() / 1000);
  const window = Math.floor(now / intervalSeconds);
  const token = crypto
    .createHmac("sha256", secret)
    .update(String(window))
    .digest("hex")
    .substring(0, 16); // short token for QR efficiency

  const windowEnd = (window + 1) * intervalSeconds;
  const expiresAt = windowEnd * 1000; // ms

  return { token, expiresAt, window };
}

/**
 * Validate a submitted token against the current and previous window.
 * @param {string} secret
 * @param {number} intervalSeconds
 * @param {string} submittedToken
 * @returns {boolean}
 */
function validateQrToken(secret, intervalSeconds = 120, submittedToken) {
  const now = Math.floor(Date.now() / 1000);
  const currentWindow = Math.floor(now / intervalSeconds);

  // Check current window and previous window (grace period)
  for (const w of [currentWindow, currentWindow - 1]) {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(String(w))
      .digest("hex")
      .substring(0, 16);
    if (expected === submittedToken) return true;
  }

  return false;
}

/**
 * Generate a random secret for a session.
 * @returns {string}
 */
function generateQrSecret() {
  return crypto.randomUUID();
}

module.exports = { generateQrToken, validateQrToken, generateQrSecret };
