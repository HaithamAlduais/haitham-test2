const express = require("express");
const requireRole = require("../middleware/requireRole");
const {
  submitRegistration,
  getMyRegistration,
  listRegistrations,
  updateRegistrationStatus,
  bulkUpdateStatus,
} = require("../controllers/registrationController");

const router = express.Router({ mergeParams: true });

// Participant endpoints
router.post("/", requireRole("Participant"), submitRegistration);
router.get("/mine", requireRole("Participant"), getMyRegistration);

// Organizer endpoints
router.get("/", requireRole("Organizer"), listRegistrations);
router.patch("/:regId", requireRole("Organizer"), updateRegistrationStatus);
router.post("/bulk-status", requireRole("Organizer"), bulkUpdateStatus);

module.exports = router;
