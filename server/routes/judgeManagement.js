const express = require("express");
const requireRole = require("../middleware/requireRole");
const { inviteJudge, listJudges, assignSubmissions, acceptInvitation, sendReminders } = require("../controllers/judgeManagementController");

const router = express.Router({ mergeParams: true });

router.post("/invite", requireRole("Organizer"), inviteJudge);
router.get("/", requireRole("Organizer", "Judge"), listJudges);
router.patch("/:judgeAssignmentId/assign", requireRole("Organizer"), assignSubmissions);
router.post("/accept", requireRole("Judge", "Organizer"), acceptInvitation);
router.post("/remind", requireRole("Organizer"), sendReminders);

module.exports = router;
