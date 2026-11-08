const router = require("express").Router();
const { getDashboard } = require("../controllers/studentDashboard.controller");
const { authenticate, requireRole } = require("../middleware/requireAuth");

router.get("/dashboard", authenticate, requireRole("Student"), getDashboard);

module.exports = router;