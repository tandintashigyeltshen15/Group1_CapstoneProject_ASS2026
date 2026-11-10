const router = require("express").Router();
const { authenticate, requireRole } = require("../middleware/requireAuth");
const c = require("../controllers/staffOpportunities.controller");

router.use(authenticate, requireRole("Administrator"));

router.get("/", c.list);
router.post("/", c.create);
router.patch("/:id/status", c.setStatus);
router.delete("/:id", c.remove);

module.exports = router;