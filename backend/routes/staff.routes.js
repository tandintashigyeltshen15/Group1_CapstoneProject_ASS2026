const router = require("express").Router();
const { registerStaff } = require("../controllers/staff.controller");

router.post("/", registerStaff);

module.exports = router;