const admin = require("firebase-admin");

const db = () => admin.firestore();
const eventsCol = () => db().collection("events");
const hackathonsCol = () => db().collection("hackathons");

async function getEventDoc(id) {
  let snap = await eventsCol().doc(id).get();
  if (snap.exists) return snap;
  return hackathonsCol().doc(id).get();
}

function votesCol(eventId) {
  return eventsCol().doc(eventId).collection("votes");
}

function submissionsCol(eventId) {
  return eventsCol().doc(eventId).collection("submissions");
}

// ── POST /api/hackathons/:id/votes ─────────────────────────────────────────
// Cast a vote — 1 per user per hackathon (transactional)

async function castVote(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const { submissionId } = req.body;

    if (!submissionId) {
      return res.status(400).json({ error: "submissionId is required." });
    }

    // Verify hackathon exists
    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });

    // Verify submission exists
    const subSnap = await submissionsCol(id).doc(submissionId).get();
    if (!subSnap.exists) return res.status(404).json({ error: "Submission not found." });

    // Use transaction to prevent duplicate votes
    const voteDocId = `${req.uid}_${id}`; // one vote per user per hackathon
    const voteRef = votesCol(id).doc(voteDocId);

    await db().runTransaction(async (tx) => {
      const existingVote = await tx.get(voteRef);

      if (existingVote.exists) {
        const oldSubmissionId = existingVote.data().submissionId;

        if (oldSubmissionId === submissionId) {
          throw new Error("ALREADY_VOTED_SAME");
        }

        // Change vote: decrement old, increment new
        const oldSubRef = submissionsCol(id).doc(oldSubmissionId);
        tx.update(oldSubRef, { voteCount: admin.firestore.FieldValue.increment(-1) });
        tx.update(submissionsCol(id).doc(submissionId), { voteCount: admin.firestore.FieldValue.increment(1) });
        tx.update(voteRef, {
          submissionId,
          votedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // New vote
        tx.set(voteRef, {
          voterId: req.uid,
          voterEmail: req.email,
          hackathonId: id,
          submissionId,
          votedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        tx.update(submissionsCol(id).doc(submissionId), {
          voteCount: admin.firestore.FieldValue.increment(1),
        });
      }
    });

    return res.json({ message: "Vote recorded.", submissionId });
  } catch (err) {
    if (err.message === "ALREADY_VOTED_SAME") {
      return res.status(409).json({ error: "You already voted for this project." });
    }
    console.error("castVote error:", err);
    return res.status(500).json({ error: "Failed to cast vote." });
  }
}

// ── GET /api/hackathons/:id/votes/results ──────────────────────────────────

async function getVoteResults(req, res) {
  try {
    const id = req.params.id || req.params.eventId;

    // Get all submissions with voteCount
    const snap = await submissionsCol(id)
      .where("status", "in", ["submitted", "under_review", "evaluated"])
      .get();

    const results = snap.docs
      .map((d) => ({
        submissionId: d.id,
        projectName: d.data().projectName,
        teamId: d.data().teamId,
        voteCount: d.data().voteCount || 0,
      }))
      .sort((a, b) => b.voteCount - a.voteCount);

    return res.json({ data: results });
  } catch (err) {
    console.error("getVoteResults error:", err);
    return res.status(500).json({ error: "Failed to get vote results." });
  }
}

// ── GET /api/hackathons/:id/votes/mine ─────────────────────────────────────

async function getMyVote(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const voteDocId = `${req.uid}_${id}`;
    const snap = await votesCol(id).doc(voteDocId).get();

    if (!snap.exists) {
      return res.json({ voted: false });
    }

    return res.json({ voted: true, ...snap.data() });
  } catch (err) {
    console.error("getMyVote error:", err);
    return res.status(500).json({ error: "Failed to get vote." });
  }
}

module.exports = { castVote, getVoteResults, getMyVote };
