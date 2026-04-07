const express = require("express");
const requireRole = require("../middleware/requireRole");
const {
  createTeam,
  joinTeam,
  listTeams,
  getTeam,
  leaveTeam,
  listAllTeamsAdmin,
} = require("../controllers/teamController");

const router = express.Router({ mergeParams: true });

// Participant endpoints
router.post("/", requireRole("Participant"), createTeam);
router.post("/join", requireRole("Participant"), joinTeam);
router.get("/", requireRole("Participant", "Organizer"), listTeams);
router.get("/:teamId", requireRole("Participant", "Organizer"), getTeam);
router.post("/:teamId/leave", requireRole("Participant"), leaveTeam);

// Organizer endpoints
router.get("/admin/all", requireRole("Organizer"), listAllTeamsAdmin);

module.exports = router;
