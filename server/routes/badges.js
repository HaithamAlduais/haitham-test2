const express = require("express");
const requireRole = require("../middleware/requireRole");
const { awardBadge, awardAllParticipationBadges, listUserBadges } = require("../controllers/badgeController");

const router = express.Router({ mergeParams: true });

// Award badges (organizer only)
router.post("/award", requireRole("Organizer"), awardBadge);
router.post("/award-all", requireRole("Organizer"), awardAllParticipationBadges);

// List badges for a user (any authenticated user)
router.get("/mine", requireRole("Participant", "Organizer", "Judge", "Sponsor"), listUserBadges);

module.exports = router;
