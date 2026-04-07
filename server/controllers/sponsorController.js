const admin = require("firebase-admin");

const db = () => admin.firestore();
const eventsCol = () => db().collection("events");
const hackathonsCol = () => db().collection("hackathons");

async function getEventDoc(id) {
  let snap = await eventsCol().doc(id).get();
  if (snap.exists) return snap;
  return hackathonsCol().doc(id).get();
}

function sponsorsCol(eventId) {
  return eventsCol().doc(eventId).collection("sponsors");
}

// ── POST /api/hackathons/:id/sponsors ──────────────────────────────────────

async function createSponsor(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const { name, tier, logoUrl, websiteUrl, description, displayOrder } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Sponsor name is required." });
    }

    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Event not found." });

    const ownerField = hSnap.data().organizerId || hSnap.data().ownerUid;
    if (ownerField !== req.uid) {
      return res.status(403).json({ error: "You do not own this event." });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const data = {
      eventId: id,
      name: name.trim(),
      tier: tier || "gold",
      logoUrl: logoUrl || "",
      websiteUrl: websiteUrl || "",
      description: description || "",
      displayOrder: typeof displayOrder === "number" ? displayOrder : 0,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await sponsorsCol(id).add(data);
    return res.status(201).json({
      id: docRef.id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("createSponsor error:", err);
    return res.status(500).json({ error: "Failed to create sponsor." });
  }
}

// ── GET /api/hackathons/:id/sponsors ───────────────────────────────────────

async function listSponsors(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const snap = await sponsorsCol(id).orderBy("displayOrder", "asc").get();
    const sponsors = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json({ data: sponsors });
  } catch (err) {
    console.error("listSponsors error:", err);
    return res.status(500).json({ error: "Failed to list sponsors." });
  }
}

// ── PATCH /api/hackathons/:id/sponsors/:sponsorId ──────────────────────────

async function updateSponsor(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const { sponsorId } = req.params;
    const updates = { ...req.body };

    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Event not found." });

    const ownerField = hSnap.data().organizerId || hSnap.data().ownerUid;
    if (ownerField !== req.uid) {
      return res.status(403).json({ error: "You do not own this event." });
    }

    delete updates.eventId;
    delete updates.createdAt;

    await sponsorsCol(id).doc(sponsorId).update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ message: "Sponsor updated." });
  } catch (err) {
    console.error("updateSponsor error:", err);
    return res.status(500).json({ error: "Failed to update sponsor." });
  }
}

// ── DELETE /api/hackathons/:id/sponsors/:sponsorId ─────────────────────────

async function deleteSponsor(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const { sponsorId } = req.params;

    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Event not found." });

    const ownerField = hSnap.data().organizerId || hSnap.data().ownerUid;
    if (ownerField !== req.uid) {
      return res.status(403).json({ error: "You do not own this event." });
    }

    await sponsorsCol(id).doc(sponsorId).delete();
    return res.json({ message: "Sponsor deleted." });
  } catch (err) {
    console.error("deleteSponsor error:", err);
    return res.status(500).json({ error: "Failed to delete sponsor." });
  }
}

module.exports = { createSponsor, listSponsors, updateSponsor, deleteSponsor };
