const express = require("express");
const requireRole = require("../middleware/requireRole");
const { castVote, getVoteResults, getMyVote } = require("../controllers/votingController");

const router = express.Router({ mergeParams: true });

// Any authenticated user can vote (1 per user per hackathon)
router.post("/", requireRole("Participant", "Organizer", "Judge"), castVote);

// Public results (no auth needed after voting closes, but require auth for now)
router.get("/results", requireRole("Participant", "Organizer", "Judge"), getVoteResults);

// Check my vote
router.get("/mine", requireRole("Participant", "Organizer", "Judge"), getMyVote);

module.exports = router;
