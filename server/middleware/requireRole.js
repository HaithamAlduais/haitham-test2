const { db, auth } = require("../lib/firebase");
const { LEGACY_ROLE_MAP } = require("../lib/constants");

/**
 * Express middleware that verifies a Firebase ID token from the
 * Authorization header and optionally enforces one or more allowed roles.
 *
 * Supports both the new `roles` array and the legacy `role` string field.
 * Legacy "Provider" is automatically mapped to "Organizer".
 *
 * Usage:
 *   router.post("/sessions", requireRole("Organizer"), handler);
 *   router.get("/sessions/:id", requireRole("Organizer", "Participant"), handler);
 *
 * On success the middleware attaches to `req`:
 *   - req.uid          — Firebase UID
 *   - req.email        — user email
 *   - req.role         — primary role string (first element of roles array)
 *   - req.roles        — full roles array
 *   - req.userRecord   — full Firestore /users/{uid} document data
 */
function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or malformed Authorization header." });
      }

      const idToken = authHeader.split("Bearer ")[1];

      // 1. Verify the Firebase ID token
      let decoded;
      try {
        decoded = await auth().verifyIdToken(idToken);
      } catch (err) {
        console.error("Token verification failed:", err.message);
        return res.status(401).json({ error: "Invalid or expired token." });
      }

      req.uid = decoded.uid;
      req.email = decoded.email;

      // 2. Fetch the user's Firestore profile to get their role(s)
      let userDoc;
      try {
        userDoc = await db()
          .collection("users")
          .doc(decoded.uid)
          .get();
      } catch (err) {
        console.error("Firestore user lookup failed:", err.message);
        return res.status(500).json({ error: "Internal server error during authentication." });
      }

      if (!userDoc.exists) {
        return res.status(403).json({ error: "User profile not found." });
      }

      const userData = userDoc.data();
      req.userRecord = userData;

      // 3. Resolve roles — prefer `roles` array, fall back to legacy `role` string
      let userRoles;
      if (Array.isArray(userData.roles) && userData.roles.length > 0) {
        userRoles = userData.roles;
      } else if (userData.role) {
        const mapped = LEGACY_ROLE_MAP[userData.role] || userData.role;
        userRoles = [mapped];
      } else {
        userRoles = [];
      }

      req.roles = userRoles;
      req.role = userRoles[0] || null;

      // 4. Check role if any allowed roles were specified
      if (allowedRoles.length > 0) {
        const hasAccess = userRoles.some((r) => allowedRoles.includes(r));
        if (!hasAccess) {
          return res.status(403).json({
            error: `Access denied. Required role: ${allowedRoles.join(" or ")}.`,
          });
        }
      }

      next();
    } catch (err) {
      console.error("requireRole unexpected error:", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  };
}

module.exports = requireRole;
