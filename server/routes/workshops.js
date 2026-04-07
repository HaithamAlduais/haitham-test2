const express = require("express");
const requireRole = require("../middleware/requireRole");
const {
  createWorkshop,
  listWorkshops,
  updateWorkshop,
  rsvpWorkshop,
} = require("../controllers/workshopController");

const router = express.Router({ mergeParams: true });

router.get("/", requireRole("Organizer", "Participant", "Judge"), listWorkshops);
router.post("/", requireRole("Organizer"), createWorkshop);
router.patch("/:wId", requireRole("Organizer"), updateWorkshop);
router.post("/:wId/rsvp", requireRole("Participant"), rsvpWorkshop);

module.exports = router;
