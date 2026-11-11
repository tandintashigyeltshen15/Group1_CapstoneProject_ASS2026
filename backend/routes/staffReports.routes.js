const router = require("express").Router();
const { authenticate, requireRole } = require("../middleware/requireAuth");
const { getReports } = require("../controllers/staffReports.controller");

router.get("/", authenticate, requireRole("Staff", "Administrator"), getReports);

module.exports = router;