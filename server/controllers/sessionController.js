const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");

// Lazy accessors — Firestore is only available after admin.initializeApp()
// has been called in server/index.js, so we access them via functions.
const db = () => admin.firestore();
const sessionsCol = () => db().collection("sessions");

// ── Enums (mirror src/firestoreSchema.js) ────────────────────────────────────

const SESSION_STATUS = { DRAFT: "draft", ACTIVE: "active", CLOSED: "closed" };
const SESSION_TYPE = { QR_CODE: "qr_code", F2F: "f2f" };

// ── POST /api/sessions ──────────────────────────────────────────────────────

async function createSession(req, res) {
  try {
    const { title, sessionType, notes, allowedLatenessMinutes, durationMinutes, eventId, radiusMeters } = req.body;

    // Validate required fields
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ error: "title is required and must be a non-empty string." });
    }
    if (!Object.values(SESSION_TYPE).includes(sessionType)) {
      return res.status(400).json({ error: `sessionType must be one of: ${Object.values(SESSION_TYPE).join(", ")}.` });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    const sessionData = {
      ownerUid: req.uid,
      title: title.trim(),
      sessionType,
      status: SESSION_STATUS.DRAFT,
      notes: notes || "",
      allowedLatenessMinutes: allowedLatenessMinutes ?? 15,
      durationMinutes: durationMinutes ?? null,
      autoCloseTime: null,
      eventId: eventId || null,
      qrCode: sessionType === SESSION_TYPE.QR_CODE ? uuidv4() : null,
      radiusMeters: sessionType === SESSION_TYPE.F2F && radiusMeters ? Number(radiusMeters) : null,
      instructorLocation: null,
      createdAt: now,
    };

    const docRef = await sessionsCol().add(sessionData);

    return res.status(201).json({
      id: docRef.id,
      ...sessionData,
      createdAt: new Date().toISOString(), // approximate for the response
    });
  } catch (err) {
    console.error("createSession error:", err);
    return res.status(500).json({ error: "Failed to create session." });
  }
}

// ── GET /api/sessions ───────────────────────────────────────────────────────

async function listSessions(req, res) {
  try {
    const { eventId } = req.query;

    let q = sessionsCol()
      .where("ownerUid", "==", req.uid)
      .orderBy("createdAt", "desc")
      .limit(50);

    // If eventId filter is provided, use a different query
    if (eventId) {
      q = sessionsCol()
        .where("ownerUid", "==", req.uid)
        .where("eventId", "==", eventId)
        .orderBy("createdAt", "desc")
        .limit(50);
    }

    const snapshot = await q.get();
    const sessions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({ data: sessions });
  } catch (err) {
    console.error("listSessions error:", err);
    return res.status(500).json({ error: "Failed to list sessions." });
  }
}

// ── GET /api/sessions/:id ───────────────────────────────────────────────────

async function getSession(req, res) {
  try {
    const { id } = req.params;
    const docSnap = await sessionsCol().doc(id).get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "Session not found." });
    }

    const session = docSnap.data();

    // Organizers can see their own sessions (any status).
    // Participants can only see active sessions.
    if (req.role === "Organizer" && session.ownerUid !== req.uid) {
      return res.status(403).json({ error: "You do not own this session." });
    }
    if (req.role === "Participant" && session.status !== SESSION_STATUS.ACTIVE) {
      return res.status(403).json({ error: "Session is not active." });
    }

    return res.json({ id: docSnap.id, ...session });
  } catch (err) {
    console.error("getSession error:", err);
    return res.status(500).json({ error: "Failed to get session." });
  }
}

// ── PATCH /api/sessions/:id/activate ────────────────────────────────────────

async function activateSession(req, res) {
  try {
    const { id } = req.params;
    const { instructorLocation, radiusMeters } = req.body;

    const docSnap = await sessionsCol().doc(id).get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Session not found." });
    }

    const session = docSnap.data();

    if (session.ownerUid !== req.uid) {
      return res.status(403).json({ error: "You do not own this session." });
    }
    if (session.status !== SESSION_STATUS.DRAFT) {
      return res.status(400).json({ error: "Only draft sessions can be activated." });
    }

    // F2F sessions require instructor location
    if (session.sessionType === SESSION_TYPE.F2F) {
      if (
        !instructorLocation ||
        typeof instructorLocation.latitude !== "number" ||
        typeof instructorLocation.longitude !== "number"
      ) {
        return res.status(400).json({
          error: "F2F sessions require instructorLocation with latitude and longitude.",
        });
      }
    }

    // Calculate autoCloseTime if durationMinutes is set
    let autoCloseTime = null;
    if (session.durationMinutes && session.durationMinutes > 0) {
      const closeDate = new Date(Date.now() + session.durationMinutes * 60 * 1000);
      autoCloseTime = admin.firestore.Timestamp.fromDate(closeDate);
    }

    const updateData = {
      status: SESSION_STATUS.ACTIVE,
      activatedAt: admin.firestore.Timestamp.now(),
      autoCloseTime,
    };

    if (session.sessionType === SESSION_TYPE.F2F) {
      updateData.instructorLocation = instructorLocation;
      updateData.radiusMeters = radiusMeters || session.radiusMeters || 100;
    }

    await sessionsCol().doc(id).update(updateData);

    return res.json({
      id,
      ...session,
      ...updateData,
    });
  } catch (err) {
    console.error("activateSession error:", err);
    return res.status(500).json({ error: "Failed to activate session." });
  }
}

// ── PATCH /api/sessions/:id/close ───────────────────────────────────────────

async function closeSession(req, res) {
  try {
    const { id } = req.params;
    const docSnap = await sessionsCol().doc(id).get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "Session not found." });
    }

    const session = docSnap.data();

    if (session.ownerUid !== req.uid) {
      return res.status(403).json({ error: "You do not own this session." });
    }
    if (session.status !== SESSION_STATUS.ACTIVE) {
      return res.status(400).json({ error: "Only active sessions can be closed." });
    }

    await sessionsCol().doc(id).update({ status: SESSION_STATUS.CLOSED });

    return res.json({ id, ...session, status: SESSION_STATUS.CLOSED });
  } catch (err) {
    console.error("closeSession error:", err);
    return res.status(500).json({ error: "Failed to close session." });
  }
}

// ── PATCH /api/sessions/:id ────────────────────────────────────────────────

async function updateSession(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const sessionRef = sessionsCol().doc(id);
    const docSnap = await sessionRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "Session not found." });
    }

    if (docSnap.data().ownerUid !== req.uid) {
      return res.status(403).json({ error: "You do not own this session." });
    }

    delete updates.ownerUid;
    delete updates.id;

    await sessionRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ message: "Session updated successfully." });
  } catch (err) {
    console.error("updateSession error:", err);
    return res.status(500).json({ error: "Failed to update session." });
  }
}

module.exports = {
  createSession,
  listSessions,
  getSession,
  activateSession,
  closeSession,
  updateSession,
};
