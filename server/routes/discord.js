const express = require("express");
const requireRole = require("../middleware/requireRole");
const {
  setupDiscord,
  createTeamDiscordChannel,
  sendDiscordAnnouncement,
  getDiscordStatus,
} = require("../controllers/discordController");

const router = express.Router({ mergeParams: true });

// All Discord endpoints are organizer-only
router.post("/setup", requireRole("Organizer"), setupDiscord);
router.post("/team-channel", requireRole("Organizer"), createTeamDiscordChannel);
router.post("/announce", requireRole("Organizer"), sendDiscordAnnouncement);
router.get("/status", requireRole("Organizer", "Participant", "Judge"), getDiscordStatus);

module.exports = router;
