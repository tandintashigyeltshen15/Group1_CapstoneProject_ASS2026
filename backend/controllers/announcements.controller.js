const prisma = require("../lib/prisma");

const AUDIENCES = ["All", "Students", "Alumni"];
const ROLE_FOR = { Students: "Student", Alumni: "Alumni" };

// POST /api/announcements   { title, message, audience }
exports.createAnnouncement = async (req, res, next) => {
  try {
    const b = req.body || {};
    const title = String(b.title || "").trim();
    const message = String(b.message || "").trim();
    const audience = b.audience || "All";

    if (title.length < 3 || title.length > 150) {
      return res.status(400).json({ message: "Title must be 3 to 150 characters" });
    }
    if (message.length < 5 || message.length > 2000) {
      return res.status(400).json({ message: "Message must be 5 to 2000 characters" });
    }
    if (!AUDIENCES.includes(audience)) {
      return res.status(400).json({ message: `Audience must be one of: ${AUDIENCES.join(", ")}` });
    }

    // Only approved accounts, and never the person posting
    const roleFilter =
      audience === "All"
        ? { in: ["Student", "Alumni", "Staff", "Administrator"] }
        : ROLE_FOR[audience];
    const recipients = await prisma.user.findMany({
      where: {
        AccountStatus: "Active",
        UserID: { not: req.user.id },
        role: { RoleName: roleFilter },
      },
      select: { UserID: true },
    });

    // The notification table only holds 200 characters; the full text stays in `announcement`
    const preview = `${title}: ${message}`.slice(0, 200);

    const [announcement] = await prisma.$transaction([
      prisma.announcement.create({
        data: { CreatorID: req.user.id, Title: title, Message: message, Audience: audience },
      }),
      prisma.notification.createMany({
        data: recipients.map((r) => ({
          UserID: r.UserID,
          NotificationType: "Announcement",
          Message: preview,
        })),
      }),
    ]);

    res.status(201).json({
      message: `Announcement sent to ${recipients.length} ${recipients.length === 1 ? "person" : "people"}`,
      id: announcement.AnnouncementID,
      reached: recipients.length,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/announcements  (everyone sees what was meant for their role; staff and admin see all)
exports.listAnnouncements = async (req, res, next) => {
  try {
    const role = req.user.role;
    const where =
      role === "Student"
        ? { Audience: { in: ["All", "Students"] } }
        : role === "Alumni"
        ? { Audience: { in: ["All", "Alumni"] } }
        : {};

    const rows = await prisma.announcement.findMany({
      where,
      orderBy: { CreatedAt: "desc" },
      take: 50,
      select: {
        AnnouncementID: true,
        Title: true,
        Message: true,
        Audience: true,
        CreatedAt: true,
        CreatorID: true,
        user: { select: { Name: true } },
      },
    });

    res.json(
      rows.map((a) => ({
        id: a.AnnouncementID,
        title: a.Title,
        message: a.Message,
        audience: a.Audience,
        date: a.CreatedAt,
        postedBy: a.user.Name,
        mine: a.CreatorID === req.user.id,
      }))
    );
  } catch (err) {
    next(err);
  }
};

// DELETE /api/announcements/:id  (the author or an administrator)
exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: "Invalid announcement" });
    }
    const a = await prisma.announcement.findUnique({ where: { AnnouncementID: id } });
    if (!a) return res.status(404).json({ message: "Announcement not found" });
    if (a.CreatorID !== req.user.id && req.user.role !== "Administrator") {
      return res.status(403).json({ message: "You can only delete your own announcements" });
    }
    await prisma.announcement.delete({ where: { AnnouncementID: id } });
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    next(err);
  }
};