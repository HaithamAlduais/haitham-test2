const express = require("express");
const requireRole = require("../middleware/requireRole");
const {
  createSubmission,
  updateSubmission,
  finalizeSubmission,
  getMySubmission,
  listSubmissions,
} = require("../controllers/submissionController");

const router = express.Router({ mergeParams: true });

// Participant endpoints
router.post("/", requireRole("Participant"), createSubmission);
router.get("/mine", requireRole("Participant"), getMySubmission);
router.patch("/:subId", requireRole("Participant"), updateSubmission);
router.post("/:subId/submit", requireRole("Participant"), finalizeSubmission);

// Organizer endpoints
router.get("/", requireRole("Organizer"), listSubmissions);

module.exports = router;
