const express = require("express");
const requireRole = require("../middleware/requireRole");
const { generateCertificates, listCertificates, getMyCertificate } = require("../controllers/certificateController");

const router = express.Router({ mergeParams: true });

router.post("/generate", requireRole("Organizer"), generateCertificates);
router.get("/", requireRole("Organizer"), listCertificates);
router.get("/mine", requireRole("Participant"), getMyCertificate);

module.exports = router;
