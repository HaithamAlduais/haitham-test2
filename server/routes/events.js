const express = require("express");
const requireRole = require("../middleware/requireRole");
const {
  listEvents,
  getEvent,
  listEventSessions,
  createEvent,
  updateEvent,
  updateEventStatus,
  listPublicEvents,
  getPublicEvent,
} = require("../controllers/eventController");

// Nested sub-route modules (shared with hackathons)
const registrationRoutes = require("./registrations");
const teamRoutes = require("./teams");
const submissionRoutes = require("./submissions");
const judgingRoutes = require("./judging");
const announcementRoutes = require("./announcements");
const workshopRoutes = require("./workshops");
const aiRoutes = require("./ai");

const router = express.Router();

// ── Public endpoints (no auth) ──────────────────────────────────────────────
router.get("/public", listPublicEvents);
router.get("/public/:id", getPublicEvent);

// ── Organizer endpoints ─────────────────────────────────────────────────────
router.post("/", requireRole("Organizer"), createEvent);
router.get("/", requireRole("Organizer"), listEvents);
router.get("/:eventId", requireRole("Organizer"), getEvent);
router.patch("/:eventId", requireRole("Organizer"), updateEvent);
router.patch("/:eventId/status", requireRole("Organizer"), updateEventStatus);

// Legacy: sessions linked to an event
router.get("/:eventId/sessions", requireRole("Organizer"), listEventSessions);

// ── Nested sub-routes (type-specific features available on all events) ──────
router.use("/:eventId/registrations", registrationRoutes);
router.use("/:eventId/teams", teamRoutes);
router.use("/:eventId/submissions", submissionRoutes);
router.use("/:eventId", judgingRoutes);
router.use("/:eventId/announcements", announcementRoutes);
router.use("/:eventId/workshops", workshopRoutes);
router.use("/:eventId", aiRoutes);

module.exports = router;
