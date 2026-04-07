const express = require("express");
const requireRole = require("../middleware/requireRole");
const {
  createAnnouncement,
  listAnnouncements,
  deleteAnnouncement,
} = require("../controllers/announcementController");

const router = express.Router({ mergeParams: true });

// Anyone authenticated can read announcements
router.get("/", requireRole("Organizer", "Participant", "Judge"), listAnnouncements);

// Organizer only
router.post("/", requireRole("Organizer"), createAnnouncement);
router.delete("/:annId", requireRole("Organizer"), deleteAnnouncement);

module.exports = router;
