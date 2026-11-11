const prisma = require("../lib/prisma");

exports.getReports = async (req, res, next) => {
  try {
    const now = new Date();
    const [
      activeMentorship,
      applications,
      openPostings,
      upcomingEvents,
      pendingVerification,
      verifiedAlumni,
      mentorshipRows,
      completedEvents,
      cancelledEvents,
      opps,
      appRows,
    ] = await Promise.all([
      prisma.mentorship_request.count({ where: { Status: "Pending" } }),
      prisma.application.count(),
      prisma.opportunity.count({ where: { Status: "Open" } }),
      prisma.event.count({ where: { Status: "Published", DateTime: { gte: now } } }),
      prisma.user.count({ where: { AccountStatus: "Pending", role: { RoleName: "Alumni" } } }),
      prisma.alumni.count({ where: { user: { AccountStatus: "Active" } } }),
      prisma.mentorship_request.groupBy({ by: ["Status"], _count: { RequestID: true } }),
      prisma.event.count({ where: { Status: "Published", DateTime: { lt: now } } }),
      prisma.event.count({ where: { Status: "Cancelled" } }),
      prisma.opportunity.findMany({
        select: { OpportunityID: true, Title: true, Status: true },
        orderBy: { OpportunityID: "desc" },
        take: 100,
      }),
      prisma.application.groupBy({
        by: ["OpportunityID", "ApplicationStatus"],
        _count: { ApplicationID: true },
      }),
    ]);

    const byPosting = {};
    for (const r of appRows) {
      (byPosting[r.OpportunityID] ||= {})[r.ApplicationStatus] = r._count.ApplicationID;
    }

    res.json({
      stats: {
        activeMentorship,
        applications,
        openPostings,
        upcomingEvents,
        pendingVerification,
        verifiedAlumni,
      },
      postings: opps.map((o) => {
        const byStatus = byPosting[o.OpportunityID] || {};
        return {
          id: o.OpportunityID,
          title: o.Title,
          status: o.Status,
          total: Object.values(byStatus).reduce((s, n) => s + n, 0),
          byStatus,
        };
      }),
      mentorshipByStatus: mentorshipRows.map((m) => ({ status: m.Status, count: m._count.RequestID })),
      eventsByStatus: [
        { status: "Upcoming", count: upcomingEvents },
        { status: "Completed", count: completedEvents },
        { status: "Cancelled", count: cancelledEvents },
      ],
    });
  } catch (err) {
    next(err);
  }
};