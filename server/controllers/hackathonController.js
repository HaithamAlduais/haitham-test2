const admin = require("firebase-admin");
const { slugify } = require("../utils/slugify");
const { HACKATHON_STATUS } = require("../lib/constants");
const { onHackathonPublished } = require("../services/automationService");

const db = () => admin.firestore();
const hackathonsCol = () => db().collection("hackathons");

// ── POST /api/hackathons ────────────────────────────────────────────────────

async function createHackathon(req, res) {
  try {
    const {
      title,
      tagline,
      description,
      branding,
      settings,
      tracks,
      judgingCriteria,
      prizes,
      rules,
      schedule,
      registrationSettings,
      isPublic,
      aiScreeningConfig,
      workbackSchedule,
      resources,
      sponsors,
    } = req.body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ error: "title is required." });
    }

    const slug = slugify(title);
    const now = admin.firestore.FieldValue.serverTimestamp();

    const hackathonData = {
      organizerId: req.uid,
      title: title.trim(),
      tagline: tagline ? String(tagline).trim() : "",
      description: description ? String(description).trim() : "",
      slug,
      branding: branding || { logoUrl: "", bannerUrl: "", primaryColor: "", secondaryColor: "" },
      settings: settings || { maxRegistrants: 500, teamSizeMin: 1, teamSizeMax: 5, allowSolo: false },
      tracks: Array.isArray(tracks) ? tracks : [],
      judgingCriteria: Array.isArray(judgingCriteria) ? judgingCriteria : [],
      prizes: Array.isArray(prizes) ? prizes : [],
      rules: rules ? String(rules) : "",
      schedule: schedule || {
        registrationOpen: null,
        registrationClose: null,
        submissionDeadline: null,
        judgingStart: null,
        judgingEnd: null,
      },
      registrationSettings: registrationSettings || {
        requireApproval: true,
        customFields: [],
      },
      aiScreeningConfig: aiScreeningConfig || {
        enabled: false,
        criteria: [],
        autoAcceptThreshold: 80,
        autoRejectThreshold: 30,
        language: "both",
      },
      workbackSchedule: Array.isArray(workbackSchedule) ? workbackSchedule : [],
      sponsors: Array.isArray(req.body.sponsors) ? req.body.sponsors : [],
      faq: Array.isArray(req.body.faq) ? req.body.faq : [],
      registrationForm: req.body.registrationForm || { fields: [] },
      format: req.body.format || "online",
      hackathonStart: req.body.hackathonStart || "",
      hackathonEnd: req.body.hackathonEnd || "",
      sessionsStart: req.body.sessionsStart || "",
      sessionsEnd: req.body.sessionsEnd || "",
      contactEmail: req.body.contactEmail || "",
      targetAudience: req.body.targetAudience || "",
      location: req.body.location || { name: "", address: "" },
      judgingMode: req.body.judgingMode || "during",
      customPageHtml: req.body.customPageHtml || "",
      hasCustomPage: req.body.hasCustomPage === true,
      status: HACKATHON_STATUS.DRAFT,
      isPublic: isPublic === true,
      registrationCount: 0,
      teamCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await hackathonsCol().add(hackathonData);

    // Dual write to events collection so My Events page sees it
    const eventsData = {
      ...hackathonData,
      ownerUid: req.uid,
      name: hackathonData.title,
      eventType: "hackathon",
      visibility: hackathonData.isPublic ? "public" : "private",
    };
    await db().collection("events").doc(docRef.id).set(eventsData);

    return res.status(201).json({
      id: docRef.id,
      ...hackathonData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("createHackathon error:", err);
    return res.status(500).json({ error: "Failed to create hackathon." });
  }
}

// ── GET /api/hackathons ─────────────────────────────────────────────────────

async function listHackathons(req, res) {
  try {
    const snapshot = await hackathonsCol()
      .where("organizerId", "==", req.uid)
      .orderBy("createdAt", "desc")
      .get();

    const hackathons = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({ data: hackathons });
  } catch (err) {
    console.error("listHackathons error:", err);
    return res.status(500).json({ error: "Failed to list hackathons." });
  }
}

// ── GET /api/hackathons/:id ─────────────────────────────────────────────────

async function getHackathon(req, res) {
  try {
    const { id } = req.params;
    const docSnap = await hackathonsCol().doc(id).get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "Hackathon not found." });
    }

    const data = docSnap.data();
    if (data.organizerId !== req.uid) {
      return res.status(403).json({ error: "You do not own this hackathon." });
    }

    return res.json({ id: docSnap.id, ...data });
  } catch (err) {
    console.error("getHackathon error:", err);
    return res.status(500).json({ error: "Failed to get hackathon." });
  }
}

// ── PATCH /api/hackathons/:id ───────────────────────────────────────────────

async function updateHackathon(req, res) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const ref = hackathonsCol().doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "Hackathon not found." });
    }
    if (snap.data().organizerId !== req.uid) {
      return res.status(403).json({ error: "You do not own this hackathon." });
    }

    // Prevent overwriting protected fields
    delete updates.organizerId;
    delete updates.id;
    delete updates.slug;
    delete updates.createdAt;

    await ref.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ message: "Hackathon updated." });
  } catch (err) {
    console.error("updateHackathon error:", err);
    return res.status(500).json({ error: "Failed to update hackathon." });
  }
}

// ── PATCH /api/hackathons/:id/status ────────────────────────────────────────

const VALID_TRANSITIONS = {
  [HACKATHON_STATUS.DRAFT]: [HACKATHON_STATUS.PUBLISHED],
  [HACKATHON_STATUS.PUBLISHED]: [HACKATHON_STATUS.ACTIVE, HACKATHON_STATUS.DRAFT],
  [HACKATHON_STATUS.ACTIVE]: [HACKATHON_STATUS.JUDGING],
  [HACKATHON_STATUS.JUDGING]: [HACKATHON_STATUS.COMPLETED],
  [HACKATHON_STATUS.COMPLETED]: [],
};

async function updateHackathonStatus(req, res) {
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;

    if (!newStatus || !Object.values(HACKATHON_STATUS).includes(newStatus)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    const ref = hackathonsCol().doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "Hackathon not found." });
    }

    const data = snap.data();
    if (data.organizerId !== req.uid) {
      return res.status(403).json({ error: "You do not own this hackathon." });
    }

    const allowed = VALID_TRANSITIONS[data.status] || [];
    if (!allowed.includes(newStatus)) {
      return res.status(400).json({
        error: `Cannot transition from "${data.status}" to "${newStatus}".`,
      });
    }

    await ref.update({
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Also update events collection
    await db().collection("events").doc(id).update({
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }).catch(() => {});

    // AUTOMATION: trigger actions based on new status
    if (newStatus === HACKATHON_STATUS.PUBLISHED) {
      onHackathonPublished({ hackathon: { ...data, status: newStatus }, hackathonId: id }).catch(console.warn);
    }

    return res.json({ message: `Status updated to "${newStatus}".` });
  } catch (err) {
    console.error("updateHackathonStatus error:", err);
    return res.status(500).json({ error: "Failed to update status." });
  }
}

// ── GET /api/hackathons/public ──────────────────────────────────────────────

async function listPublicHackathons(req, res) {
  try {
    const snapshot = await hackathonsCol()
      .where("isPublic", "==", true)
      .where("status", "in", [
        HACKATHON_STATUS.PUBLISHED,
        HACKATHON_STATUS.ACTIVE,
        HACKATHON_STATUS.JUDGING,
        HACKATHON_STATUS.COMPLETED,
      ])
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const hackathons = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        title: d.title,
        tagline: d.tagline,
        slug: d.slug,
        branding: d.branding,
        status: d.status,
        schedule: d.schedule,
        tracks: d.tracks,
        isPublic: d.isPublic,
        registrationCount: d.registrationCount || 0,
        teamCount: d.teamCount || 0,
        createdAt: d.createdAt,
      };
    });

    return res.json({ data: hackathons });
  } catch (err) {
    console.error("listPublicHackathons error:", err);
    return res.status(500).json({ error: "Failed to list public hackathons." });
  }
}

// ── GET /api/hackathons/public/:slug ────────────────────────────────────────

async function getPublicHackathon(req, res) {
  try {
    const { slug } = req.params;
    const decodedSlug = decodeURIComponent(slug);

    // Try by slug first (public hackathons)
    let snapshot = await hackathonsCol()
      .where("slug", "==", decodedSlug)
      .limit(1)
      .get();

    // Fallback: try by document ID
    if (snapshot.empty) {
      const docSnap = await hackathonsCol().doc(decodedSlug).get();
      if (docSnap.exists) {
        return res.json({ id: docSnap.id, ...docSnap.data() });
      }
      return res.status(404).json({ error: "Hackathon not found." });
    }

    const doc = snapshot.docs[0];
    return res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("getPublicHackathon error:", err);
    return res.status(500).json({ error: "Failed to get hackathon." });
  }
}

module.exports = {
  createHackathon,
  listHackathons,
  getHackathon,
  updateHackathon,
  updateHackathonStatus,
  listPublicHackathons,
  getPublicHackathon,
};
