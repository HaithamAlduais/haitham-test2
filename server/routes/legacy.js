const express = require("express");
const requireRole = require("../middleware/requireRole");
const { getLegacyData, cloneAsTemplate } = require("../controllers/legacyController");

const router = express.Router({ mergeParams: true });

// Public — anyone can view the legacy page
router.get("/", getLegacyData);

// Clone as template — organizer only
router.post("/clone", requireRole("Organizer"), cloneAsTemplate);

module.exports = router;
