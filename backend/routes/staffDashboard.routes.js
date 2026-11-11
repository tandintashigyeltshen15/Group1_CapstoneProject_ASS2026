const router = require("express").Router();
const { authenticate, requireRole } = require("../middleware/requireAuth");
const { getDashboard } = require("../controllers/staffDashboard.controller");

router.get("/", authenticate, requireRole("Staff"), getDashboard);

module.exports = router;