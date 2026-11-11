const router = require("express").Router();
const {
  getStudentMentorship,
  createRequest,
  getIncoming,
  respondToRequest,
} = require("../controllers/mentorship.controller");
const { authenticate, requireRole } = require("../middleware/requireAuth");

router.use(authenticate);

router.get("/", requireRole("Student"), getStudentMentorship);
router.post("/requests", requireRole("Student"), createRequest);
router.get("/incoming", requireRole("Alumni"), getIncoming);
router.patch("/requests/:id", requireRole("Alumni"), respondToRequest);

module.exports = router;