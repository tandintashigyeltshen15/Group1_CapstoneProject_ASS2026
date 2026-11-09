const prisma = require("../lib/prisma");

exports.getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const openFilter = {
      Status: "Open",
      OR: [{ Deadline: null }, { Deadline: { gte: now } }],
    };

    const [
      pendingAlumniCount,
      openOpportunities,
      newApplications,
      upcomingEvents,
      pendingAlumni,
      eventList,
      recentApplications,
      me,
    ] = await Promise.all([
      prisma.user.count({
        where: { AccountStatus: "Pending", role: { RoleName: "Alumni" } },
      }),
      prisma.opportunity.count({ where: openFilter }),
      // applications nobody has moved past the starting status yet
      prisma.application.count({ where: { ApplicationStatus: "Under Review" } }),
      prisma.event.count({ where: { Status: "Published", DateTime: { gte: now } } }),
      prisma.user.findMany({
        where: { AccountStatus: "Pending", role: { RoleName: "Alumni" } },
        orderBy: { CreatedAt: "asc" },
        take: 3,
        select: {
          UserID: true,
          Name: true,
          CreatedAt: true,
          alumni: {
            select: {
              GraduationYear: true,
              programme: { select: { ProgrammeName: true } },
            },
          },
        },
      }),
      prisma.event.findMany({
        where: { Status: "Published", DateTime: { gte: now } },
        orderBy: { DateTime: "asc" },
        take: 3,
        select: { EventID: true, Title: true, Venue: true, DateTime: true },
      }),
      prisma.application.findMany({
        orderBy: { SubmissionDate: "desc" },
        take: 4,
        select: {
          ApplicationID: true,
          ApplicationStatus: true,
          SubmissionDate: true,
          student: { select: { user: { select: { Name: true } } } },
          opportunity: { select: { Title: true } },
        },
      }),
      prisma.user.findUnique({
        where: { UserID: req.user.id },
        select: { Name: true },
      }),
    ]);

    res.json({
      name: me?.Name || "",
      stats: {
        pendingVerifications: pendingAlumniCount,
        openOpportunities,
        newApplications,
        upcomingEvents,
      },
      pendingAlumni: pendingAlumni.map((u) => ({
        id: u.UserID,
        name: u.Name,
        programme: u.alumni?.programme.ProgrammeName || "",
        graduationYear: u.alumni?.GraduationYear || null,
        appliedAt: u.CreatedAt,
      })),
      upcomingEventList: eventList.map((e) => ({
        id: e.EventID,
        title: e.Title,
        venue: e.Venue || "",
        dateTime: e.DateTime,
      })),
      recentApplications: recentApplications.map((a) => ({
        id: a.ApplicationID,
        studentName: a.student.user.Name,
        opportunity: a.opportunity.Title,
        status: a.ApplicationStatus,
        date: a.SubmissionDate,
      })),
    });
  } catch (err) {
    next(err);
  }
};