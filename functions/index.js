const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const app = require("./server/index");
const { autoCloseSessions } = require("./server/jobs/autoClose");

// Declare secrets so they're available as env vars at runtime
const geminiKey = defineSecret("GEMINI_API_KEY");
const resendKey = defineSecret("RESEND_API_KEY");
const discordToken = defineSecret("DISCORD_BOT_TOKEN");

// Export the Express app as a Firebase Cloud Function named "api"
exports.api = onRequest({ secrets: [geminiKey, resendKey, discordToken], memory: "512MiB", timeoutSeconds: 120 }, app);

// ── Scheduled: auto-close expired sessions (every minute) ───────────────────
exports.autoCloseExpiredSessions = onSchedule("* * * * *", autoCloseSessions);
