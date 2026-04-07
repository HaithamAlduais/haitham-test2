const admin = require("firebase-admin");
const db = () => admin.firestore();
const eventsCol = () => db().collection("events");

async function getEventDoc(id) {
  let snap = await eventsCol().doc(id).get();
  if (snap.exists) return snap;
  return db().collection("hackathons").doc(id).get();
}

function officeHoursCol(eventId) {
  return eventsCol().doc(eventId).collection("officeHours");
}

// POST /:id/office-hours — create office hours session
async function createOfficeHours(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const { title, description, dateTime, durationMinutes, platform, meetingLink } = req.body;

    if (!title) return res.status(400).json({ error: "title required." });

    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Event not found." });
    if (hSnap.data().organizerId !== req.uid) return res.status(403).json({ error: "Not authorized." });

    const now = admin.firestore.FieldValue.serverTimestamp();
    const data = {
      hackathonId: id,
      title,
      description: description || "",
      dateTime: dateTime || null,
      durationMinutes: durationMinutes || 60,
      platform: platform || "zoom",
      meetingLink: meetingLink || "",
      rsvps: [],
      createdAt: now,
    };

    const ref = await officeHoursCol(id).add(data);
    return res.status(201).json({ id: ref.id, ...data });
  } catch (err) {
    console.error("createOfficeHours error:", err);
    return res.status(500).json({ error: "Failed to create office hours." });
  }
}

// GET /:id/office-hours
async function listOfficeHours(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const snap = await officeHoursCol(id).orderBy("createdAt", "desc").get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ data: items });
  } catch (err) {
    console.error("listOfficeHours error:", err);
    return res.status(500).json({ error: "Failed to list office hours." });
  }
}

// POST /:id/office-hours/:ohId/rsvp
async function rsvpOfficeHours(req, res) {
  try {
    const { id, ohId } = req.params;
    await officeHoursCol(id).doc(ohId).update({
      rsvps: admin.firestore.FieldValue.arrayUnion(req.uid),
    });
    return res.json({ message: "RSVP confirmed." });
  } catch (err) {
    console.error("rsvpOfficeHours error:", err);
    return res.status(500).json({ error: "Failed to RSVP." });
  }
}

module.exports = { createOfficeHours, listOfficeHours, rsvpOfficeHours };
