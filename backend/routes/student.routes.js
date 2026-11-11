const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { getDashboard } = require("../controllers/studentDashboard.controller");
const {
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/studentProfile.controller");
const { authenticate, requireRole } = require("../middleware/requireAuth");

// Stops someone guessing the current password again and again
const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
});

router.use(authenticate, requireRole("Student"));

router.get("/dashboard", getDashboard);
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.post("/change-password", passwordLimiter, changePassword);

module.exports = router;