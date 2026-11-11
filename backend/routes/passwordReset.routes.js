// backend/routes/passwordReset.routes.js
const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { requestReset, confirmReset } = require("../controllers/passwordReset.controller");

// Stops someone filling an inbox with reset emails, or guessing links
const requestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again in a few minutes." },
});

const confirmLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in a few minutes." },
});

router.post("/request", requestLimiter, requestReset);
router.post("/confirm", confirmLimiter, confirmReset);

module.exports = router;