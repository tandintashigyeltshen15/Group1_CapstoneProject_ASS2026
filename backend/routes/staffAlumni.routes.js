const router = require("express").Router();
const { authenticate, requireRole } = require("../middleware/requireAuth");
const { list, update } = require("../controllers/staffAlumni.controller");

router.use(authenticate, requireRole("Staff"));

router.get("/", list);
router.put("/:id", update);

module.exports = router;