const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { register, login, me } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/requireAuth");

// Slows down password guessing: 50 requests per 15 minutes per IP
router.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false }));

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, me);

module.exports = router;