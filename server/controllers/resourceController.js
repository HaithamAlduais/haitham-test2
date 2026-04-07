const admin = require("firebase-admin");

const db = () => admin.firestore();
const eventsCol = () => db().collection("events");
const hackathonsCol = () => db().collection("hackathons");

async function getEventDoc(id) {
  let snap = await eventsCol().doc(id).get();
  if (snap.exists) return snap;
  return hackathonsCol().doc(id).get();
}

function resourcesCol(eventId) {
  return eventsCol().doc(eventId).collection("resources");
}

// ── POST /api/hackathons/:id/resources ─────────────────────────────────────

async function createResource(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const { title, url, type, description } = req.body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ error: "Resource title is required." });
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
      title: title.trim(),
      url: url || "",
      type: type || "link",
      description: description || "",
      createdAt: now,
    };

    const docRef = await resourcesCol(id).add(data);
    return res.status(201).json({
      id: docRef.id,
      ...data,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("createResource error:", err);
    return res.status(500).json({ error: "Failed to create resource." });
  }
}

// ── GET /api/hackathons/:id/resources ──────────────────────────────────────

async function listResources(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const snap = await resourcesCol(id).orderBy("createdAt", "desc").get();
    const resources = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json({ data: resources });
  } catch (err) {
    console.error("listResources error:", err);
    return res.status(500).json({ error: "Failed to list resources." });
  }
}

// ── DELETE /api/hackathons/:id/resources/:resourceId ───────────────────────

async function deleteResource(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const { resourceId } = req.params;

    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Event not found." });

    const ownerField = hSnap.data().organizerId || hSnap.data().ownerUid;
    if (ownerField !== req.uid) {
      return res.status(403).json({ error: "You do not own this event." });
    }

    await resourcesCol(id).doc(resourceId).delete();
    return res.json({ message: "Resource deleted." });
  } catch (err) {
    console.error("deleteResource error:", err);
    return res.status(500).json({ error: "Failed to delete resource." });
  }
}

module.exports = { createResource, listResources, deleteResource };
