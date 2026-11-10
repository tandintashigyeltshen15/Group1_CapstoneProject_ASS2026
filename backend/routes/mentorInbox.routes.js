const router = require("express").Router();
const { authenticate, requireRole } = require("../middleware/requireAuth");
const c = require("../controllers/mentorInbox.controller");

router.use(authenticate, requireRole("Alumni"));

router.get("/", c.getInbox);
router.put("/availability", c.setAvailability);
router.get("/requests/:id/student", c.getStudent);
router.patch("/requests/:id", c.respond);

module.exports = router;