const express = require("express");
const requireRole = require("../middleware/requireRole");
const { checkEligibility, eligibilitySummary } = require("../controllers/eligibilityController");

const router = express.Router({ mergeParams: true });

router.patch("/:subId/eligibility", requireRole("Organizer"), checkEligibility);
router.get("/eligibility-summary", requireRole("Organizer"), eligibilitySummary);

module.exports = router;
