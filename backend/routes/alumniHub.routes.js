const router = require("express").Router();
const { getAlumniHub } = require("../controllers/alumniHub.controller");
const { authenticate } = require("../middleware/requireAuth");

router.get("/", authenticate, getAlumniHub);

module.exports = router;