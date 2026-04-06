const express = require("express");
const requireRole = require("../middleware/requireRole");
const {
  createSession,
  listSessions,
  getSession,
  activateSession,
  closeSession,
  updateSession,
} = require("../controllers/sessionController");

const router = express.Router();

// POST   /api/sessions            — Create a new session (Provider only)
router.post("/", requireRole("Provider"), createSession);

// GET    /api/sessions            — List provider's sessions (Provider only)
router.get("/", requireRole("Provider"), listSessions);

// GET    /api/sessions/:id        — Get single session (Provider or Participant)
router.get("/:id", requireRole("Provider", "Participant"), getSession);

// PATCH  /api/sessions/:id        — Update session details (Provider only)
router.patch("/:id", requireRole("Provider"), updateSession);

// PATCH  /api/sessions/:id/activate — Draft -> Active (Provider only)
router.patch("/:id/activate", requireRole("Provider"), activateSession);

// PATCH  /api/sessions/:id/close    — Active -> Closed (Provider only)
router.patch("/:id/close", requireRole("Provider"), closeSession);

module.exports = router;
