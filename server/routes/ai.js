const express = require("express");
const admin = require("firebase-admin");
const requireRole = require("../middleware/requireRole");
const { screenApplication, screenTeam } = require("../services/aiScreening");

const db = () => admin.firestore();
const hackathonsCol = () => db().collection("hackathons");

const router = express.Router({ mergeParams: true });

// ── POST /api/hackathons/:id/ai/screen-registration/:regId ──────────────────
// Organizer triggers AI screening for a specific registration

router.post("/ai/screen-registration/:regId", requireRole("Organizer"), async (req, res) => {
  try {
    const { id, regId } = req.params;

    const hSnap = await hackathonsCol().doc(id).get();
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });
    if (hSnap.data().organizerId !== req.uid) {
      return res.status(403).json({ error: "Not authorized." });
    }

    const regSnap = await hackathonsCol().doc(id).collection("registrations").doc(regId).get();
    if (!regSnap.exists) return res.status(404).json({ error: "Registration not found." });

    const result = await screenApplication({
      hackathon: hSnap.data(),
      registration: regSnap.data(),
      userEmail: regSnap.data().userEmail || "",
    });

    // Save AI score to registration
    await hackathonsCol().doc(id).collection("registrations").doc(regId).update({
      aiScore: result.score,
      aiReasoning: result.reasoning,
      aiRecommendation: result.recommendation,
    });

    return res.json(result);
  } catch (err) {
    console.error("AI screen registration error:", err);
    return res.status(500).json({ error: "AI screening failed." });
  }
});

// ── POST /api/hackathons/:id/ai/screen-all-registrations ────────────────────
// Batch screen all pending registrations

router.post("/ai/screen-all-registrations", requireRole("Organizer"), async (req, res) => {
  try {
    const { id } = req.params;

    const hSnap = await hackathonsCol().doc(id).get();
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });
    if (hSnap.data().organizerId !== req.uid) {
      return res.status(403).json({ error: "Not authorized." });
    }

    const regsSnap = await hackathonsCol().doc(id).collection("registrations")
      .where("status", "==", "pending")
      .where("aiScore", "==", null)
      .limit(20)
      .get();

    if (regsSnap.empty) {
      return res.json({ message: "No pending registrations to screen.", screened: 0 });
    }

    const results = [];
    for (const doc of regsSnap.docs) {
      const result = await screenApplication({
        hackathon: hSnap.data(),
        registration: doc.data(),
        userEmail: doc.data().userEmail || "",
      });

      await hackathonsCol().doc(id).collection("registrations").doc(doc.id).update({
        aiScore: result.score,
        aiReasoning: result.reasoning,
        aiRecommendation: result.recommendation,
      });

      results.push({ regId: doc.id, ...result });
    }

    return res.json({ message: `Screened ${results.length} registrations.`, screened: results.length, results });
  } catch (err) {
    console.error("AI batch screen error:", err);
    return res.status(500).json({ error: "Batch screening failed." });
  }
});

// ── POST /api/hackathons/:id/ai/screen-team/:teamId ─────────────────────────

router.post("/ai/screen-team/:teamId", requireRole("Organizer"), async (req, res) => {
  try {
    const { id, teamId } = req.params;

    const hSnap = await hackathonsCol().doc(id).get();
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });
    if (hSnap.data().organizerId !== req.uid) {
      return res.status(403).json({ error: "Not authorized." });
    }

    const teamSnap = await hackathonsCol().doc(id).collection("teams").doc(teamId).get();
    if (!teamSnap.exists) return res.status(404).json({ error: "Team not found." });

    const membersSnap = await hackathonsCol().doc(id).collection("teams").doc(teamId).collection("members").get();
    const members = membersSnap.docs.map(d => d.data());

    const result = await screenTeam({
      hackathon: hSnap.data(),
      team: teamSnap.data(),
      members,
    });

    await hackathonsCol().doc(id).collection("teams").doc(teamId).update({
      aiScore: result.score,
      aiReasoning: result.reasoning,
      aiRecommendation: result.recommendation,
    });

    return res.json(result);
  } catch (err) {
    console.error("AI screen team error:", err);
    return res.status(500).json({ error: "Team screening failed." });
  }
});

module.exports = router;
