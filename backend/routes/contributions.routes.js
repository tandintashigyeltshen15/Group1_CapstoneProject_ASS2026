const router = require("express").Router();
const { getContributions } = require("../controllers/contributions.controller");
const { authenticate } = require("../middleware/requireAuth");

router.get("/", authenticate, getContributions);

module.exports = router;