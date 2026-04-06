const admin = require("firebase-admin");

// Lazy accessors — Firestore is only available after admin.initializeApp()
const db = () => admin.firestore();
const eventsCol = () => db().collection("events");
const sessionsCol = () => db().collection("sessions");

// ── GET /api/events ──────────────────────────────────────────────────────────

/**
 * Ramsha — List all events owned by the requesting Provider.
 *
 * Returns an array of event objects sorted by createdAt descending.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
async function listEvents(req, res) {
  try {
    const snapshot = await eventsCol()
      .where("ownerUid", "==", req.uid)
      .orderBy("createdAt", "desc")
      .get();

    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({ data: events });
  } catch (err) {
    console.error("listEvents error:", err);
    return res.status(500).json({ error: "Failed to list events." });
  }
}

// ── GET /api/events/:eventId/sessions ────────────────────────────────────────

/**
 * Ramsha — List all sessions linked to a specific event.
 *
 * Validates that the event exists and belongs to the requesting Provider,
 * then returns all sessions where eventId matches, sorted by createdAt desc.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
async function listEventSessions(req, res) {
  try {
    const { eventId } = req.params;

    const eventSnap = await eventsCol().doc(eventId).get();
    if (!eventSnap.exists) {
      return res.status(404).json({ error: "Event not found." });
    }

    const event = eventSnap.data();
    if (event.ownerUid !== req.uid) {
      return res.status(403).json({ error: "You do not own this event." });
    }

    const snapshot = await sessionsCol()
      .where("eventId", "==", eventId)
      .where("ownerUid", "==", req.uid)
      .orderBy("createdAt", "desc")
      .get();

    const sessions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({ data: sessions });
  } catch (err) {
    console.error("listEventSessions error:", err);
    return res.status(500).json({ error: "Failed to list sessions for this event." });
  }
}

// ── GET /api/events/:eventId ──────────────────────────────────────────────────

/**
 * Ramsha — Get a single event by ID.
 *
 * Validates that the event exists and belongs to the requesting Provider.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
async function getEvent(req, res) {
  try {
    const { eventId } = req.params;

    const eventSnap = await eventsCol().doc(eventId).get();
    if (!eventSnap.exists) {
      return res.status(404).json({ error: "Event not found." });
    }

    const event = eventSnap.data();
    if (event.ownerUid !== req.uid) {
      return res.status(403).json({ error: "You do not own this event." });
    }

    return res.json({ id: eventSnap.id, ...event });
  } catch (err) {
    console.error("getEvent error:", err);
    return res.status(500).json({ error: "Failed to get event." });
  }
}

// ── POST /api/events ──────────────────────────────────────────────────────────

/**
 * Ramsha — Create a new event owned by the requesting Provider.
 *
 * Required body fields: name (string).
 * Optional: description (string).
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
async function createEvent(req, res) {
  try {
    const { name, description, visibility } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "name is required and must be a non-empty string." });
    }

    const eventData = {
      ownerUid: req.uid,
      name: name.trim(),
      description: description ? String(description).trim() : "",
      visibility: visibility === "public" ? "public" : "private",
      materials: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await eventsCol().add(eventData);

    return res.status(201).json({
      id: docRef.id,
      ...eventData,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("createEvent error:", err);
    return res.status(500).json({ error: "Failed to create event." });
  }
}

// ── PATCH /api/events/:eventId ────────────────────────────────────────────────

/**
 * Ramsha — Update an existing event (e.g. for adding materials).
 */
async function updateEvent(req, res) {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    const eventRef = eventsCol().doc(eventId);
    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) {
      return res.status(404).json({ error: "Event not found." });
    }

    if (eventSnap.data().ownerUid !== req.uid) {
      return res.status(403).json({ error: "You do not own this event." });
    }

    // prevent updating owner or id
    delete updates.ownerUid;
    delete updates.id;

    await eventRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ message: "Event updated successfully." });
  } catch (err) {
    console.error("updateEvent error:", err);
    return res.status(500).json({ error: "Failed to update event." });
  }
}

module.exports = { listEvents, getEvent, listEventSessions, createEvent, updateEvent };
