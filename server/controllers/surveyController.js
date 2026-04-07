const admin = require("firebase-admin");

const db = () => admin.firestore();

// ── Helper: resolve event doc (dual lookup) ────────────────────────────────
async function resolveEventDoc(id) {
  let doc = await db().collection("events").doc(id).get();
  if (doc.exists) return doc;
  doc = await db().collection("hackathons").doc(id).get();
  if (doc.exists) return doc;
  return null;
}

// ── POST /api/hackathons/:id/surveys ───────────────────────────────────────
// Organizer creates a new survey for the event.
async function createSurvey(req, res) {
  try {
    const { id } = req.params;
    const { title, questions, triggerAfter } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "title is required." });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "questions array is required and must not be empty." });
    }

    const validTypes = ["text", "rating", "multiple_choice", "yes_no"];
    for (const q of questions) {
      if (!q.id || !q.text || !q.type) {
        return res.status(400).json({ error: "Each question needs id, text, and type." });
      }
      if (!validTypes.includes(q.type)) {
        return res.status(400).json({ error: `Invalid question type: ${q.type}` });
      }
      if (q.type === "multiple_choice" && (!Array.isArray(q.options) || q.options.length < 2)) {
        return res.status(400).json({ error: "Multiple choice questions need at least 2 options." });
      }
    }

    const eventDoc = await resolveEventDoc(id);
    if (!eventDoc) {
      return res.status(404).json({ error: "Event not found." });
    }

    // Verify ownership
    const eventData = eventDoc.data();
    if (eventData.organizerId !== req.uid) {
      return res.status(403).json({ error: "Only the event organizer can create surveys." });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const surveyData = {
      title: title.trim(),
      questions,
      triggerAfter: triggerAfter || "event_end",
      published: true,
      createdBy: req.uid,
      createdAt: now,
      updatedAt: now,
      responseCount: 0,
    };

    const surveyRef = await eventDoc.ref.collection("surveys").add(surveyData);

    return res.status(201).json({ id: surveyRef.id, ...surveyData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error("createSurvey error:", err);
    return res.status(500).json({ error: "Failed to create survey." });
  }
}

// ── GET /api/hackathons/:id/surveys ────────────────────────────────────────
// List surveys. Organizer sees all, Participant sees published only.
async function listSurveys(req, res) {
  try {
    const { id } = req.params;

    const eventDoc = await resolveEventDoc(id);
    if (!eventDoc) {
      return res.status(404).json({ error: "Event not found." });
    }

    let query = eventDoc.ref.collection("surveys");

    // Participants only see published surveys
    if (req.role === "Participant") {
      query = query.where("published", "==", true);
    }

    const snap = await query.get();
    const surveys = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return res.json({ surveys });
  } catch (err) {
    console.error("listSurveys error:", err);
    return res.status(500).json({ error: "Failed to list surveys." });
  }
}

// ── POST /api/hackathons/:id/surveys/:surveyId/respond ─────────────────────
// Participant submits a survey response. One response per user per survey.
async function submitResponse(req, res) {
  try {
    const { id, surveyId } = req.params;
    const { answers } = req.body;

    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ error: "answers object is required." });
    }

    const eventDoc = await resolveEventDoc(id);
    if (!eventDoc) {
      return res.status(404).json({ error: "Event not found." });
    }

    // Check survey exists
    const surveyDoc = await eventDoc.ref.collection("surveys").doc(surveyId).get();
    if (!surveyDoc.exists) {
      return res.status(404).json({ error: "Survey not found." });
    }

    // Check for duplicate response
    const existingSnap = await eventDoc.ref
      .collection("surveyResponses")
      .where("surveyId", "==", surveyId)
      .where("uid", "==", req.uid)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return res.status(409).json({ error: "You have already responded to this survey." });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const responseData = {
      surveyId,
      uid: req.uid,
      answers,
      submittedAt: now,
    };

    const responseRef = await eventDoc.ref.collection("surveyResponses").add(responseData);

    // Increment response count on the survey
    await surveyDoc.ref.update({
      responseCount: admin.firestore.FieldValue.increment(1),
    });

    return res.status(201).json({ id: responseRef.id, message: "Response submitted." });
  } catch (err) {
    console.error("submitResponse error:", err);
    return res.status(500).json({ error: "Failed to submit response." });
  }
}

// ── GET /api/hackathons/:id/surveys/:surveyId/results ──────────────────────
// Organizer gets all responses + aggregated stats.
async function getSurveyResults(req, res) {
  try {
    const { id, surveyId } = req.params;

    const eventDoc = await resolveEventDoc(id);
    if (!eventDoc) {
      return res.status(404).json({ error: "Event not found." });
    }

    // Get the survey for question metadata
    const surveyDoc = await eventDoc.ref.collection("surveys").doc(surveyId).get();
    if (!surveyDoc.exists) {
      return res.status(404).json({ error: "Survey not found." });
    }
    const survey = surveyDoc.data();

    // Get all responses
    const responsesSnap = await eventDoc.ref
      .collection("surveyResponses")
      .where("surveyId", "==", surveyId)
      .get();

    const responses = responsesSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // Aggregate stats per question
    const aggregated = {};
    for (const q of survey.questions) {
      const qStats = { questionId: q.id, type: q.type, text: q.text };

      if (q.type === "rating") {
        const values = responses
          .map((r) => Number(r.answers[q.id]))
          .filter((v) => !isNaN(v));
        qStats.average = values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : 0;
        qStats.count = values.length;
      } else if (q.type === "multiple_choice" || q.type === "yes_no") {
        const counts = {};
        responses.forEach((r) => {
          const val = r.answers[q.id];
          if (val !== undefined) {
            counts[val] = (counts[val] || 0) + 1;
          }
        });
        qStats.optionCounts = counts;
        qStats.count = Object.values(counts).reduce((a, b) => a + b, 0);
      } else {
        // text — just count
        qStats.count = responses.filter((r) => r.answers[q.id]).length;
      }

      aggregated[q.id] = qStats;
    }

    return res.json({
      survey: { id: surveyId, title: survey.title, questions: survey.questions },
      responses,
      aggregated,
      totalResponses: responses.length,
    });
  } catch (err) {
    console.error("getSurveyResults error:", err);
    return res.status(500).json({ error: "Failed to fetch survey results." });
  }
}

module.exports = {
  createSurvey,
  listSurveys,
  submitResponse,
  getSurveyResults,
};
