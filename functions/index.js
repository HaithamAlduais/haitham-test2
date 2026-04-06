const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const app = require("./server/index");
const { autoCloseSessions } = require("./server/jobs/autoClose");

// Export the Express app as a Firebase Cloud Function named "api"
exports.api = onRequest(app);

// ── Scheduled: auto-close expired sessions (every minute) ───────────────────
exports.autoCloseExpiredSessions = onSchedule("* * * * *", autoCloseSessions);
