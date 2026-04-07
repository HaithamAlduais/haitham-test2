const admin = require("firebase-admin");

const db = () => admin.firestore();
const hackathonsCol = () => db().collection("hackathons");

function workshopsCol(hackathonId) {
  return hackathonsCol().doc(hackathonId).collection("workshops");
}

// ── POST /api/hackathons/:id/workshops ──────────────────────────────────────

async function createWorkshop(req, res) {
  try {
    const { id } = req.params;
    const { title, description, dateTime, durationMinutes, platform, meetingLink, resources } = req.body;

    if (!title) return res.status(400).json({ error: "Title is required." });

    const hSnap = await hackathonsCol().doc(id).get();
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });
    if (hSnap.data().organizerId !== req.uid) {
      return res.status(403).json({ error: "You do not own this hackathon." });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const data = {
      hackathonId: id,
      title: title.trim(),
      description: description || "",
      dateTime: dateTime || null,
      durationMinutes: durationMinutes || 60,
      platform: platform || "zoom",
      meetingLink: meetingLink || "",
      resources: Array.isArray(resources) ? resources : [],
      attendees: [],
      createdAt: now,
    };

    const docRef = await workshopsCol(id).add(data);
    return res.status(201).json({ id: docRef.id, ...data, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error("createWorkshop error:", err);
    return res.status(500).json({ error: "Failed to create workshop." });
  }
}

// ── GET /api/hackathons/:id/workshops ───────────────────────────────────────

async function listWorkshops(req, res) {
  try {
    const { id } = req.params;
    const snap = await workshopsCol(id).orderBy("dateTime", "asc").get();
    const workshops = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json({ data: workshops });
  } catch (err) {
    console.error("listWorkshops error:", err);
    return res.status(500).json({ error: "Failed to list workshops." });
  }
}

// ── PATCH /api/hackathons/:id/workshops/:wId ────────────────────────────────

async function updateWorkshop(req, res) {
  try {
    const { id, wId } = req.params;
    const updates = { ...req.body };

    const hSnap = await hackathonsCol().doc(id).get();
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });
    if (hSnap.data().organizerId !== req.uid) {
      return res.status(403).json({ error: "You do not own this hackathon." });
    }

    delete updates.hackathonId;
    await workshopsCol(id).doc(wId).update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ message: "Workshop updated." });
  } catch (err) {
    console.error("updateWorkshop error:", err);
    return res.status(500).json({ error: "Failed to update workshop." });
  }
}

// ── POST /api/hackathons/:id/workshops/:wId/rsvp ────────────────────────────

async function rsvpWorkshop(req, res) {
  try {
    const { id, wId } = req.params;

    const ref = workshopsCol(id).doc(wId);
    await ref.update({
      attendees: admin.firestore.FieldValue.arrayUnion(req.uid),
    });

    return res.json({ message: "RSVP confirmed." });
  } catch (err) {
    console.error("rsvpWorkshop error:", err);
    return res.status(500).json({ error: "Failed to RSVP." });
  }
}

module.exports = { createWorkshop, listWorkshops, updateWorkshop, rsvpWorkshop };
