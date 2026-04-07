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
const registrationRoutes = require("./registrations");
const teamRoutes = require("./teams");

const router = express.Router();

// ── Public endpoints (no auth) ──────────────────────────────────────────────
router.get("/public", listPublicHackathons);
router.get("/public/:slug", getPublicHackathon);

// ── Organizer endpoints ─────────────────────────────────────────────────────
router.post("/", requireRole("Organizer"), createHackathon);
router.get("/", requireRole("Organizer"), listHackathons);
router.get("/:id", requireRole("Organizer"), getHackathon);
router.patch("/:id", requireRole("Organizer"), updateHackathon);
router.patch("/:id/status", requireRole("Organizer"), updateHackathonStatus);

// ── Nested: registrations, teams ────────────────────────────────────────────
router.use("/:id/registrations", registrationRoutes);
router.use("/:id/teams", teamRoutes);

module.exports = router;
