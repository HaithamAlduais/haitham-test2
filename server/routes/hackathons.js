const express = require("express");
const requireRole = require("../middleware/requireRole");
const {
  createHackathon,
  listHackathons,
  getHackathon,
  updateHackathon,
  updateHackathonStatus,
  listPublicHackathons,
  getPublicHackathon,
} = require("../controllers/hackathonController");

const router = express.Router();

// ── Public endpoints (no auth) ──────────────────────────────────────────────
// IMPORTANT: These must come BEFORE the :id param routes to avoid "public"
// being captured as an :id.

router.get("/public", listPublicHackathons);
router.get("/public/:slug", getPublicHackathon);

// ── Organizer endpoints ─────────────────────────────────────────────────────

router.post("/", requireRole("Organizer"), createHackathon);
router.get("/", requireRole("Organizer"), listHackathons);
router.get("/:id", requireRole("Organizer"), getHackathon);
router.patch("/:id", requireRole("Organizer"), updateHackathon);
router.patch("/:id/status", requireRole("Organizer"), updateHackathonStatus);

module.exports = router;
