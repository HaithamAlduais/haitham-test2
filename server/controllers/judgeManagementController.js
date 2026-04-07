const admin = require("firebase-admin");
const db = () => admin.firestore();
const eventsCol = () => db().collection("events");

async function getEventDoc(id) {
  let snap = await eventsCol().doc(id).get();
  if (snap.exists) return snap;
  return db().collection("hackathons").doc(id).get();
}

function judgeAssignmentsCol(eventId) {
  return eventsCol().doc(eventId).collection("judgeAssignments");
}

// POST /:id/judges/invite — invite a judge by email
async function inviteJudge(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const { judgeEmail, judgeName } = req.body;
    if (!judgeEmail) return res.status(400).json({ error: "judgeEmail required." });

    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Event not found." });
    if (hSnap.data().organizerId !== req.uid) return res.status(403).json({ error: "Not authorized." });

    // Check duplicate
    const existing = await judgeAssignmentsCol(id).where("judgeEmail", "==", judgeEmail).limit(1).get();
    if (!existing.empty) return res.status(409).json({ error: "Judge already invited." });

    const now = admin.firestore.FieldValue.serverTimestamp();
    const data = {
      judgeEmail,
      judgeName: judgeName || "",
      judgeUid: null, // filled when judge accepts
      assignedSubmissions: [],
      inviteStatus: "pending", // pending, accepted, declined
      invitedAt: now,
      hackathonId: id,
    };

    const ref = await judgeAssignmentsCol(id).add(data);
    return res.status(201).json({ id: ref.id, ...data });
  } catch (err) {
    console.error("inviteJudge error:", err);
    return res.status(500).json({ error: "Failed to invite judge." });
  }
}

// GET /:id/judges — list all judge assignments
async function listJudges(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const snap = await judgeAssignmentsCol(id).orderBy("invitedAt", "desc").get();
    const judges = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ data: judges });
  } catch (err) {
    console.error("listJudges error:", err);
    return res.status(500).json({ error: "Failed to list judges." });
  }
}

// PATCH /:id/judges/:judgeAssignmentId/assign — assign submissions to a judge
async function assignSubmissions(req, res) {
  try {
    const { id, judgeAssignmentId } = req.params;
    const { submissionIds } = req.body;
    if (!Array.isArray(submissionIds)) return res.status(400).json({ error: "submissionIds array required." });

    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Event not found." });
    if (hSnap.data().organizerId !== req.uid) return res.status(403).json({ error: "Not authorized." });

    await judgeAssignmentsCol(id).doc(judgeAssignmentId).update({
      assignedSubmissions: submissionIds,
    });

    return res.json({ message: "Submissions assigned to judge." });
  } catch (err) {
    console.error("assignSubmissions error:", err);
    return res.status(500).json({ error: "Failed to assign submissions." });
  }
}

// POST /:id/judges/accept — judge accepts invitation (self-service)
async function acceptInvitation(req, res) {
  try {
    const id = req.params.id || req.params.eventId;

    // Find assignment by this user's email
    const snap = await judgeAssignmentsCol(id).where("judgeEmail", "==", req.email).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: "No invitation found for your email." });

    const doc = snap.docs[0];
    await judgeAssignmentsCol(id).doc(doc.id).update({
      judgeUid: req.uid,
      inviteStatus: "accepted",
    });

    return res.json({ message: "Invitation accepted." });
  } catch (err) {
    console.error("acceptInvitation error:", err);
    return res.status(500).json({ error: "Failed to accept invitation." });
  }
}

// POST /:id/judges/remind — send reminder to judges who haven't finished
async function sendReminders(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Event not found." });
    if (hSnap.data().organizerId !== req.uid) return res.status(403).json({ error: "Not authorized." });

    const snap = await judgeAssignmentsCol(id).where("inviteStatus", "==", "accepted").get();

    // Check which judges have incomplete scoring
    const scoresSnap = await eventsCol().doc(id).collection("scores").get();
    const scoredBy = new Set(scoresSnap.docs.map(d => d.data().judgeId || d.data().judgeUid));

    const needsReminder = snap.docs
      .filter(d => d.data().judgeUid && !scoredBy.has(d.data().judgeUid))
      .map(d => ({ id: d.id, email: d.data().judgeEmail, name: d.data().judgeName }));

    // In a real system, send emails here. For now, mark as reminded.
    const batch = db().batch();
    needsReminder.forEach(j => {
      batch.update(judgeAssignmentsCol(id).doc(j.id), {
        lastRemindedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    await batch.commit();

    return res.json({ message: `${needsReminder.length} judges need reminders.`, judges: needsReminder });
  } catch (err) {
    console.error("sendReminders error:", err);
    return res.status(500).json({ error: "Failed to send reminders." });
  }
}

module.exports = { inviteJudge, listJudges, assignSubmissions, acceptInvitation, sendReminders };
