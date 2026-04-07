const admin = require("firebase-admin");
const db = () => admin.firestore();
const eventsCol = () => db().collection("events");

async function getEventDoc(id) {
  let snap = await eventsCol().doc(id).get();
  if (snap.exists) return snap;
  return db().collection("hackathons").doc(id).get();
}

// GET /:id/legacy — public legacy page data
async function getLegacyData(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Event not found." });
    const event = hSnap.data();

    // Aggregate data for legacy page
    const [regsSnap, teamsSnap, subsSnap, scoresSnap] = await Promise.all([
      eventsCol().doc(id).collection("registrations").get(),
      eventsCol().doc(id).collection("teams").get(),
      eventsCol().doc(id).collection("submissions").orderBy("totalScore", "desc").limit(20).get(),
      eventsCol().doc(id).collection("scores").get(),
    ]);

    const submissions = subsSnap.docs.map((d, i) => ({
      rank: i + 1,
      id: d.id,
      projectName: d.data().projectName,
      description: d.data().description,
      teamId: d.data().teamId,
      totalScore: d.data().totalScore,
      demoUrl: d.data().demoUrl,
      githubUrl: d.data().githubUrl,
      techStack: d.data().techStack || [],
      voteCount: d.data().voteCount || 0,
    }));

    return res.json({
      event: {
        title: event.title || event.name,
        description: event.description,
        tagline: event.tagline,
        schedule: event.schedule,
        tracks: event.tracks || [],
        prizes: event.prizes || [],
        branding: event.branding || {},
        status: event.status,
      },
      stats: {
        registrations: regsSnap.size,
        teams: teamsSnap.size,
        submissions: subsSnap.size,
        scores: scoresSnap.size,
      },
      winners: submissions.slice(0, 3),
      allProjects: submissions,
    });
  } catch (err) {
    console.error("getLegacyData error:", err);
    return res.status(500).json({ error: "Failed to get legacy data." });
  }
}

// POST /:id/clone — clone event as template for a new hackathon
async function cloneAsTemplate(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Event not found." });
    const event = hSnap.data();

    if (event.organizerId !== req.uid) return res.status(403).json({ error: "Not authorized." });

    const now = admin.firestore.FieldValue.serverTimestamp();

    // Clone the event with reset fields
    const cloneData = {
      ...event,
      title: `${event.title || event.name} (Copy)`,
      name: `${event.title || event.name} (Copy)`,
      slug: `${event.slug || ""}-copy-${Date.now().toString(36)}`,
      status: "draft",
      isPublic: false,
      registrationCount: 0,
      teamCount: 0,
      // Reset schedule dates
      schedule: {
        registrationOpen: "",
        registrationClose: "",
        submissionDeadline: "",
        judgingStart: "",
        judgingEnd: "",
      },
      // Reset workback
      workbackSchedule: [],
      createdAt: now,
      updatedAt: now,
    };

    // Remove server-generated fields
    delete cloneData.createdAt_original;

    const ref = await eventsCol().add(cloneData);

    // Also clone to hackathons if it's a hackathon type
    if (event.eventType === "hackathon") {
      await db().collection("hackathons").doc(ref.id).set(cloneData);
    }

    return res.status(201).json({ id: ref.id, message: "Event cloned as template.", title: cloneData.title });
  } catch (err) {
    console.error("cloneAsTemplate error:", err);
    return res.status(500).json({ error: "Failed to clone event." });
  }
}

module.exports = { getLegacyData, cloneAsTemplate };
