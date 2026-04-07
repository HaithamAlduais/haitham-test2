const express = require("express");
const admin = require("firebase-admin");
const requireRole = require("../middleware/requireRole");

const db = () => admin.firestore();
const eventsCol = () => db().collection("events");

const router = express.Router();

// ── GET /api/participant/my-events ──────────────────────────────────────────
// List all events the participant has registered for

router.get("/my-events", requireRole("Participant"), async (req, res) => {
  try {
    // Query all events collections for registrations by this user
    // Since registrations are subcollections, we use collectionGroup
    const regsSnap = await db()
      .collectionGroup("registrations")
      .where("userId", "==", req.uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const results = [];
    for (const doc of regsSnap.docs) {
      const reg = doc.data();
      const eventId = reg.hackathonId || doc.ref.parent.parent.id;

      // Fetch event details
      let eventSnap = await eventsCol().doc(eventId).get();
      if (!eventSnap.exists) {
        // Try hackathons collection
        eventSnap = await db().collection("hackathons").doc(eventId).get();
      }

      if (eventSnap.exists) {
        const event = eventSnap.data();
        results.push({
          registrationId: doc.id,
          registrationStatus: reg.status,
          registeredAt: reg.createdAt,
          eventId,
          eventName: event.name || event.title,
          eventType: event.eventType || "hackathon",
          eventStatus: event.status,
          eventSlug: event.slug,
        });
      }
    }

    return res.json({ data: results });
  } catch (err) {
    console.error("my-events error:", err);
    return res.status(500).json({ error: "Failed to fetch your events." });
  }
});

// ── GET /api/participant/my-teams ───────────────────────────────────────────

router.get("/my-teams", requireRole("Participant"), async (req, res) => {
  try {
    const membershipsSnap = await db()
      .collectionGroup("members")
      .where("userId", "==", req.uid)
      .limit(50)
      .get();

    const results = [];
    for (const doc of membershipsSnap.docs) {
      const member = doc.data();
      const teamRef = doc.ref.parent.parent;
      const teamSnap = await teamRef.get();

      if (teamSnap.exists) {
        const team = teamSnap.data();
        const eventId = team.hackathonId || teamRef.parent.parent.id;

        let eventSnap = await eventsCol().doc(eventId).get();
        if (!eventSnap.exists) {
          eventSnap = await db().collection("hackathons").doc(eventId).get();
        }

        results.push({
          teamId: teamSnap.id,
          teamName: team.name,
          teamCode: team.code,
          teamStatus: team.status,
          memberRole: member.role,
          eventId,
          eventName: eventSnap.exists ? (eventSnap.data().name || eventSnap.data().title) : "Unknown",
          eventType: eventSnap.exists ? (eventSnap.data().eventType || "hackathon") : "hackathon",
        });
      }
    }

    return res.json({ data: results });
  } catch (err) {
    console.error("my-teams error:", err);
    return res.status(500).json({ error: "Failed to fetch your teams." });
  }
});

// ── GET /api/participant/my-submissions ──────────────────────────────────────

router.get("/my-submissions", requireRole("Participant"), async (req, res) => {
  try {
    const subsSnap = await db()
      .collectionGroup("submissions")
      .where("submitterId", "==", req.uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const results = [];
    for (const doc of subsSnap.docs) {
      const sub = doc.data();
      const eventId = sub.hackathonId || doc.ref.parent.parent.id;

      let eventSnap = await eventsCol().doc(eventId).get();
      if (!eventSnap.exists) {
        eventSnap = await db().collection("hackathons").doc(eventId).get();
      }

      results.push({
        submissionId: doc.id,
        projectName: sub.projectName,
        status: sub.status,
        totalScore: sub.totalScore,
        submittedAt: sub.submittedAt || sub.createdAt,
        eventId,
        eventName: eventSnap.exists ? (eventSnap.data().name || eventSnap.data().title) : "Unknown",
      });
    }

    return res.json({ data: results });
  } catch (err) {
    console.error("my-submissions error:", err);
    return res.status(500).json({ error: "Failed to fetch your submissions." });
  }
});

module.exports = router;
