const router = require("express").Router();
const { authenticate, requireRole } = require("../middleware/requireAuth");
const {
  createUser,
  setStatus,
  listStaff,
  listPendingStaff,
  approveStaff,
  rejectStaff,
} = require("../controllers/admin.controller");

router.use(authenticate, requireRole("Administrator")); // only admins reach these

router.post("/users", createUser);
router.patch("/users/:id/status", setStatus);

router.get("/staff", listStaff);
router.get("/staff/pending", listPendingStaff);
router.post("/staff/:id/approve", approveStaff);
router.post("/staff/:id/reject", rejectStaff);

module.exports = router;