const admin = require("firebase-admin");
const { SUBMISSION_STATUS } = require("../lib/constants");

const db = () => admin.firestore();
const eventsCol = () => db().collection("events");
const hackathonsCol = () => db().collection("hackathons");

async function getEventDoc(id) {
  let snap = await eventsCol().doc(id).get();
  if (snap.exists) return snap;
  return hackathonsCol().doc(id).get();
}

function submissionsCol(eventId) {
  return eventsCol().doc(eventId).collection("submissions");
}

// ── POST /api/hackathons/:id/submissions ────────────────────────────────────

async function createSubmission(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const { teamId, projectName, description, githubUrl, demoUrl, videoUrl, techStack } = req.body;

    if (!projectName || typeof projectName !== "string" || !projectName.trim()) {
      return res.status(400).json({ error: "Project name is required." });
    }

    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });

    const hackathon = hSnap.data();
    if (!["active"].includes(hackathon.status)) {
      return res.status(400).json({ error: "Submissions are not open." });
    }

    // Check deadline
    if (hackathon.schedule?.submissionDeadline) {
      const deadline = new Date(hackathon.schedule.submissionDeadline);
      if (new Date() > deadline) {
        return res.status(400).json({ error: "Submission deadline has passed." });
      }
    }

    // Check for existing submission from this team
    if (teamId) {
      const existing = await submissionsCol(id).where("teamId", "==", teamId).limit(1).get();
      if (!existing.empty) {
        return res.status(409).json({ error: "This team already has a submission. Edit the existing one." });
      }
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    const subData = {
      hackathonId: id,
      teamId: teamId || null,
      submitterId: req.uid,
      submitterEmail: req.email,
      projectName: projectName.trim(),
      description: description ? String(description).trim() : "",
      githubUrl: githubUrl || "",
      demoUrl: demoUrl || "",
      videoUrl: videoUrl || "",
      files: [],
      techStack: Array.isArray(techStack) ? techStack : [],
      status: SUBMISSION_STATUS.DRAFT,
      totalScore: null,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await submissionsCol(id).add(subData);
    return res.status(201).json({ id: docRef.id, ...subData, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error("createSubmission error:", err);
    return res.status(500).json({ error: "Failed to create submission." });
  }
}

// ── PATCH /api/hackathons/:id/submissions/:subId ────────────────────────────

async function updateSubmission(req, res) {
  try {
    const { id, subId } = req.params;
    const updates = { ...req.body };

    const ref = submissionsCol(id).doc(subId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Submission not found." });

    const sub = snap.data();
    if (sub.submitterId !== req.uid) {
      return res.status(403).json({ error: "You do not own this submission." });
    }
    if (sub.status === SUBMISSION_STATUS.EVALUATED) {
      return res.status(400).json({ error: "Cannot edit an evaluated submission." });
    }

    delete updates.submitterId;
    delete updates.hackathonId;
    delete updates.teamId;
    delete updates.totalScore;

    await ref.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ message: "Submission updated." });
  } catch (err) {
    console.error("updateSubmission error:", err);
    return res.status(500).json({ error: "Failed to update submission." });
  }
}

// ── POST /api/hackathons/:id/submissions/:subId/submit ──────────────────────

async function finalizeSubmission(req, res) {
  try {
    const { id, subId } = req.params;

    const ref = submissionsCol(id).doc(subId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Submission not found." });

    const sub = snap.data();
    if (sub.submitterId !== req.uid) {
      return res.status(403).json({ error: "You do not own this submission." });
    }

    await ref.update({
      status: SUBMISSION_STATUS.SUBMITTED,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ message: "Submission finalized." });
  } catch (err) {
    console.error("finalizeSubmission error:", err);
    return res.status(500).json({ error: "Failed to finalize submission." });
  }
}

// ── GET /api/hackathons/:id/submissions/mine ────────────────────────────────

async function getMySubmission(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const snap = await submissionsCol(id)
      .where("submitterId", "==", req.uid)
      .limit(1)
      .get();

    if (snap.empty) return res.json({ submitted: false });
    const doc = snap.docs[0];
    return res.json({ submitted: true, id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("getMySubmission error:", err);
    return res.status(500).json({ error: "Failed to check submission." });
  }
}

// ── GET /api/hackathons/:id/submissions ──────────────────────────────────────

async function listSubmissions(req, res) {
  try {
    const id = req.params.id || req.params.eventId;

    // Verify ownership
    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });
    if (hSnap.data().organizerId !== req.uid) {
      return res.status(403).json({ error: "You do not own this hackathon." });
    }

    const snap = await submissionsCol(id).orderBy("createdAt", "desc").get();
    const submissions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json({ data: submissions });
  } catch (err) {
    console.error("listSubmissions error:", err);
    return res.status(500).json({ error: "Failed to list submissions." });
  }
}

module.exports = {
  createSubmission,
  updateSubmission,
  finalizeSubmission,
  getMySubmission,
  listSubmissions,
};
