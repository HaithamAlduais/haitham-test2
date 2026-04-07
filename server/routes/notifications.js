const express = require("express");
const requireRole = require("../middleware/requireRole");
const { listNotifications, markAsRead, markAllRead } = require("../controllers/notificationController");
const router = express.Router();

router.get("/", requireRole("Participant", "Organizer", "Judge", "Sponsor"), listNotifications);
router.patch("/:notifId/read", requireRole("Participant", "Organizer", "Judge", "Sponsor"), markAsRead);
router.post("/mark-all-read", requireRole("Participant", "Organizer", "Judge", "Sponsor"), markAllRead);

module.exports = router;
