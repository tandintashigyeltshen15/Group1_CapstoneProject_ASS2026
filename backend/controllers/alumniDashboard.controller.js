const prisma = require("../lib/prisma");

exports.getDashboard = async (req, res, next) => {
  try {
    const now = new Date();

    const me = await prisma.alumni.findUnique({
      where: { UserID: req.user.id },
      select: {
        AlumniID: true,
        ProfessionalBackground: true,
        ExpertiseArea: true,
        user: { select: { Name: true } },
        _count: { select: { career_history: true, project: true, publication: true } },
      },
    });
    if (!me) return res.status(403).json({ message: "Alumni profile not found" });

    const [
      pendingMentorship,
      upcomingEvents,
      registeredUpcoming,
      newApplications,
      eventList,
      postings,
      requests,
    ] = await Promise.all([
      prisma.mentorship_request.count({ where: { AlumniID: me.AlumniID, Status: "Pending" } }),
      prisma.event.count({ where: { Status: "Published", DateTime: { gte: now } } }),
      prisma.event_registration.count({
        where: { UserID: req.user.id, event: { Status: "Published", DateTime: { gte: now } } },
      }),
      // applications to postings I made that nobody has reviewed yet
      prisma.application.count({
        where: { ApplicationStatus: "Under Review", opportunity: { CreatorID: req.user.id } },
      }),
      prisma.event.findMany({
        where: { Status: "Published", DateTime: { gte: now } },
        orderBy: { DateTime: "asc" },
        take: 3,
        select: {
          EventID: true,
          Title: true,
          Venue: true,
          DateTime: true,
          event_registration: { where: { UserID: req.user.id }, select: { RegistrationID: true } },
        },
      }),
      prisma.opportunity.findMany({
        where: { CreatorID: req.user.id },
        orderBy: { OpportunityID: "desc" },
        take: 3,
        select: {
          OpportunityID: true,
          Title: true,
          Organization: true,
          Duration: true,
          Deadline: true,
          Status: true,
          _count: { select: { application: true } },
        },
      }),
      prisma.mentorship_request.findMany({
        where: { AlumniID: me.AlumniID, Status: "Pending" },
        orderBy: { RequestDate: "desc" },
        take: 3,
        select: {
          RequestID: true,
          RequestSubject: true,
          RequestDate: true,
          student: { select: { user: { select: { Name: true } } } },
        },
      }),
    ]);

    // Profile completion starts at 0 and rises as the alumnus fills these in
    const checks = [
      !!(me.ProfessionalBackground && me.ProfessionalBackground.trim()),
      !!(me.ExpertiseArea && me.ExpertiseArea.trim()),
      me._count.career_history > 0,
      me._count.project + me._count.publication > 0,
    ];
    const profileCompletion = Math.round((checks.filter(Boolean).length / checks.length) * 100);

    res.json({
      name: me.user.Name,
      stats: {
        profileCompletion,
        pendingMentorship,
        upcomingEvents,
        registeredUpcoming,
        newApplications,
      },
      upcomingEventList: eventList.map((e) => ({
        id: e.EventID,
        title: e.Title,
        venue: e.Venue || "",
        dateTime: e.DateTime,
        registered: e.event_registration.length > 0,
      })),
      postings: postings.map((o) => ({
        id: o.OpportunityID,
        title: o.Title,
        organization: o.Organization,
        duration: o.Duration || "",
        deadline: o.Deadline,
        status: o.Status,
        applications: o._count.application,
      })),
      requests: requests.map((r) => ({
        id: r.RequestID,
        student: r.student.user.Name,
        subject: r.RequestSubject,
        date: r.RequestDate,
      })),
    });
  } catch (err) {
    next(err);
  }
};