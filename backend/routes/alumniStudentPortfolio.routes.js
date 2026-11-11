// backend/routes/alumniStudentPortfolio.routes.js
const router = require("express").Router();
const { authenticate, requireRole } = require("../middleware/requireAuth");
const ctrl = require("../controllers/alumniStudentPortfolio.controller");

router.use(authenticate, requireRole("Alumni"));

router.get("/:studentId/portfolio", ctrl.getStudentPortfolio);
router.get("/:studentId/portfolio/:fileId/download", ctrl.downloadSharedFile);

module.exports = router;