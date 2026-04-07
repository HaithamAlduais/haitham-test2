const { admin, db, auth } = require("../lib/firebase");

// Lazy collection accessor
const usersCol = () => db().collection("users");

// ── GET /api/users/profile ──────────────────────────────────────────────────

async function getProfile(req, res) {
  try {
    const userDoc = await usersCol().doc(req.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const data = userDoc.data();
    return res.json({
      uid: req.uid,
      email: req.email,
      displayName: data.displayName || null,
      role: data.role,
      roles: data.roles || [],
      avatarUrl: data.avatarUrl || null,
      bio: data.bio || null,
      phone: data.phone || null,
      location: data.location || null,
      skills: data.skills || [],
      interests: data.interests || [],
      education: data.education || null,
      professional: data.professional || null,
      social: data.social || null,
      profileCompleteness: data.profileCompleteness || 0,
      createdAt: data.createdAt || null,
    });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ error: "Failed to fetch profile." });
  }
}

// ── PATCH /api/users/profile ────────────────────────────────────────────────

/** Allowed top-level string fields. */
const STRING_FIELDS = ["displayName", "bio", "phone", "location"];

/** Compute profile completeness percentage (0-100). */
function computeCompleteness(data) {
  const checks = [
    !!data.displayName,
    !!data.bio,
    Array.isArray(data.skills) && data.skills.length > 0,
    !!data.education?.institution,
    !!data.professional?.title,
    !!data.social?.github || !!data.social?.linkedin,
    !!data.avatarUrl,
    !!data.phone,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

async function updateProfile(req, res) {
  try {
    const { displayName, bio, phone, location, skills, interests, education, professional, social } = req.body;

    const updates = {};

    // String fields
    for (const field of STRING_FIELDS) {
      const val = req.body[field];
      if (val !== undefined) {
        updates[field] = typeof val === "string" ? val.trim() : "";
      }
    }

    // Array fields
    if (skills !== undefined) updates.skills = Array.isArray(skills) ? skills : [];
    if (interests !== undefined) updates.interests = Array.isArray(interests) ? interests : [];

    // Object fields
    if (education !== undefined) updates.education = education || {};
    if (professional !== undefined) updates.professional = professional || {};
    if (social !== undefined) updates.social = social || {};

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update." });
    }

    // Fetch current doc to merge and compute completeness
    const currentDoc = await usersCol().doc(req.uid).get();
    const merged = { ...(currentDoc.exists ? currentDoc.data() : {}), ...updates };
    updates.profileCompleteness = computeCompleteness(merged);
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await usersCol().doc(req.uid).update(updates);

    return res.json({ uid: req.uid, ...updates, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ error: "Failed to update profile." });
  }
}

// ── POST /api/users/delete-account ──────────────────────────────────────────

async function deleteAccount(req, res) {
  try {
    const { confirmation } = req.body;

    if (confirmation !== "DELETE") {
      return res.status(400).json({ error: "You must send confirmation: \"DELETE\" to proceed." });
    }

    // Soft-delete: mark the Firestore doc
    await usersCol().doc(req.uid).update({
      deleted_at: admin.firestore.FieldValue.serverTimestamp(),
      role: "deleted",
    });

    // Hard-delete the Firebase Auth account
    await auth().deleteUser(req.uid);

    return res.status(200).json({ message: "Account deleted successfully." });
  } catch (err) {
    console.error("deleteAccount error:", err);
    return res.status(500).json({ error: "Failed to delete account." });
  }
}

module.exports = { getProfile, updateProfile, deleteAccount };
