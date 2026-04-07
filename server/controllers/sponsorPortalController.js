const admin = require("firebase-admin");

const db = () => admin.firestore();

// ── GET /api/sponsor/events ────────────────────────────────────────────────
// Returns events where the authenticated user is listed as a sponsor.
async function listSponsorEvents(req, res) {
  try {
    const uid = req.uid;
    const results = [];

    // Check hackathons collection for sponsor entries
    const hackathonsSnap = await db().collection("hackathons").get();
    for (const doc of hackathonsSnap.docs) {
      const sponsorsSnap = await doc.ref
        .collection("sponsors")
        .where("sponsorUid", "==", uid)
        .limit(1)
        .get();

      if (!sponsorsSnap.empty) {
        const data = doc.data();
        results.push({
          id: doc.id,
          title: data.title || "",
          status: data.status || "draft",
          registrantCount: data.registrantCount || 0,
          schedule: data.schedule || {},
        });
      }
    }

    // Also check events collection
    const eventsSnap = await db().collection("events").get();
    for (const doc of eventsSnap.docs) {
      const sponsorsSnap = await doc.ref
        .collection("sponsors")
        .where("sponsorUid", "==", uid)
        .limit(1)
        .get();

      if (!sponsorsSnap.empty) {
        const data = doc.data();
        results.push({
          id: doc.id,
          title: data.title || data.name || "",
          status: data.status || "draft",
          registrantCount: data.registrantCount || 0,
          schedule: data.schedule || {},
        });
      }
    }

    return res.json({ events: results });
  } catch (err) {
    console.error("listSponsorEvents error:", err);
    return res.status(500).json({ error: "Failed to fetch sponsor events." });
  }
}

// ── Helper: resolve event doc (dual lookup) ────────────────────────────────
async function resolveEventDoc(id) {
  let doc = await db().collection("events").doc(id).get();
  if (doc.exists) return doc;
  doc = await db().collection("hackathons").doc(id).get();
  if (doc.exists) return doc;
  return null;
}

// ── Helper: verify sponsor access ──────────────────────────────────────────
async function verifySponsorAccess(eventRef, uid) {
  const sponsorsSnap = await eventRef
    .collection("sponsors")
    .where("sponsorUid", "==", uid)
    .limit(1)
    .get();
  return !sponsorsSnap.empty;
}

// ── GET /api/sponsor/:id/participants ──────────────────────────────────────
// Browse consented participants for a sponsored event.
async function browseParticipants(req, res) {
  try {
    const { id } = req.params;
    const uid = req.uid;

    const eventDoc = await resolveEventDoc(id);
    if (!eventDoc) {
      return res.status(404).json({ error: "Event not found." });
    }

    // Verify sponsor access (organizers always have access)
    if (req.role !== "Organizer") {
      const isSponsor = await verifySponsorAccess(eventDoc.ref, uid);
      if (!isSponsor) {
        return res.status(403).json({ error: "Not a sponsor for this event." });
      }
    }

    // Get accepted registrations
    let regsQuery = eventDoc.ref
      .collection("registrations")
      .where("status", "==", "accepted");

    const regsSnap = await regsQuery.get();

    // Parse filter params
    const skillsFilter = req.query.skills
      ? req.query.skills.split(",").map((s) => s.trim().toLowerCase())
      : null;
    const roleFilter = req.query.role
      ? req.query.role.toLowerCase()
      : null;

    const participants = [];

    for (const regDoc of regsSnap.docs) {
      const reg = regDoc.data();

      // Only include participants who consented to share data
      const formResponses = reg.formResponses || {};
      if (formResponses.consentToShareData !== true) continue;

      // Fetch user profile
      const userDoc = await db().collection("users").doc(reg.uid || regDoc.id).get();
      const user = userDoc.exists ? userDoc.data() : {};

      const skills = Array.isArray(user.skills)
        ? user.skills
        : Array.isArray(reg.skills)
          ? reg.skills
          : [];
      const experienceLevel = user.experienceLevel || reg.experienceLevel || "unknown";
      const participantRole = (formResponses.role || user.role || "").toLowerCase();

      // Apply filters
      if (skillsFilter) {
        const lowerSkills = skills.map((s) => s.toLowerCase());
        const hasMatch = skillsFilter.some((sf) => lowerSkills.includes(sf));
        if (!hasMatch) continue;
      }
      if (roleFilter && participantRole !== roleFilter) continue;

      participants.push({
        uid: reg.uid || regDoc.id,
        name: user.displayName || user.name || reg.name || "Anonymous",
        email: user.email || reg.email || "",
        skills,
        experienceLevel,
        education: user.education || "",
        professional: user.professional || "",
        role: participantRole,
      });
    }

    return res.json({ participants, total: participants.length });
  } catch (err) {
    console.error("browseParticipants error:", err);
    return res.status(500).json({ error: "Failed to fetch participants." });
  }
}

// ── GET /api/sponsor/:id/stats ─────────────────────────────────────────────
// Aggregate stats for a sponsored event.
async function getSponsorStats(req, res) {
  try {
    const { id } = req.params;
    const uid = req.uid;

    const eventDoc = await resolveEventDoc(id);
    if (!eventDoc) {
      return res.status(404).json({ error: "Event not found." });
    }

    // Verify sponsor access
    if (req.role !== "Organizer") {
      const isSponsor = await verifySponsorAccess(eventDoc.ref, uid);
      if (!isSponsor) {
        return res.status(403).json({ error: "Not a sponsor for this event." });
      }
    }

    // Count registrations
    const regsSnap = await eventDoc.ref.collection("registrations").get();
    const totalRegistrants = regsSnap.size;

    // Count teams
    const teamsSnap = await eventDoc.ref.collection("teams").get();
    const totalTeams = teamsSnap.size;

    // Count submissions
    const subsSnap = await eventDoc.ref.collection("submissions").get();
    const totalSubmissions = subsSnap.size;

    // Aggregate skill distribution and experience levels
    const skillCounts = {};
    const experienceCounts = {};

    for (const regDoc of regsSnap.docs) {
      const reg = regDoc.data();
      const userDoc = await db()
        .collection("users")
        .doc(reg.uid || regDoc.id)
        .get();
      const user = userDoc.exists ? userDoc.data() : {};

      const skills = Array.isArray(user.skills)
        ? user.skills
        : Array.isArray(reg.skills)
          ? reg.skills
          : [];

      skills.forEach((s) => {
        const key = s.toLowerCase();
        skillCounts[key] = (skillCounts[key] || 0) + 1;
      });

      const exp = user.experienceLevel || reg.experienceLevel || "unknown";
      experienceCounts[exp] = (experienceCounts[exp] || 0) + 1;
    }

    return res.json({
      totalRegistrants,
      totalTeams,
      totalSubmissions,
      skillDistribution: skillCounts,
      experienceLevels: experienceCounts,
    });
  } catch (err) {
    console.error("getSponsorStats error:", err);
    return res.status(500).json({ error: "Failed to fetch stats." });
  }
}

module.exports = {
  listSponsorEvents,
  browseParticipants,
  getSponsorStats,
};
