/**
 * Ramsha — Auto-close expired sessions (cron job).
 *
 * Runs every minute via node-cron. Queries Firestore for active sessions
 * whose autoCloseTime has passed and batch-updates them to "closed".
 */

const cron = require("node-cron");
const { admin, db } = require("../lib/firebase");

/**
 * Query for expired active sessions and batch-close them.
 */
async function autoCloseSessions() {
  const now = admin.firestore.Timestamp.now();

  const snapshot = await db()
    .collection("sessions")
    .where("status", "==", "active")
    .where("autoCloseTime", "<=", now)
    .get();

  if (snapshot.empty) return;

  const batch = db().batch();
  const closedIds = [];

  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { status: "closed" });
    closedIds.push(doc.id);
  });

  await batch.commit();
  console.log(`autoClose: Closed ${closedIds.length} session(s):`, closedIds);
}

/**
 * Start the auto-close cron job (every minute).
 */
function startAutoCloseJob() {
  cron.schedule("* * * * *", async () => {
    try {
      await autoCloseSessions();
    } catch (err) {
      console.error("autoClose job error:", err);
    }
  });
  console.log("autoClose: Cron job registered (every 1 minute).");
}

module.exports = { startAutoCloseJob, autoCloseSessions };
