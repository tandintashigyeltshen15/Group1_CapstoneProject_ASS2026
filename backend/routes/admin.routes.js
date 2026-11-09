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
const adminPortal = require("../controllers/adminPortal.controller");

router.use(authenticate, requireRole("Administrator")); // only admins reach these

router.get("/dashboard", adminPortal.getDashboard);
router.get("/reports", adminPortal.getReports);
router.get("/users", adminPortal.listUsers);
router.post("/users", createUser);
router.patch("/users/:id/status", setStatus);
router.delete("/users/:id", adminPortal.deleteUser);

router.get("/contributions", adminPortal.listContributions);
router.get("/opportunities", adminPortal.listOpportunities);
router.get("/events", adminPortal.listEvents);

router.get("/staff", listStaff);
router.get("/staff/pending", listPendingStaff);
router.post("/staff/:id/approve", approveStaff);
router.post("/staff/:id/reject", rejectStaff);

module.exports = router;