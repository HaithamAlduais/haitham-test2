const admin = require("firebase-admin");
const db = () => admin.firestore();
const eventsCol = () => db().collection("events");

async function getEventDoc(id) {
  let snap = await eventsCol().doc(id).get();
  if (snap.exists) return snap;
  return db().collection("hackathons").doc(id).get();
}

function submissionsCol(eventId) {
  return eventsCol().doc(eventId).collection("submissions");
}

// PATCH /:id/submissions/:subId/eligibility
async function checkEligibility(req, res) {
  try {
    const { id, subId } = req.params;
    const { status, criteria, reason } = req.body;

    if (!["eligible", "ineligible", "needs_review"].includes(status)) {
      return res.status(400).json({ error: "status must be eligible, ineligible, or needs_review." });
    }

    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Event not found." });
    if (hSnap.data().organizerId !== req.uid) return res.status(403).json({ error: "Not authorized." });

    await submissionsCol(id).doc(subId).update({
      eligibility: {
        status,
        checkedBy: req.uid,
        checkedAt: admin.firestore.FieldValue.serverTimestamp(),
        criteria: Array.isArray(criteria) ? criteria : [],
        reason: reason || "",
      },
    });

    return res.json({ message: `Submission marked as ${status}.` });
  } catch (err) {
    console.error("checkEligibility error:", err);
    return res.status(500).json({ error: "Failed to check eligibility." });
  }
}

// GET /:id/submissions/eligibility-summary
async function eligibilitySummary(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const snap = await submissionsCol(id).get();

    let eligible = 0, ineligible = 0, needsReview = 0, unchecked = 0;
    snap.docs.forEach(d => {
      const e = d.data().eligibility;
      if (!e) unchecked++;
      else if (e.status === "eligible") eligible++;
      else if (e.status === "ineligible") ineligible++;
      else needsReview++;
    });

    return res.json({ total: snap.size, eligible, ineligible, needsReview, unchecked });
  } catch (err) {
    console.error("eligibilitySummary error:", err);
    return res.status(500).json({ error: "Failed to get summary." });
  }
}

module.exports = { checkEligibility, eligibilitySummary };
