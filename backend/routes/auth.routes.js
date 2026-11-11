
const router = require("express").Router();
const rateLimit = require("express-rate-limit");

const {
  register,
  login,
  me,
} = require("../controllers/auth.controller");

const { authenticate } = require("../middleware/requireAuth");
const { uploadProof } = require("../lib/proofStorage");

// Rate limiting
router.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Registration route with Multer debugging
router.post(
  "/register",
  (req, res, next) => {
    console.log("\n========== ALUMNI REGISTRATION ==========");
    console.log("Registration route reached");
    console.log("Expected file field: proof");

    uploadProof.single("proof")(req, res, (err) => {
      if (err) {
        console.error("\n========== MULTER ERROR ==========");

        console.error("Message:", err.message);
        console.error("Code:", err.code);
        console.error("Field:", JSON.stringify(err.field));

        console.error(
          "Field character codes:",
          [...(err.field || "")].map((char) =>
            char.charCodeAt(0)
          )
        );

        console.error("Full error:", err);

        return res.status(400).json({
          message: err.message,
          code: err.code || "UNKNOWN",
          field: err.field || null,
          fieldLength: err.field?.length || 0,
          fieldCharCodes: [...(err.field || "")].map(
            (char) => char.charCodeAt(0)
          ),
        });
      }

      console.log("\n========== MULTER SUCCESS ==========");

      console.log(
        "Uploaded file:",
        req.file
          ? {
              fieldname: req.file.fieldname,
              originalname: req.file.originalname,
              mimetype: req.file.mimetype,
              size: req.file.size,
            }
          : "No file attached"
      );

      next();
    });
  },
  register
);

// Login route
router.post("/login", login);

// Current authenticated user
router.get("/me", authenticate, me);

module.exports = router;
