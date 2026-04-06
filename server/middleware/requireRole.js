const { db, auth } = require("../lib/firebase");

/**
 * Express middleware that verifies a Firebase ID token from the
 * Authorization header and optionally enforces one or more allowed roles.
 *
 * Usage:
 *   router.post("/sessions", requireRole("Provider"), handler);
 *   router.get("/sessions/:id", requireRole("Provider", "Participant"), handler);
 *
 * On success the middleware attaches to `req`:
 *   - req.uid          — Firebase UID
 *   - req.email        — user email
 *   - req.role         — Firestore role string ("Provider" | "Participant")
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

      // 2. Fetch the user's Firestore profile to get their role
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
      req.role = userData.role;
      req.userRecord = userData;

      // 3. Check role if any allowed roles were specified
      if (allowedRoles.length > 0 && !allowedRoles.includes(userData.role)) {
        return res.status(403).json({
          error: `Access denied. Required role: ${allowedRoles.join(" or ")}.`,
        });
      }

      next();
    } catch (err) {
      console.error("requireRole unexpected error:", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  };
}

module.exports = requireRole;
