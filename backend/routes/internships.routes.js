const router = require("express").Router();
const { getInternships, apply } = require("../controllers/internships.controller");
const { authenticate, requireRole } = require("../middleware/requireAuth");

router.use(authenticate, requireRole("Student"));

router.get("/", getInternships);
router.post("/:id/apply", apply);

module.exports = router;