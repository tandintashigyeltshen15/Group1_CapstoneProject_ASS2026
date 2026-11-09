const router = require("express").Router();
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const { authenticate, requireRole } = require("../middleware/requireAuth");
const { uploadPhoto, removePhoto } = require("../controllers/profilePhoto.controller");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 }, // 2 MB
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many uploads. Please try again later." },
});

// Administrators have no profile photo
router.use(authenticate, requireRole("Student", "Alumni", "Staff"), limiter);

router.post(
  "/",
  (req, res, next) =>
    upload.single("photo")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          message: err.code === "LIMIT_FILE_SIZE" ? "Photo must be 2 MB or smaller" : "Upload failed",
        });
      }
      next();
    }),
  uploadPhoto
);
router.delete("/", removePhoto);

module.exports = router;