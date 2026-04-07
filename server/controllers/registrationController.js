const admin = require("firebase-admin");
const { REGISTRATION_STATUS } = require("../lib/constants");

const db = () => admin.firestore();
const eventsCol = () => db().collection("events");
const hackathonsCol = () => db().collection("hackathons");

/** Try events collection first, fall back to hackathons for backward compat. */
async function getEventDoc(id) {
  let snap = await eventsCol().doc(id).get();
  if (snap.exists) return snap;
  return hackathonsCol().doc(id).get();
}

function registrationsCol(eventId) {
  return eventsCol().doc(eventId).collection("registrations");
}

// ── POST /api/hackathons/:id/registrations ──────────────────────────────────

async function submitRegistration(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const { formResponses } = req.body;

    // Check hackathon exists and is accepting registrations
    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) {
      return res.status(404).json({ error: "Hackathon not found." });
    }
    const hackathon = hSnap.data();
    if (!["published", "active"].includes(hackathon.status)) {
      return res.status(400).json({ error: "Registration is not open for this hackathon." });
    }

    // Check if already registered
    const existingSnap = await registrationsCol(id)
      .where("userId", "==", req.uid)
      .limit(1)
      .get();
    if (!existingSnap.empty) {
      return res.status(409).json({ error: "You are already registered for this hackathon." });
    }

    // Check max registrants
    const maxReg = hackathon.settings?.maxRegistrants || 500;
    if ((hackathon.registrationCount || 0) >= maxReg) {
      return res.status(400).json({ error: "Registration is full." });
    }

    const requireApproval = hackathon.registrationSettings?.requireApproval !== false;
    const now = admin.firestore.FieldValue.serverTimestamp();

    const regData = {
      userId: req.uid,
      userEmail: req.email,
      hackathonId: id,
      formResponses: formResponses || {},
      aiScore: null,
      status: requireApproval ? REGISTRATION_STATUS.PENDING : REGISTRATION_STATUS.ACCEPTED,
      createdAt: now,
    };

    const docRef = await registrationsCol(id).add(regData);

    // Increment registration count
    await eventsCol().doc(id).update({
      registrationCount: admin.firestore.FieldValue.increment(1),
    }).catch(() => {
      // Fall back to hackathons collection
      return hackathonsCol().doc(id).update({
        registrationCount: admin.firestore.FieldValue.increment(1),
      });
    });

    return res.status(201).json({ id: docRef.id, ...regData, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error("submitRegistration error:", err);
    return res.status(500).json({ error: "Failed to submit registration." });
  }
}

// ── GET /api/hackathons/:id/registrations/mine ──────────────────────────────

async function getMyRegistration(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const snap = await registrationsCol(id)
      .where("userId", "==", req.uid)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.json({ registered: false });
    }

    const doc = snap.docs[0];
    return res.json({ registered: true, id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("getMyRegistration error:", err);
    return res.status(500).json({ error: "Failed to check registration." });
  }
}

// ── GET /api/hackathons/:id/registrations ───────────────────────────────────

async function listRegistrations(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const { status: filterStatus, limit: limitStr } = req.query;

    // Verify ownership
    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });
    if (hSnap.data().organizerId !== req.uid) {
      return res.status(403).json({ error: "You do not own this hackathon." });
    }

    let query = registrationsCol(id).orderBy("createdAt", "desc");
    if (filterStatus) {
      query = query.where("status", "==", filterStatus);
    }
    query = query.limit(Number(limitStr) || 100);

    const snap = await query.get();
    const registrations = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return res.json({ data: registrations });
  } catch (err) {
    console.error("listRegistrations error:", err);
    return res.status(500).json({ error: "Failed to list registrations." });
  }
}

// ── PATCH /api/hackathons/:id/registrations/:regId ──────────────────────────

async function updateRegistrationStatus(req, res) {
  try {
    const { id, regId } = req.params;
    const { status: newStatus } = req.body;

    if (!Object.values(REGISTRATION_STATUS).includes(newStatus)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    // Verify ownership
    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });
    if (hSnap.data().organizerId !== req.uid) {
      return res.status(403).json({ error: "You do not own this hackathon." });
    }

    await registrationsCol(id).doc(regId).update({
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ message: `Registration status updated to "${newStatus}".` });
  } catch (err) {
    console.error("updateRegistrationStatus error:", err);
    return res.status(500).json({ error: "Failed to update registration." });
  }
}

// ── POST /api/hackathons/:id/registrations/bulk-status ──────────────────────

async function bulkUpdateStatus(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const { registrationIds, status: newStatus } = req.body;

    if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
      return res.status(400).json({ error: "registrationIds must be a non-empty array." });
    }
    if (!Object.values(REGISTRATION_STATUS).includes(newStatus)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    // Verify ownership
    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });
    if (hSnap.data().organizerId !== req.uid) {
      return res.status(403).json({ error: "You do not own this hackathon." });
    }

    const batch = db().batch();
    const now = admin.firestore.FieldValue.serverTimestamp();
    for (const regId of registrationIds) {
      batch.update(registrationsCol(id).doc(regId), { status: newStatus, updatedAt: now });
    }
    await batch.commit();

    return res.json({ message: `${registrationIds.length} registrations updated to "${newStatus}".` });
  } catch (err) {
    console.error("bulkUpdateStatus error:", err);
    return res.status(500).json({ error: "Failed to bulk update." });
  }
}

module.exports = {
  submitRegistration,
  getMyRegistration,
  listRegistrations,
  updateRegistrationStatus,
  bulkUpdateStatus,
};
