const prisma = require("../lib/prisma");

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const student = await prisma.student.findUnique({
      where: { UserID: userId },
    });

    // Profile completion: the optional fields a student fills in
    const fields = student
      ? [student.PhoneNo, student.Dzongkhag, student.Gewog,
         student.Projects, student.TechnicalSkills, student.SoftSkills]
      : [];
    const filled = fields.filter((v) => v && String(v).trim() !== "").length;
    const profileCompletion = fields.length
      ? Math.round((filled / fields.length) * 100)
      : 0;

    const openInternship = {
      OpportunityType: "Internship",
      Status: "Open",
      OR: [{ Deadline: null }, { Deadline: { gte: now } }],
    };

    const [events, eventsThisMonth, internshipCount, opps, applicationCount] =
      await Promise.all([
        prisma.event.findMany({
          where: { Status: "Published", DateTime: { gte: now } },
          orderBy: { DateTime: "asc" },
          take: 3,
        }),
        prisma.event.count({
          where: { Status: "Published", DateTime: { gte: now, lt: monthEnd } },
        }),
        prisma.opportunity.count({ where: openInternship }),
        prisma.opportunity.findMany({
          where: openInternship,
          orderBy: { OpportunityID: "desc" },
          take: 3,
        }),
        student
          ? prisma.application.count({
              where: { StudentID: student.StudentID, ApplicationStatus: "Under Review" },
            })
          : 0,
      ]);

      const recentAnnouncements = await prisma.announcement.findMany({
  where: { Audience: { in: ["All", "Students"] } },
  orderBy: { CreatedAt: "desc" },
  take: 3,
});

    res.json({
      profileCompletion,
      upcomingEventsCount: eventsThisMonth,
      availableInternships: internshipCount,
      applicationsInProgress: applicationCount,
      upcomingEvents: events.map((e) => ({
        id: e.EventID,
        title: e.Title,
        location: e.Venue,
        event_date: e.DateTime,
      })),
      latestOpportunities: opps.map((o) => ({
        id: o.OpportunityID,
        title: o.Title,
        company: o.Organization,
        deadline: o.Deadline,
      })),
      announcements: recentAnnouncements.map((a) => ({
  id: a.AnnouncementID,
  title: a.Title,
  description: a.Message,
  date: a.CreatedAt,
})),

    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
};