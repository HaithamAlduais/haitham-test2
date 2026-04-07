const express = require("express");
const requireRole = require("../middleware/requireRole");
const {
  createHackathon,
  listHackathons,
  getHackathon,
  updateHackathon,
  updateHackathonStatus,
  listPublicHackathons,
  getPublicHackathon,
} = require("../controllers/hackathonController");
const registrationRoutes = require("./registrations");
const teamRoutes = require("./teams");
const submissionRoutes = require("./submissions");
const judgingRoutes = require("./judging");
const announcementRoutes = require("./announcements");
const workshopRoutes = require("./workshops");
const sponsorRoutes = require("./sponsors");
const resourceRoutes = require("./resources");
const votingRoutes = require("./voting");
const aiRoutes = require("./ai");
const certificateRoutes = require("./certificates");
const badgeRoutes = require("./badges");
const surveyRoutes = require("./surveys");
const judgeManagementRoutes = require("./judgeManagement");
const communicationRoutes = require("./communications");
const eligibilityRoutes = require("./eligibility");
const legacyRoutes = require("./legacy");
const discordRoutes = require("./discord");

const router = express.Router();

// ── Public endpoints (no auth) ──────────────────────────────────────────────
router.get("/public", listPublicHackathons);
router.get("/public/:slug", getPublicHackathon);

// ── Organizer endpoints ─────────────────────────────────────────────────────
router.post("/", requireRole("Organizer"), createHackathon);
router.get("/", requireRole("Organizer"), listHackathons);
router.get("/:id", requireRole("Organizer"), getHackathon);
router.patch("/:id", requireRole("Organizer"), updateHackathon);
router.patch("/:id/status", requireRole("Organizer"), updateHackathonStatus);

// ── Nested: registrations, teams ────────────────────────────────────────────
router.use("/:id/registrations", registrationRoutes);
router.use("/:id/teams", teamRoutes);
router.use("/:id/submissions", submissionRoutes);
router.use("/:id", judgingRoutes);
router.use("/:id/announcements", announcementRoutes);
router.use("/:id/workshops", workshopRoutes);
router.use("/:id/sponsors", sponsorRoutes);
router.use("/:id/resources", resourceRoutes);
router.use("/:id/votes", votingRoutes);
router.use("/:id/certificates", certificateRoutes);
router.use("/:id/badges", badgeRoutes);
router.use("/:id/surveys", surveyRoutes);
router.use("/:id/judges", judgeManagementRoutes);
router.use("/:id/office-hours", communicationRoutes);
router.use("/:id/submissions", eligibilityRoutes);
router.use("/:id/legacy", legacyRoutes);
router.use("/:id/discord", discordRoutes);
router.use("/:id", aiRoutes);

module.exports = router;
