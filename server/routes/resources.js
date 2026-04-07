const router = require("express").Router({ mergeParams: true });
const requireRole = require("../middleware/requireRole");
const ctrl = require("../controllers/resourceController");
const { ROLES } = require("../lib/constants");

router.post("/", requireRole(ROLES.ORGANIZER), ctrl.createResource);
router.get("/", requireRole(ROLES.ORGANIZER, ROLES.PARTICIPANT, ROLES.JUDGE), ctrl.listResources); // authenticated read
router.delete("/:resourceId", requireRole(ROLES.ORGANIZER), ctrl.deleteResource);

module.exports = router;
