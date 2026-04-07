const admin = require("firebase-admin");

const db = () => admin.firestore();
const eventsCol = () => db().collection("events");
const hackathonsCol = () => db().collection("hackathons");

async function getEventDoc(id) {
  let snap = await eventsCol().doc(id).get();
  if (snap.exists) return snap;
  return hackathonsCol().doc(id).get();
}

function scoresCol(eventId) {
  return eventsCol().doc(eventId).collection("scores");
}

function submissionsCol(eventId) {
  return eventsCol().doc(eventId).collection("submissions");
}

// ── POST /api/hackathons/:id/scores ─────────────────────────────────────────

async function submitScore(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const { submissionId, criteriaScores, feedback } = req.body;

    if (!submissionId) return res.status(400).json({ error: "submissionId is required." });
    if (!criteriaScores || typeof criteriaScores !== "object") {
      return res.status(400).json({ error: "criteriaScores object is required." });
    }

    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });

    const hackathon = hSnap.data();
    if (hackathon.status !== "judging") {
      return res.status(400).json({ error: "Judging is not active for this hackathon." });
    }

    // Verify submission exists
    const subSnap = await submissionsCol(id).doc(submissionId).get();
    if (!subSnap.exists) return res.status(404).json({ error: "Submission not found." });

    // Check if judge already scored this submission
    const existingScore = await scoresCol(id)
      .where("judgeId", "==", req.uid)
      .where("submissionId", "==", submissionId)
      .limit(1)
      .get();

    // Calculate weighted total
    const criteria = hackathon.judgingCriteria || [];
    let totalScore = 0;
    let totalWeight = 0;
    for (const c of criteria) {
      const score = criteriaScores[c.name];
      if (score !== undefined && score !== null) {
        totalScore += (Number(score) / (c.maxScore || 5)) * (c.weight || 0);
        totalWeight += c.weight || 0;
      }
    }
    const normalizedScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;

    const now = admin.firestore.FieldValue.serverTimestamp();
    const scoreData = {
      judgeId: req.uid,
      judgeEmail: req.email,
      hackathonId: id,
      submissionId,
      criteriaScores,
      totalScore: Math.round(normalizedScore * 100) / 100,
      feedback: feedback || "",
      scoredAt: now,
    };

    if (!existingScore.empty) {
      // Update existing score
      const scoreDoc = existingScore.docs[0];
      await scoresCol(id).doc(scoreDoc.id).update(scoreData);
    } else {
      await scoresCol(id).add(scoreData);
    }

    // Recalculate submission's average score
    const allScores = await scoresCol(id)
      .where("submissionId", "==", submissionId)
      .get();

    const scores = allScores.docs.map((d) => d.data().totalScore);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

    await submissionsCol(id).doc(submissionId).update({
      totalScore: Math.round(avg * 100) / 100,
      status: "under_review",
    });

    return res.json({ message: "Score submitted.", totalScore: normalizedScore });
  } catch (err) {
    console.error("submitScore error:", err);
    return res.status(500).json({ error: "Failed to submit score." });
  }
}

// ── GET /api/hackathons/:id/scores/mine ─────────────────────────────────────

async function getMyScores(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const snap = await scoresCol(id)
      .where("judgeId", "==", req.uid)
      .get();

    const scores = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json({ data: scores });
  } catch (err) {
    console.error("getMyScores error:", err);
    return res.status(500).json({ error: "Failed to get scores." });
  }
}

// ── GET /api/hackathons/:id/scores ──────────────────────────────────────────

async function listAllScores(req, res) {
  try {
    const id = req.params.id || req.params.eventId;

    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });
    if (hSnap.data().organizerId !== req.uid) {
      return res.status(403).json({ error: "You do not own this hackathon." });
    }

    const snap = await scoresCol(id).orderBy("scoredAt", "desc").get();
    const scores = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json({ data: scores });
  } catch (err) {
    console.error("listAllScores error:", err);
    return res.status(500).json({ error: "Failed to list scores." });
  }
}

// ── GET /api/hackathons/:id/leaderboard ─────────────────────────────────────

async function getLeaderboard(req, res) {
  try {
    const id = req.params.id || req.params.eventId;

    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });

    const snap = await submissionsCol(id)
      .where("status", "in", ["under_review", "submitted", "evaluated"])
      .orderBy("totalScore", "desc")
      .get();

    const leaderboard = snap.docs.map((d, i) => ({
      rank: i + 1,
      id: d.id,
      ...d.data(),
    }));

    return res.json({ data: leaderboard });
  } catch (err) {
    console.error("getLeaderboard error:", err);
    return res.status(500).json({ error: "Failed to get leaderboard." });
  }
}

module.exports = { submitScore, getMyScores, listAllScores, getLeaderboard };
