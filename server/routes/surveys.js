const express = require("express");
const requireRole = require("../middleware/requireRole");
const ctrl = require("../controllers/surveyController");

const router = express.Router({ mergeParams: true });

router.post("/", requireRole("Organizer"), ctrl.createSurvey);
router.get("/", requireRole("Organizer", "Participant"), ctrl.listSurveys);
router.post("/:surveyId/respond", requireRole("Participant"), ctrl.submitResponse);
router.get("/:surveyId/results", requireRole("Organizer"), ctrl.getSurveyResults);

module.exports = router;
