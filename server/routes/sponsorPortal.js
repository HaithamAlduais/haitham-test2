const express = require("express");
const requireRole = require("../middleware/requireRole");
const ctrl = require("../controllers/sponsorPortalController");

const router = express.Router();

router.get("/events", requireRole("Sponsor", "Organizer"), ctrl.listSponsorEvents);
router.get("/:id/participants", requireRole("Sponsor", "Organizer"), ctrl.browseParticipants);
router.get("/:id/stats", requireRole("Sponsor", "Organizer"), ctrl.getSponsorStats);

module.exports = router;
