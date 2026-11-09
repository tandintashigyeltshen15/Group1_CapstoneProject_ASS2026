const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { authenticate, requireRole } = require("../middleware/requireAuth");
const events = require("../controllers/events.controller");

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => ["GET", "HEAD", "OPTIONS"].includes(req.method),
  message: { message: "Too many requests. Please try again later." },
});

const anyRole = requireRole("Student", "Alumni", "Staff", "Administrator");
const canPost = requireRole("Alumni", "Staff", "Administrator");

router.use(writeLimiter);
router.use(authenticate);

// Fixed paths first, so "mine" is not read as an event id
router.get("/mine", canPost, events.listMyEvents);
router.get("/registrations/mine", anyRole, events.listMyRegistrations);

router.get("/", anyRole, events.listEvents);
router.post("/", canPost, events.createEvent);

router.get("/:id", anyRole, events.getEvent);
router.put("/:id", canPost, events.updateEvent);
router.patch("/:id", canPost, events.setEventStatus);
router.delete("/:id", canPost, events.deleteEvent);

router.post("/:id/register", anyRole, events.registerForEvent);
router.delete("/:id/register", anyRole, events.cancelRegistration);
router.get("/:id/registrations", canPost, events.listRegistrations);

module.exports = router;