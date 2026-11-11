const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { authenticate, requireRole } = require("../middleware/requireAuth");
const {
  createAnnouncement,
  listAnnouncements,
  deleteAnnouncement,
} = require("../controllers/announcements.controller");

// Each post notifies many people, so keep it from being spammed
const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many announcements. Please try again later." },
});

router.use(authenticate);

router.get("/", listAnnouncements);
router.post("/", requireRole("Staff", "Administrator"), postLimiter, createAnnouncement);
router.delete("/:id", requireRole("Staff", "Administrator"), deleteAnnouncement);

module.exports = router;