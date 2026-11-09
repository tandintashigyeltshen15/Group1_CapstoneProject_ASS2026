const router = require("express").Router();
const { authenticate, requireRole } = require("../middleware/requireAuth");
const {
  listAlumni,
  getProof,
  approveAlumni,
  rejectAlumni,
} = require("../controllers/verification.controller");

router.use(authenticate);

// Staff verify alumni; administrators can watch the queues but not decide
router.get("/alumni", requireRole("Staff", "Administrator"), listAlumni);
// Staff and administrators can open the uploaded proof of graduation
router.get("/alumni/:id/proof", requireRole("Staff", "Administrator"), getProof);
router.post("/alumni/:id/approve", requireRole("Staff", "Administrator"), approveAlumni);
router.post("/alumni/:id/reject", requireRole("Staff", "Administrator"), rejectAlumni);

module.exports = router;