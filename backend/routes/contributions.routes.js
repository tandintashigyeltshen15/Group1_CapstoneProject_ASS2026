const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const { authenticate, requireRole } = require("../middleware/requireAuth");
const c = require("../controllers/contributions.controller");

// files are kept in memory, checked, then saved in the database (max 5 MB)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
const single = (field) => (req, res, next) =>
  upload.single(field)(req, res, (err) => {
    if (!err) return next();
    res.status(400).json({
      message: err.code === "LIMIT_FILE_SIZE" ? "The file must be 5 MB or smaller" : "Could not read the uploaded file",
    });
  });

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many submissions. Please try again later." },
});

const admin = requireRole("Administrator");
const contributors = requireRole("Staff", "Alumni");

/* ---- public file routes: the receipt link carries its own short-lived signature ---- */
router.get("/payments/:id/receipt", c.getReceipt);
router.get("/campaigns/:id/image", c.getCampaignImage);

router.use(authenticate);

/* ---- every logged-in role ---- */
router.get("/", c.getOverview);

/* ---- staff and alumni ---- */
router.get("/mine", contributors, c.getMine);
router.post("/campaigns/:id/payments", contributors, paymentLimiter, single("receipt"), c.submitPayment);
router.get("/bank-details", requireRole("Staff", "Alumni", "Administrator"), c.getBank);

/* ---- administrator only ---- */
router.get("/admin/overview", admin, c.adminOverview);
router.put("/bank-details", admin, c.updateBank);
router.post("/campaigns", admin, c.createCampaign);
router.patch("/campaigns/:id", admin, c.updateCampaign);
router.patch("/campaigns/:id/status", admin, c.setCampaignStatus);
router.delete("/campaigns/:id", admin, c.deleteCampaign);
router.post("/campaigns/:id/image", admin, single("image"), c.uploadCampaignImage);
router.patch("/:id/verify", admin, c.reviewPayment);

module.exports = router;