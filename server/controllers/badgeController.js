const admin = require("firebase-admin");
const db = () => admin.firestore();

const BADGE_TYPES = {
  PARTICIPATION: { key: "participation", label: "Participant", icon: "\uD83C\uDFAF", color: "#6366f1" },
  WINNER_1ST: { key: "winner_1st", label: "1st Place", icon: "\uD83E\uDD47", color: "#FFD700" },
  WINNER_2ND: { key: "winner_2nd", label: "2nd Place", icon: "\uD83E\uDD48", color: "#C0C0C0" },
  WINNER_3RD: { key: "winner_3rd", label: "3rd Place", icon: "\uD83E\uDD49", color: "#CD7F32" },
  POPULAR_CHOICE: { key: "popular_choice", label: "Popular Choice", icon: "\u2764\uFE0F", color: "#ef4444" },
  BEST_DESIGN: { key: "best_design", label: "Best Design", icon: "\uD83C\uDFA8", color: "#8b5cf6" },
  MOST_INNOVATIVE: { key: "most_innovative", label: "Most Innovative", icon: "\uD83D\uDCA1", color: "#eab308" },
  TRACK_WINNER: { key: "track_winner", label: "Track Winner", icon: "\uD83C\uDFC6", color: "#22c55e" },
  JUDGE: { key: "judge", label: "Judge", icon: "\u2696\uFE0F", color: "#0ea5e9" },
};

function userBadgesCol(userId) {
  return db().collection("users").doc(userId).collection("badges");
}

// POST /api/hackathons/:id/badges/award
async function awardBadge(req, res) {
  try {
    const eventId = req.params.id || req.params.eventId;
    const { recipientId, badgeType, customLabel } = req.body;

    if (!recipientId) return res.status(400).json({ error: "recipientId required." });

    const badgeInfo = BADGE_TYPES[badgeType?.toUpperCase()] || {
      key: badgeType || "custom",
      label: customLabel || badgeType || "Achievement",
      icon: "\u2B50",
      color: "#7C3AED",
    };

    const now = admin.firestore.FieldValue.serverTimestamp();
    const badgeData = {
      ...badgeInfo,
      eventId,
      awardedBy: req.uid,
      awardedAt: now,
    };

    // Use eventId + badgeType as doc ID to prevent duplicates
    const badgeDocId = `${eventId}_${badgeInfo.key}`;
    await userBadgesCol(recipientId).doc(badgeDocId).set(badgeData);

    return res.status(201).json({ id: badgeDocId, recipientId, ...badgeData });
  } catch (err) {
    console.error("awardBadge error:", err);
    return res.status(500).json({ error: "Failed to award badge." });
  }
}

// POST /api/hackathons/:id/badges/award-all
// Batch award participation badges to all accepted participants
async function awardAllParticipationBadges(req, res) {
  try {
    const eventId = req.params.id || req.params.eventId;

    // Get event info
    let hSnap = await db().collection("events").doc(eventId).get();
    if (!hSnap.exists) hSnap = await db().collection("hackathons").doc(eventId).get();
    if (!hSnap.exists) return res.status(404).json({ error: "Event not found." });
    const event = hSnap.data();
    if (event.organizerId !== req.uid) return res.status(403).json({ error: "Not authorized." });

    const regsSnap = await db().collection("events").doc(eventId)
      .collection("registrations").where("status", "==", "accepted").get();

    const batch = db().batch();
    let count = 0;
    const now = admin.firestore.FieldValue.serverTimestamp();

    for (const regDoc of regsSnap.docs) {
      const reg = regDoc.data();
      const badgeDocId = `${eventId}_participation`;
      const ref = userBadgesCol(reg.userId).doc(badgeDocId);

      batch.set(ref, {
        ...BADGE_TYPES.PARTICIPATION,
        eventId,
        eventTitle: event.title || event.name,
        awardedBy: req.uid,
        awardedAt: now,
      });
      count++;
    }

    await batch.commit();
    return res.json({ message: `Awarded ${count} participation badges.`, count });
  } catch (err) {
    console.error("awardAllParticipationBadges error:", err);
    return res.status(500).json({ error: "Failed to award badges." });
  }
}

// GET /api/users/:userId/badges (or /api/badges/mine)
async function listUserBadges(req, res) {
  try {
    const userId = req.params.userId || req.uid;
    const snap = await userBadgesCol(userId).orderBy("awardedAt", "desc").get();
    const badges = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ data: badges });
  } catch (err) {
    console.error("listUserBadges error:", err);
    return res.status(500).json({ error: "Failed to list badges." });
  }
}

module.exports = { awardBadge, awardAllParticipationBadges, listUserBadges, BADGE_TYPES };
