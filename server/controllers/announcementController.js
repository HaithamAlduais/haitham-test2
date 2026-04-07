const admin = require("firebase-admin");

const db = () => admin.firestore();
const eventsCol = () => db().collection("events");
const hackathonsCol = () => db().collection("hackathons");

async function getEventDoc(id) {
  let snap = await eventsCol().doc(id).get();
  if (snap.exists) return snap;
  return hackathonsCol().doc(id).get();
}

function announcementsCol(eventId) {
  return eventsCol().doc(eventId).collection("announcements");
}

// ── POST /api/hackathons/:id/announcements ──────────────────────────────────

async function createAnnouncement(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const { title, content, channel, scheduledAt } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required." });
    }

    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });
    if (hSnap.data().organizerId !== req.uid) {
      return res.status(403).json({ error: "You do not own this hackathon." });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const data = {
      hackathonId: id,
      authorId: req.uid,
      title: title.trim(),
      content: content.trim(),
      channel: channel || "platform",
      scheduledAt: scheduledAt || null,
      sentAt: scheduledAt ? null : now,
      createdAt: now,
    };

    const docRef = await announcementsCol(id).add(data);
    return res.status(201).json({ id: docRef.id, ...data, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error("createAnnouncement error:", err);
    return res.status(500).json({ error: "Failed to create announcement." });
  }
}

// ── GET /api/hackathons/:id/announcements ───────────────────────────────────

async function listAnnouncements(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const snap = await announcementsCol(id)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const announcements = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json({ data: announcements });
  } catch (err) {
    console.error("listAnnouncements error:", err);
    return res.status(500).json({ error: "Failed to list announcements." });
  }
}

// ── DELETE /api/hackathons/:id/announcements/:annId ─────────────────────────

async function deleteAnnouncement(req, res) {
  try {
    const { id, annId } = req.params;

    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });
    if (hSnap.data().organizerId !== req.uid) {
      return res.status(403).json({ error: "You do not own this hackathon." });
    }

    await announcementsCol(id).doc(annId).delete();
    return res.json({ message: "Announcement deleted." });
  } catch (err) {
    console.error("deleteAnnouncement error:", err);
    return res.status(500).json({ error: "Failed to delete announcement." });
  }
}

module.exports = { createAnnouncement, listAnnouncements, deleteAnnouncement };
