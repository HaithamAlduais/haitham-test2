const admin = require("firebase-admin");
const db = () => admin.firestore();
const eventsCol = () => db().collection("events");

// Dual lookup
async function getEventDoc(id) {
  let snap = await eventsCol().doc(id).get();
  if (snap.exists) return snap;
  return db().collection("hackathons").doc(id).get();
}

function certificatesCol(eventId) {
  return eventsCol().doc(eventId).collection("certificates");
}

// POST /api/hackathons/:id/certificates/generate
// Organizer generates certificates for all accepted participants
async function generateCertificates(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Event not found." });
    const event = hSnap.data();
    if (event.organizerId !== req.uid) return res.status(403).json({ error: "Not authorized." });

    // Get all accepted registrations
    const regsSnap = await eventsCol().doc(id).collection("registrations")
      .where("status", "==", "accepted").get();

    if (regsSnap.empty) return res.status(400).json({ error: "No accepted participants to certify." });

    // Get submissions to check winners
    const subsSnap = await eventsCol().doc(id).collection("submissions").get();
    const submissions = {};
    subsSnap.docs.forEach(d => { submissions[d.data().submitterId] = d.data(); });

    const batch = db().batch();
    let count = 0;
    const now = admin.firestore.FieldValue.serverTimestamp();

    for (const regDoc of regsSnap.docs) {
      const reg = regDoc.data();
      const certId = `cert_${reg.userId}`;

      // Determine certificate type based on submission scores
      const sub = submissions[reg.userId];
      let certType = "participation"; // default
      let rank = null;

      if (sub && sub.totalScore) {
        if (sub.totalScore >= 90) certType = "winner_gold";
        else if (sub.totalScore >= 80) certType = "winner_silver";
        else if (sub.totalScore >= 70) certType = "winner_bronze";
        else certType = "participation";
      }

      const certData = {
        recipientId: reg.userId,
        recipientEmail: reg.userEmail,
        recipientName: reg.formResponses?.name || reg.userEmail,
        eventId: id,
        eventTitle: event.title || event.name,
        type: certType,
        rank,
        issuedAt: now,
        metadata: {
          organizerName: event.organizerId,
          eventDates: event.schedule || {},
          tracks: event.tracks || [],
        },
      };

      batch.set(certificatesCol(id).doc(certId), certData);
      count++;
    }

    await batch.commit();
    return res.json({ message: `Generated ${count} certificates.`, count });
  } catch (err) {
    console.error("generateCertificates error:", err);
    return res.status(500).json({ error: "Failed to generate certificates." });
  }
}

// GET /api/hackathons/:id/certificates
async function listCertificates(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const snap = await certificatesCol(id).orderBy("issuedAt", "desc").get();
    const certs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ data: certs });
  } catch (err) {
    console.error("listCertificates error:", err);
    return res.status(500).json({ error: "Failed to list certificates." });
  }
}

// GET /api/hackathons/:id/certificates/mine
async function getMyCertificate(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const certId = `cert_${req.uid}`;
    const snap = await certificatesCol(id).doc(certId).get();
    if (!snap.exists) return res.status(404).json({ error: "No certificate found." });
    return res.json({ id: snap.id, ...snap.data() });
  } catch (err) {
    console.error("getMyCertificate error:", err);
    return res.status(500).json({ error: "Failed to get certificate." });
  }
}

module.exports = { generateCertificates, listCertificates, getMyCertificate };
