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
      avatarUrl: data.avatarUrl || null,
      createdAt: data.createdAt || null,
    });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ error: "Failed to fetch profile." });
  }
}

// ── PATCH /api/users/profile ────────────────────────────────────────────────

async function updateProfile(req, res) {
  try {
    const { displayName } = req.body;

    if (displayName !== undefined) {
      if (typeof displayName !== "string" || displayName.trim().length === 0) {
        return res.status(400).json({ error: "Display name must be a non-empty string." });
      }
      if (displayName.trim().length > 255) {
        return res.status(400).json({ error: "Display name must be 255 characters or fewer." });
      }
    }

    const updates = {};
    if (displayName !== undefined) {
      updates.displayName = displayName.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update." });
    }

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
