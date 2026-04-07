const express = require("express");
const requireRole = require("../middleware/requireRole");
const { listEvents, getEvent, listEventSessions, createEvent, updateEvent } = require("../controllers/eventController");

const router = express.Router();

// POST /api/events — Create a new event
router.post("/", requireRole("Organizer"), createEvent);

// GET /api/events — List all events owned by the Organizer
router.get("/", requireRole("Organizer"), listEvents);

// GET /api/events/:eventId — Get a single event (Organizer only)
router.get("/:eventId", requireRole("Organizer"), getEvent);

// PATCH /api/events/:eventId — Update a single event (Organizer only)
router.patch("/:eventId", requireRole("Organizer"), updateEvent);

// GET /api/events/:eventId/sessions — List sessions linked to an event (Organizer only)
router.get("/:eventId/sessions", requireRole("Organizer"), listEventSessions);

module.exports = router;
