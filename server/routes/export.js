const express = require("express");
const admin = require("firebase-admin");
const requireRole = require("../middleware/requireRole");

const db = () => admin.firestore();
const eventsCol = () => db().collection("events");
const hackathonsCol = () => db().collection("hackathons");

const router = express.Router();

function toCsv(headers, rows) {
  const escape = (val) => {
    const s = String(val ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

async function getEventDoc(id) {
  let snap = await eventsCol().doc(id).get();
  if (snap.exists) return snap;
  return hackathonsCol().doc(id).get();
}

// ── GET /api/export/:eventId/registrations ──────────────────────────────────

router.get("/:eventId/registrations", requireRole("Organizer"), async (req, res) => {
  try {
    const { eventId } = req.params;
    const eventSnap = await getEventDoc(eventId);
    if (!eventSnap.exists) return res.status(404).json({ error: "Event not found." });
    if ((eventSnap.data().ownerUid || eventSnap.data().organizerId) !== req.uid) {
      return res.status(403).json({ error: "Not authorized." });
    }

    const snap = await eventsCol().doc(eventId).collection("registrations").orderBy("createdAt", "desc").get();
    const headers = ["email", "status", "aiScore", "aiRecommendation", "createdAt"];
    const rows = snap.docs.map((d) => {
      const data = d.data();
      return {
        email: data.userEmail || data.userId,
        status: data.status,
        aiScore: data.aiScore ?? "",
        aiRecommendation: data.aiRecommendation ?? "",
        createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : "",
      };
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="registrations-${eventId}.csv"`);
    return res.send(toCsv(headers, rows));
  } catch (err) {
    console.error("Export registrations error:", err);
    return res.status(500).json({ error: "Export failed." });
  }
});

// ── GET /api/export/:eventId/teams ──────────────────────────────────────────

router.get("/:eventId/teams", requireRole("Organizer"), async (req, res) => {
  try {
    const { eventId } = req.params;
    const eventSnap = await getEventDoc(eventId);
    if (!eventSnap.exists) return res.status(404).json({ error: "Event not found." });
    if ((eventSnap.data().ownerUid || eventSnap.data().organizerId) !== req.uid) {
      return res.status(403).json({ error: "Not authorized." });
    }

    const snap = await eventsCol().doc(eventId).collection("teams").orderBy("createdAt", "desc").get();
    const headers = ["teamName", "code", "status", "memberCount", "track", "createdAt"];
    const rows = snap.docs.map((d) => {
      const data = d.data();
      return {
        teamName: data.name,
        code: data.code,
        status: data.status,
        memberCount: data.memberCount || 1,
        track: data.track || "",
        createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : "",
      };
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="teams-${eventId}.csv"`);
    return res.send(toCsv(headers, rows));
  } catch (err) {
    console.error("Export teams error:", err);
    return res.status(500).json({ error: "Export failed." });
  }
});

// ── GET /api/export/:eventId/submissions ────────────────────────────────────

router.get("/:eventId/submissions", requireRole("Organizer"), async (req, res) => {
  try {
    const { eventId } = req.params;
    const eventSnap = await getEventDoc(eventId);
    if (!eventSnap.exists) return res.status(404).json({ error: "Event not found." });
    if ((eventSnap.data().ownerUid || eventSnap.data().organizerId) !== req.uid) {
      return res.status(403).json({ error: "Not authorized." });
    }

    const snap = await eventsCol().doc(eventId).collection("submissions").orderBy("createdAt", "desc").get();
    const headers = ["projectName", "status", "totalScore", "githubUrl", "demoUrl", "techStack", "submitterEmail", "createdAt"];
    const rows = snap.docs.map((d) => {
      const data = d.data();
      return {
        projectName: data.projectName,
        status: data.status,
        totalScore: data.totalScore ?? "",
        githubUrl: data.githubUrl || "",
        demoUrl: data.demoUrl || "",
        techStack: (data.techStack || []).join("; "),
        submitterEmail: data.submitterEmail || data.submitterId,
        createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : "",
      };
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="submissions-${eventId}.csv"`);
    return res.send(toCsv(headers, rows));
  } catch (err) {
    console.error("Export submissions error:", err);
    return res.status(500).json({ error: "Export failed." });
  }
});

module.exports = router;
