// backend/routes/studentPortfolio.routes.js
const router = require("express").Router();
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const { authenticate, requireRole } = require("../middleware/requireAuth");
const ctrl = require("../controllers/studentPortfolio.controller");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5 MB
});

// Stops someone filling the database with uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many uploads. Please try again later." },
});

const fileUpload = (req, res, next) =>
  upload.single("file")(req, res, (err) => {
    if (!err) return next();
    res.status(400).json({
      message: err.code === "LIMIT_FILE_SIZE" ? "File must be 5 MB or smaller" : "Upload failed",
    });
  });

router.use(authenticate, requireRole("Student"));

router.get("/", ctrl.listFiles);
router.post("/", uploadLimiter, fileUpload, ctrl.uploadFile);
router.get("/:id/download", ctrl.downloadFile);
router.patch("/:id/share", ctrl.setShared);
router.delete("/:id", ctrl.deleteFile);

module.exports = router;