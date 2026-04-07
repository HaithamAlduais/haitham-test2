const admin = require("firebase-admin");
const { slugify } = require("../utils/slugify");
const { EVENT_TYPES, ALLOWED_EVENT_TYPES } = require("../lib/constants");

const db = () => admin.firestore();
const eventsCol = () => db().collection("events");
const hackathonsCol = () => db().collection("hackathons");
const sessionsCol = () => db().collection("sessions");

/**
 * Status transitions per event type.
 * Each type defines valid next-states from any given state.
 */
const STATUS_TRANSITIONS = {
  hackathon: {
    draft: ["published"],
    published: ["active", "draft"],
    active: ["judging"],
    judging: ["completed"],
    completed: [],
  },
  workshop: {
    draft: ["published"],
    published: ["active", "draft"],
    active: ["completed"],
    completed: [],
  },
  seminar: {
    draft: ["published"],
    published: ["active", "draft"],
    active: ["completed"],
    completed: [],
  },
  training: {
    draft: ["published"],
    published: ["active", "draft"],
    active: ["completed"],
    completed: [],
  },
  conference: {
    draft: ["published"],
    published: ["active", "draft"],
    active: ["completed"],
    completed: [],
  },
  other: {
    draft: ["published"],
    published: ["active", "draft"],
    active: ["completed"],
    completed: [],
  },
};

// ── POST /api/events ────────────────────────────────────────────────────────

async function createEvent(req, res) {
  try {
    const {
      name, description, visibility, eventType,
      // Shared fields
      tagline, schedule, registrationSettings, isPublic,
      // Hackathon-specific
      tracks, judgingCriteria, prizes, rules, settings: teamSettings, branding,
      // Workshop/seminar-specific
      capacity, platform, meetingLink, speaker, instructor,
      // Training-specific
      modules, level, duration,
    } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "name is required." });
    }

    const type = eventType || "other";
    if (!ALLOWED_EVENT_TYPES.includes(type)) {
      return res.status(400).json({ error: `Invalid event type. Must be one of: ${ALLOWED_EVENT_TYPES.join(", ")}` });
    }

    const slug = slugify(name);
    const now = admin.firestore.FieldValue.serverTimestamp();

    const eventData = {
      ownerUid: req.uid,
      name: name.trim(),
      eventType: type,
      slug,
      description: description ? String(description).trim() : "",
      tagline: tagline ? String(tagline).trim() : "",
      visibility: visibility === "public" ? "public" : "private",
      isPublic: isPublic === true || visibility === "public",
      status: "draft",
      schedule: schedule || {},
      registrationSettings: registrationSettings || { requireApproval: false, customFields: [] },
      registrationCount: 0,
      teamCount: 0,
      materials: [],
      createdAt: now,
      updatedAt: now,
    };

    // Type-specific fields
    if (type === "hackathon") {
      eventData.branding = branding || {};
      eventData.tracks = Array.isArray(tracks) ? tracks : [];
      eventData.judgingCriteria = Array.isArray(judgingCriteria) ? judgingCriteria : [];
      eventData.prizes = Array.isArray(prizes) ? prizes : [];
      eventData.rules = rules ? String(rules) : "";
      eventData.settings = teamSettings || { maxRegistrants: 500, teamSizeMin: 2, teamSizeMax: 5, allowSolo: false };
    } else if (type === "workshop" || type === "seminar") {
      eventData.capacity = capacity || 100;
      eventData.platform = platform || "";
      eventData.meetingLink = meetingLink || "";
      eventData.speaker = speaker || "";
    } else if (type === "training") {
      eventData.instructor = instructor || "";
      eventData.modules = Array.isArray(modules) ? modules : [];
      eventData.level = level || "beginner";
      eventData.duration = duration || "";
    } else if (type === "conference") {
      eventData.tracks = Array.isArray(tracks) ? tracks : [];
      eventData.capacity = capacity || 500;
    }

    // Store in unified events collection
    const docRef = await eventsCol().add(eventData);

    // Also mirror to hackathons collection for backward compat
    if (type === "hackathon") {
      await hackathonsCol().doc(docRef.id).set({
        ...eventData,
        organizerId: req.uid,
        title: eventData.name,
      });
    }

    return res.status(201).json({
      id: docRef.id,
      ...eventData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("createEvent error:", err);
    return res.status(500).json({ error: "Failed to create event." });
  }
}

// ── GET /api/events ─────────────────────────────────────────────────────────

async function listEvents(req, res) {
  try {
    const { type } = req.query;

    let query = eventsCol()
      .where("ownerUid", "==", req.uid)
      .orderBy("createdAt", "desc");

    const snapshot = await query.get();
    let events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Client-side filter by type (Firestore doesn't allow inequality + orderBy on different fields easily)
    if (type) {
      events = events.filter((e) => e.eventType === type);
    }

    return res.json({ data: events });
  } catch (err) {
    console.error("listEvents error:", err);
    return res.status(500).json({ error: "Failed to list events." });
  }
}

// ── GET /api/events/public ──────────────────────────────────────────────────

async function listPublicEvents(req, res) {
  try {
    const { type } = req.query;

    const snapshot = await eventsCol()
      .where("isPublic", "==", true)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    let events = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name,
        tagline: d.tagline,
        slug: d.slug,
        eventType: d.eventType,
        branding: d.branding,
        status: d.status,
        schedule: d.schedule,
        tracks: d.tracks,
        isPublic: d.isPublic,
        registrationCount: d.registrationCount || 0,
        teamCount: d.teamCount || 0,
        capacity: d.capacity,
        speaker: d.speaker,
        createdAt: d.createdAt,
      };
    });

    if (type) {
      const types = type.split(",");
      events = events.filter((e) => types.includes(e.eventType));
    }

    // Exclude drafts
    events = events.filter((e) => e.status !== "draft");

    return res.json({ data: events });
  } catch (err) {
    console.error("listPublicEvents error:", err);
    return res.status(500).json({ error: "Failed to list public events." });
  }
}

// ── GET /api/events/public/:id ──────────────────────────────────────────────

async function getPublicEvent(req, res) {
  try {
    const { id } = req.params;

    // Try by ID first
    let docSnap = await eventsCol().doc(id).get();

    // If not found, try by slug
    if (!docSnap.exists) {
      const slugSnap = await eventsCol().where("slug", "==", id).limit(1).get();
      if (!slugSnap.empty) {
        docSnap = slugSnap.docs[0];
      } else {
        return res.status(404).json({ error: "Event not found." });
      }
    }

    const data = docSnap.exists ? docSnap.data() : docSnap.data();
    if (!data.isPublic && data.status === "draft") {
      return res.status(404).json({ error: "Event not found." });
    }

    return res.json({ id: docSnap.id, ...data });
  } catch (err) {
    console.error("getPublicEvent error:", err);
    return res.status(500).json({ error: "Failed to get event." });
  }
}

// ── GET /api/events/:eventId ────────────────────────────────────────────────

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

// ── PATCH /api/events/:eventId ──────────────────────────────────────────────

async function updateEvent(req, res) {
  try {
    const { eventId } = req.params;
    const updates = { ...req.body };

    const eventRef = eventsCol().doc(eventId);
    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) {
      return res.status(404).json({ error: "Event not found." });
    }

    if (eventSnap.data().ownerUid !== req.uid) {
      return res.status(403).json({ error: "You do not own this event." });
    }

    delete updates.ownerUid;
    delete updates.id;
    delete updates.slug;
    delete updates.createdAt;

    await eventRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Mirror to hackathons collection if hackathon type
    if (eventSnap.data().eventType === "hackathon") {
      try {
        await hackathonsCol().doc(eventId).update({
          ...updates,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch { /* hackathon doc may not exist yet */ }
    }

    return res.json({ message: "Event updated." });
  } catch (err) {
    console.error("updateEvent error:", err);
    return res.status(500).json({ error: "Failed to update event." });
  }
}

// ── PATCH /api/events/:eventId/status ───────────────────────────────────────

async function updateEventStatus(req, res) {
  try {
    const { eventId } = req.params;
    const { status: newStatus } = req.body;

    const ref = eventsCol().doc(eventId);
    const snap = await ref.get();

    if (!snap.exists) return res.status(404).json({ error: "Event not found." });
    const data = snap.data();
    if (data.ownerUid !== req.uid) {
      return res.status(403).json({ error: "You do not own this event." });
    }

    const type = data.eventType || "other";
    const transitions = STATUS_TRANSITIONS[type] || STATUS_TRANSITIONS.other;
    const allowed = transitions[data.status] || [];

    if (!allowed.includes(newStatus)) {
      return res.status(400).json({
        error: `Cannot transition from "${data.status}" to "${newStatus}" for type "${type}".`,
      });
    }

    await ref.update({
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Mirror to hackathons collection
    if (type === "hackathon") {
      try {
        await hackathonsCol().doc(eventId).update({ status: newStatus });
      } catch { /* ok */ }
    }

    return res.json({ message: `Status updated to "${newStatus}".` });
  } catch (err) {
    console.error("updateEventStatus error:", err);
    return res.status(500).json({ error: "Failed to update status." });
  }
}

// ── GET /api/events/:eventId/sessions (legacy) ──────────────────────────────

async function listEventSessions(req, res) {
  try {
    const { eventId } = req.params;

    const eventSnap = await eventsCol().doc(eventId).get();
    if (!eventSnap.exists) return res.status(404).json({ error: "Event not found." });
    if (eventSnap.data().ownerUid !== req.uid) {
      return res.status(403).json({ error: "You do not own this event." });
    }

    const snapshot = await sessionsCol()
      .where("eventId", "==", eventId)
      .where("ownerUid", "==", req.uid)
      .orderBy("createdAt", "desc")
      .get();

    const sessions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json({ data: sessions });
  } catch (err) {
    console.error("listEventSessions error:", err);
    return res.status(500).json({ error: "Failed to list sessions." });
  }
}

module.exports = {
  createEvent,
  listEvents,
  listPublicEvents,
  getPublicEvent,
  getEvent,
  updateEvent,
  updateEventStatus,
  listEventSessions,
};
