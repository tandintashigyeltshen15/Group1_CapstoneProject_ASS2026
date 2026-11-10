const router = require("express").Router();
const { authenticate, requireRole } = require("../middleware/requireAuth");
const { getDashboard } = require("../controllers/alumniDashboard.controller");

router.get("/", authenticate, requireRole("Alumni"), getDashboard);

module.exports = router;
