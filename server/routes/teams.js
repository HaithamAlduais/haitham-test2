const express = require("express");
const requireRole = require("../middleware/requireRole");
const {
  createTeam,
  joinTeam,
  requestToJoin,
  handleJoinRequest,
  listJoinRequests,
  listTeams,
  getTeam,
  leaveTeam,
  listAllTeamsAdmin,
  updateTeamTags,
  updateTeamStatus,
} = require("../controllers/teamController");

const router = express.Router({ mergeParams: true });

// Participant endpoints
router.post("/", requireRole("Participant"), createTeam);
router.post("/join", requireRole("Participant"), joinTeam);
router.get("/", requireRole("Participant", "Organizer"), listTeams);
router.get("/:teamId", requireRole("Participant", "Organizer"), getTeam);
router.post("/:teamId/leave", requireRole("Participant"), leaveTeam);

// Join request endpoints
router.post("/:teamId/request", requireRole("Participant"), requestToJoin);
router.patch("/:teamId/request/:reqId", requireRole("Participant", "Organizer"), handleJoinRequest);
router.get("/:teamId/requests", requireRole("Participant", "Organizer"), listJoinRequests);

// Organizer endpoints
router.get("/admin/all", requireRole("Organizer"), listAllTeamsAdmin);
router.patch("/:teamId/tags", requireRole("Organizer"), updateTeamTags);
router.patch("/:teamId/status", requireRole("Organizer"), updateTeamStatus);

module.exports = router;
