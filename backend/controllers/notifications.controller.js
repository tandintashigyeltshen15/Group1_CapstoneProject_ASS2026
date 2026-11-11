const prisma = require("../lib/prisma");

// The table stores free text in NotificationType, so the category comes from keywords
const categoryOf = (type = "") => {
  const t = type.toLowerCase();
  if (t.includes("mentor")) return "MENTORSHIP";
  if (t.includes("application") || t.includes("internship") || t.includes("opportunit"))
    return "APPLICATION";
  if (t.includes("event")) return "EVENT";
  return "ANNOUNCEMENT";
};

exports.listNotifications = async (req, res) => {
  try {
    const rows = await prisma.notification.findMany({
      where: { UserID: req.user.id },
      orderBy: { CreatedAt: "desc" },
      take: 200,
    });

    res.json(
      rows.map((n) => ({
        id: n.NotificationID,
        type: categoryOf(n.NotificationType),
        title: n.NotificationType,
        message: n.Message,
        createdAt: n.CreatedAt,
        isRead: n.IsRead,
      }))
    );
  } catch (err) {
    console.error("List notifications error:", err);
    res.status(500).json({ message: "Failed to load notifications" });
  }
};

exports.markRead = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid notification" });
    }

    // UserID in the filter means nobody can touch someone else's notification
    const result = await prisma.notification.updateMany({
      where: { NotificationID: id, UserID: req.user.id },
      data: { IsRead: true },
    });
    if (result.count === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Marked as read" });
  } catch (err) {
    console.error("Mark read error:", err);
    res.status(500).json({ message: "Failed to update notification" });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { UserID: req.user.id, IsRead: false },
      data: { IsRead: true },
    });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Mark all read error:", err);
    res.status(500).json({ message: "Failed to update notifications" });
  }
};