const router = require("express").Router();
const {
  listNotifications,
  markRead,
  markAllRead,
} = require("../controllers/notifications.controller");
const { authenticate } = require("../middleware/requireAuth");

// Every role has notifications, so no requireRole here
router.use(authenticate);

router.get("/", listNotifications);
router.patch("/read-all", markAllRead); // before "/:id/read" so it isn't mistaken for an id
router.patch("/:id/read", markRead);

module.exports = router;