const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { authenticate, requireRole } = require("../middleware/requireAuth");
const portal = require("../controllers/staffPortal.controller");

// Rate limit: 100 write requests (POST, PUT, PATCH, DELETE) per 15 minutes per IP.
// Reading (GET) is not limited.
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => ["GET", "HEAD", "OPTIONS"].includes(req.method),
  message: { message: "Too many requests. Please try again later." },
});

router.use(writeLimiter);
router.use(authenticate, requireRole("Staff")); // only logged-in staff reach these

/* ---- Own profile ---- */
router.get("/me", portal.getMyProfile);
router.put("/me", portal.updateMyProfile);

/* ---- Notifications. "read-all" is a POST, so it can never be mistaken for the "/:id" route ---- */
router.get("/notifications", portal.listNotifications);
router.post("/notifications/read-all", portal.markAllNotificationsRead);
router.patch("/notifications/:id/read", portal.markNotificationRead);

module.exports = router;