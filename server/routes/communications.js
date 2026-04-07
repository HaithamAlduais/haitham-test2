const express = require("express");
const requireRole = require("../middleware/requireRole");
const { createOfficeHours, listOfficeHours, rsvpOfficeHours } = require("../controllers/communicationController");

const router = express.Router({ mergeParams: true });

router.post("/", requireRole("Organizer"), createOfficeHours);
router.get("/", requireRole("Organizer", "Participant", "Judge"), listOfficeHours);
router.post("/:ohId/rsvp", requireRole("Participant"), rsvpOfficeHours);

module.exports = router;
