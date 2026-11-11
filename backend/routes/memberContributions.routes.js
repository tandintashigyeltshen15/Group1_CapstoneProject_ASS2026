// backend/routes/memberContributions.routes.js
const express = require("express");
const multer = require("multer");
const ctrl = require("../controllers/memberContributions.controller");
const { authenticate } = require("../middleware/requireAuth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB receipt limit
});

const receiptUpload = (req, res, next) =>
  upload.single("receipt")(req, res, (err) => {
    if (!err) return next();
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "Receipt must be 5 MB or smaller." : "Could not read the receipt file.";
    res.status(400).json({ success: false, message });
  });

// Staff and alumni can contribute. The comparison ignores capital letters and spaces.
const allowedRoles = ["staff", "alumni"];
const memberOnly = (req, res, next) => {
  const role = String(req.user?.role || "").trim().toLowerCase();
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ message: "You don't have access to this" });
  }
  next();
};

const router = express.Router();

router.use(authenticate, memberOnly);

router.get("/campaigns", ctrl.listOpenCampaigns);
router.get("/campaigns/:id/image", ctrl.getCampaignImage);
router.post("/campaigns/:id/payments", receiptUpload, ctrl.submitPayment);

router.get("/bank-details", ctrl.getBankDetails);

router.get("/my-payments", ctrl.listMyPayments);
router.get("/my-payments/:id/receipt", ctrl.getMyReceipt);

module.exports = router;