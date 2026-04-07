const express = require("express");
const requireRole = require("../middleware/requireRole");
const {
  getProfile,
  updateProfile,
  deleteAccount,
} = require("../controllers/userController");

const router = express.Router();

// GET    /api/users/profile        — Get own profile (any authenticated user)
router.get("/profile", requireRole("Organizer", "Participant", "Judge", "Sponsor", "Admin"), getProfile);

// PATCH  /api/users/profile        — Update own profile (any authenticated user)
router.patch("/profile", requireRole("Organizer", "Participant", "Judge", "Sponsor", "Admin"), updateProfile);

// POST   /api/users/delete-account — Soft-delete + remove auth (any authenticated user)
router.post("/delete-account", requireRole("Organizer", "Participant", "Judge", "Sponsor", "Admin"), deleteAccount);

module.exports = router;
