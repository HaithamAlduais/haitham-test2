const express = require("express");
const requireRole = require("../middleware/requireRole");
const { listEvents, getEvent, listEventSessions, createEvent, updateEvent } = require("../controllers/eventController");
const { createHackathonEvent, getPublicEventPage } = require("../controllers/hackathonController");

const router = express.Router();

// POST /api/events — Create a new event
router.post("/", requireRole("Provider"), createEvent);

// POST /api/events/hackathon — Create a hackathon event with generated landing page
router.post("/hackathon", requireRole("Provider"), createHackathonEvent);

// GET /api/events/page/:slug — Public: serve generated event page by slug
router.get("/page/:slug", getPublicEventPage);

// GET /api/events — List all events owned by the Provider
router.get("/", requireRole("Provider"), listEvents);

// GET /api/events/:eventId — Get a single event (Provider only)
router.get("/:eventId", requireRole("Provider"), getEvent);

// PATCH /api/events/:eventId — Update a single event (Provider only)
router.patch("/:eventId", requireRole("Provider"), updateEvent);

// GET /api/events/:eventId/sessions — List sessions linked to an event (Provider only)
router.get("/:eventId/sessions", requireRole("Provider"), listEventSessions);

module.exports = router;
