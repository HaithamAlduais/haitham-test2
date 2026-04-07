const express = require("express");
const requireRole = require("../middleware/requireRole");
const {
  createSession,
  listSessions,
  getSession,
  activateSession,
  closeSession,
  updateSession,
  getQrTokenEndpoint,
} = require("../controllers/sessionController");

const router = express.Router();

// POST   /api/sessions            — Create a new session (Organizer only)
router.post("/", requireRole("Organizer"), createSession);

// GET    /api/sessions            — List organizer's sessions (Organizer only)
router.get("/", requireRole("Organizer"), listSessions);

// GET    /api/sessions/:id        — Get single session (Organizer or Participant)
router.get("/:id", requireRole("Organizer", "Participant"), getSession);

// PATCH  /api/sessions/:id        — Update session details (Organizer only)
router.patch("/:id", requireRole("Organizer"), updateSession);

// PATCH  /api/sessions/:id/activate — Draft -> Active (Organizer only)
router.patch("/:id/activate", requireRole("Organizer"), activateSession);

// PATCH  /api/sessions/:id/close    — Active -> Closed (Organizer only)
router.patch("/:id/close", requireRole("Organizer"), closeSession);

// GET    /api/sessions/:id/qr-token — Get current rotating QR token (Organizer only)
router.get("/:id/qr-token", requireRole("Organizer"), getQrTokenEndpoint);

module.exports = router;
