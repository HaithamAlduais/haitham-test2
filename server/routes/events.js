const express = require("express");
const requireRole = require("../middleware/requireRole");
const { listEvents, getEvent, listEventSessions, createEvent, updateEvent } = require("../controllers/eventController");

const router = express.Router();

// POST /api/events — Create a new event
router.post("/", requireRole("Provider"), createEvent);

// GET /api/events — List all events owned by the Provider
router.get("/", requireRole("Provider"), listEvents);

// GET /api/events/:eventId — Get a single event (Provider only)
router.get("/:eventId", requireRole("Provider"), getEvent);

// PATCH /api/events/:eventId — Update a single event (Provider only)
router.patch("/:eventId", requireRole("Provider"), updateEvent);

// GET /api/events/:eventId/sessions — List sessions linked to an event (Provider only)
router.get("/:eventId/sessions", requireRole("Provider"), listEventSessions);

module.exports = router;
