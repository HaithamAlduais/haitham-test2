const admin = require("firebase-admin");
const db = () => admin.firestore();

function notificationsCol(userId) {
  return db().collection("users").doc(userId).collection("notifications");
}

// GET /api/notifications — list user's notifications
async function listNotifications(req, res) {
  try {
    const snap = await notificationsCol(req.uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    const notifications = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const unreadCount = notifications.filter(n => !n.read).length;
    return res.json({ data: notifications, unreadCount });
  } catch (err) {
    console.error("listNotifications error:", err);
    return res.status(500).json({ error: "Failed to list notifications." });
  }
}

// PATCH /api/notifications/:notifId/read — mark as read
async function markAsRead(req, res) {
  try {
    await notificationsCol(req.uid).doc(req.params.notifId).update({ read: true });
    return res.json({ message: "Marked as read." });
  } catch (err) {
    console.error("markAsRead error:", err);
    return res.status(500).json({ error: "Failed to mark as read." });
  }
}

// POST /api/notifications/mark-all-read
async function markAllRead(req, res) {
  try {
    const snap = await notificationsCol(req.uid).where("read", "==", false).get();
    const batch = db().batch();
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
    return res.json({ message: `Marked ${snap.size} as read.` });
  } catch (err) {
    console.error("markAllRead error:", err);
    return res.status(500).json({ error: "Failed." });
  }
}

// Helper: create notification for a user (called from other controllers)
async function createNotification(userId, { type, title, body, hackathonId, link }) {
  try {
    await notificationsCol(userId).add({
      type: type || "info",
      title,
      body: body || "",
      hackathonId: hackathonId || null,
      link: link || null,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.warn("Failed to create notification:", err.message);
  }
}

module.exports = { listNotifications, markAsRead, markAllRead, createNotification };
