const express = require("express");
const requireRole = require("../middleware/requireRole");
const {
  getProfile,
  updateProfile,
  deleteAccount,
} = require("../controllers/userController");

const router = express.Router();

// GET    /api/users/profile        — Get own profile (any authenticated user)
router.get("/profile", requireRole("Provider", "Participant"), getProfile);

// PATCH  /api/users/profile        — Update own profile (any authenticated user)
router.patch("/profile", requireRole("Provider", "Participant"), updateProfile);

// POST   /api/users/delete-account — Soft-delete + remove auth (any authenticated user)
router.post("/delete-account", requireRole("Provider", "Participant"), deleteAccount);

module.exports = router;
