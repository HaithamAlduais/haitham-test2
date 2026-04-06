/**
 * Ramsha — Attendance Routes
 *
 * Mounted at /api/attendance.
 * POST /api/attendance/:id/attend — Participant check-in (QR or F2F)
 * GET  /api/attendance/:id/list   — Provider lists attendance records
 */

const express = require("express");
const requireRole = require("../middleware/requireRole");
const { attendSession, listAttendance } = require("../controllers/attendanceController");

const router = express.Router();

// POST /api/attendance/:id/attend — Participant checks in (both QR and F2F)
router.post("/:id/attend", requireRole("Participant"), attendSession);

// GET /api/attendance/:id/list — Provider views attendance list
router.get("/:id/list", requireRole("Provider"), listAttendance);

module.exports = router;
