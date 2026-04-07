const express = require("express");
const requireRole = require("../middleware/requireRole");
const {
  submitScore,
  getMyScores,
  listAllScores,
  getLeaderboard,
} = require("../controllers/judgingController");

const router = express.Router({ mergeParams: true });

// Judge endpoints
router.post("/scores", requireRole("Judge", "Organizer"), submitScore);
router.get("/scores/mine", requireRole("Judge"), getMyScores);

// Organizer endpoints
router.get("/scores", requireRole("Organizer"), listAllScores);
router.get("/leaderboard", requireRole("Organizer", "Judge", "Participant"), getLeaderboard);

module.exports = router;
