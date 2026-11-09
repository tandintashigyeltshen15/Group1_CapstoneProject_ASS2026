const router = require("express").Router();
const { authenticate, requireRole } = require("../middleware/requireAuth");
const {
  listAlumni,
  approveAlumni,
  rejectAlumni,
} = require("../controllers/verification.controller");

router.use(authenticate);

// Staff verify alumni; administrators can watch the queues but not decide
router.get("/alumni", requireRole("Staff", "Administrator"), listAlumni);
router.post("/alumni/:id/approve", requireRole("Staff", "Administrator"), approveAlumni);
router.post("/alumni/:id/reject", requireRole("Staff", "Administrator"), rejectAlumni);

module.exports = router;