const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { register, login, me } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/requireAuth");
const { uploadProof } = require("../lib/proofStorage");

// Slows down password guessing: 50 requests per 15 minutes per IP
router.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false }));

// Alumni send multipart (with a "proof" file); students still send JSON, which multer skips
router.post(
  "/register",
  (req, res, next) =>
    uploadProof.single("proof")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          message: err.code === "LIMIT_FILE_SIZE" ? "Proof must be 5 MB or smaller" : "Upload failed",
        });
      }
      next();
    }),
  register
);
router.post("/login", login);
router.get("/me", authenticate, me);

module.exports = router;