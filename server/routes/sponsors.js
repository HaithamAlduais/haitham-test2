const router = require("express").Router({ mergeParams: true });
const requireRole = require("../middleware/requireRole");
const ctrl = require("../controllers/sponsorController");
const { ROLES } = require("../lib/constants");

router.post("/", requireRole(ROLES.ORGANIZER), ctrl.createSponsor);
router.get("/", ctrl.listSponsors); // public read
router.patch("/:sponsorId", requireRole(ROLES.ORGANIZER), ctrl.updateSponsor);
router.delete("/:sponsorId", requireRole(ROLES.ORGANIZER), ctrl.deleteSponsor);

module.exports = router;
