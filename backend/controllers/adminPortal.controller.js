const prisma = require("../lib/prisma");

const userProfile = {
  role: { select: { RoleName: true } },
  alumni: {
    select: {
      GraduationYear: true,
      programme: { select: { ProgrammeName: true } },
    },
  },
  student: {
    select: {
      JoinYear: true,
      programme: { select: { ProgrammeName: true } },
    },
  },
  staff: {
    select: {
      Designation: true,
      department: { select: { DepartmentName: true } },
    },
  },
};

function toAdminUser(user) {
  let detail = "";
  if (user.alumni) {
    detail = `${user.alumni.programme.ProgrammeName}, ${user.alumni.GraduationYear}`;
  } else if (user.student) {
    detail = `${user.student.programme.ProgrammeName}, joined ${user.student.JoinYear}`;
  } else if (user.staff) {
    detail = user.staff.Designation || user.staff.department.DepartmentName;
  } else if (user.role.RoleName === "Administrator") {
    detail = "System Administration";
  }

  return {
    id: user.UserID,
    name: user.Name,
    email: user.Email,
    role: user.role.RoleName,
    status: user.AccountStatus,
    joined: user.CreatedAt,
    detail,
  };
}

exports.listUsers = async (req, res, next) => {
  try {
    const rows = await prisma.user.findMany({
      select: {
        UserID: true,
        Name: true,
        Email: true,
        AccountStatus: true,
        CreatedAt: true,
        ...userProfile,
      },
      orderBy: { CreatedAt: "desc" },
    });
    res.json(rows.map(toAdminUser));
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    if (id === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    await prisma.user.delete({ where: { UserID: id } });
    res.json({ message: "User deleted" });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "User not found" });
    if (err.code === "P2003") {
      return res.status(409).json({ message: "This account owns records that must be reassigned before deletion" });
    }
    next(err);
  }
};

exports.getDashboard = async (req, res, next) => {
  try {
    const now = new Date();

    // last 7 days, oldest first
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const days = Array.from(
      { length: 7 },
      (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - i))
    );
    const since = days[0];
    const dayKey = (d) => {
      const x = new Date(d);
      return new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    };
    const bucket = (rows, field) => {
      const counts = new Map(days.map((d) => [d.getTime(), 0]));
      for (const r of rows) {
        const k = dayKey(r[field]);
        if (counts.has(k)) counts.set(k, counts.get(k) + 1);
      }
      return days.map((d) => counts.get(d.getTime()));
    };

    const [
      totalAlumni,
      totalStudents,
      activeMentors,
      openInternships,
      upcomingEvents,
      pendingAlumni,
      pendingStaff,
      pendingMentorship,
      applications,
      unreadNotifications,
      recentContributions,
      upcomingEventList,
      newUsers,
      newApplications,
      newMentorship,
      newRegistrations,
    ] = await Promise.all([
      prisma.alumni.count({ where: { user: { AccountStatus: "Active" } } }),
      prisma.student.count({ where: { user: { AccountStatus: "Active" } } }),
      prisma.alumni.count({
        where: { MentorshipAvailable: true, user: { AccountStatus: "Active" } },
      }),
      prisma.opportunity.count({
        where: {
          OpportunityType: "Internship",
          Status: "Open",
          OR: [{ Deadline: null }, { Deadline: { gte: now } }],
        },
      }),
      prisma.event.count({ where: { Status: "Published", DateTime: { gte: now } } }),
      prisma.user.count({
        where: { AccountStatus: "Pending", role: { RoleName: "Alumni" } },
      }),
      prisma.user.count({
        where: { AccountStatus: "Pending", role: { RoleName: "Staff" } },
      }),
      prisma.mentorship_request.count({ where: { Status: "Pending" } }),
      prisma.application.count(),
      prisma.notification.count({ where: { UserID: req.user.id, IsRead: false } }),
      prisma.contribution.findMany({
        take: 5,
        orderBy: { ContributionDate: "desc" },
        select: {
          ContributionID: true,
          CategoryType: true,
          Description: true,
          ContributionDate: true,
          alumni: { select: { user: { select: { Name: true } } } },
        },
      }),
      prisma.event.findMany({
        where: { Status: "Published", DateTime: { gte: now } },
        orderBy: { DateTime: "asc" },
        take: 4,
        select: { EventID: true, Title: true, Venue: true, DateTime: true },
      }),
      prisma.user.findMany({
        where: { CreatedAt: { gte: since } },
        select: { CreatedAt: true },
      }),
      prisma.application.findMany({
        where: { SubmissionDate: { gte: since } },
        select: { SubmissionDate: true },
      }),
      prisma.mentorship_request.findMany({
        where: { RequestDate: { gte: since } },
        select: { RequestDate: true },
      }),
      prisma.event_registration.findMany({
        where: { RegistrationDate: { gte: since } },
        select: { RegistrationDate: true },
      }),
    ]);

    res.json({
      stats: {
        totalAlumni,
        totalStudents,
        activeMentors,
        openInternships,
        upcomingEvents,
        pendingAlumni,
        pendingStaff,
        pendingMentorship,
        applications,
        unreadNotifications,
      },
      activity: {
        labels: days.map((d) => d.toLocaleDateString("en-GB", { weekday: "short" })),
        series: [
          { key: "users", label: "New Users", values: bucket(newUsers, "CreatedAt") },
          { key: "applications", label: "Applications", values: bucket(newApplications, "SubmissionDate") },
          { key: "mentorship", label: "Mentorship Requests", values: bucket(newMentorship, "RequestDate") },
          { key: "registrations", label: "Event Registrations", values: bucket(newRegistrations, "RegistrationDate") },
        ],
      },
      recentContributions: recentContributions.map((row) => ({
        id: row.ContributionID,
        donor: row.alumni.user.Name,
        type: row.CategoryType,
        details: row.Description,
        date: row.ContributionDate,
      })),
      upcomingEventList: upcomingEventList.map((e) => ({
        id: e.EventID,
        title: e.Title,
        venue: e.Venue || "",
        dateTime: e.DateTime,
      })),
    });
  } catch (err) {
    next(err);
  }
};

exports.getReports = async (req, res, next) => {
  try {
    const [
      roles,
      contributionsByType,
      opportunitiesByStatus,
      eventsByStatus,
      mentorshipByStatus,
      applicationsByStatus,
      postings,
    ] = await Promise.all([
      prisma.role.findMany({
        select: {
          RoleName: true,
          _count: { select: { user: true } },
        },
        orderBy: { RoleName: "asc" },
      }),
      prisma.contribution.groupBy({
        by: ["CategoryType"],
        _count: { ContributionID: true },
        orderBy: { CategoryType: "asc" },
      }),
      prisma.opportunity.groupBy({
        by: ["OpportunityType", "Status"],
        _count: { OpportunityID: true },
        orderBy: [{ OpportunityType: "asc" }, { Status: "asc" }],
      }),
      prisma.event.groupBy({
        by: ["Status"],
        _count: { EventID: true },
        orderBy: { Status: "asc" },
      }),
      // required by the proposal: mentorship requests
      prisma.mentorship_request.groupBy({
        by: ["Status"],
        _count: { RequestID: true },
        orderBy: { Status: "asc" },
      }),
      prisma.application.groupBy({
        by: ["ApplicationStatus"],
        _count: { ApplicationID: true },
        orderBy: { ApplicationStatus: "asc" },
      }),
      // required by the proposal: applications received per posting (zero included)
      prisma.opportunity.findMany({
        select: {
          OpportunityID: true,
          Title: true,
          Organization: true,
          OpportunityType: true,
          Status: true,
          _count: { select: { application: true } },
        },
        orderBy: { OpportunityID: "desc" },
        take: 100,
      }),
    ]);

    const mentorship = mentorshipByStatus.map((row) => ({
      status: row.Status,
      count: row._count.RequestID,
    }));

    res.json({
      usersByRole: roles.map((role) => ({
        role: role.RoleName,
        count: role._count.user,
      })),
      contributionsByType: contributionsByType.map((row) => ({
        type: row.CategoryType,
        count: row._count.ContributionID,
      })),
      opportunitiesByStatus: opportunitiesByStatus.map((row) => ({
        type: row.OpportunityType,
        status: row.Status,
        count: row._count.OpportunityID,
      })),
      eventsByStatus: eventsByStatus.map((row) => ({
        status: row.Status,
        count: row._count.EventID,
      })),
      activeMentorshipRequests: mentorship.find((m) => m.status === "Pending")?.count || 0,
      mentorshipByStatus: mentorship,
      applicationsByStatus: applicationsByStatus.map((row) => ({
        status: row.ApplicationStatus,
        count: row._count.ApplicationID,
      })),
      applicationsByOpportunity: postings.map((p) => ({
        id: p.OpportunityID,
        title: p.Title,
        organization: p.Organization,
        type: p.OpportunityType,
        status: p.Status,
        applications: p._count.application,
      })),
    });
  } catch (err) {
    next(err);
  }
};

exports.listContributions = async (req, res, next) => {
  try {
    const rows = await prisma.contribution.findMany({
      include: {
        alumni: {
          include: {
            user: { select: { Name: true, Email: true } },
          },
        },
      },
      orderBy: [{ ContributionDate: "desc" }, { ContributionID: "desc" }],
    });

    res.json(
      rows.map((row) => ({
        id: row.ContributionID,
        donor: row.alumni.user.Name,
        email: row.alumni.user.Email,
        donorType: "Alumni",
        type: row.CategoryType,
        details: row.Description,
        date: row.ContributionDate,
      }))
    );
  } catch (err) {
    next(err);
  }
};

exports.listOpportunities = async (req, res, next) => {
  try {
    const rows = await prisma.opportunity.findMany({
      include: { user: { select: { Name: true } } },
      orderBy: { OpportunityID: "desc" },
    });
    res.json(
      rows.map((row) => ({
        id: row.OpportunityID,
        title: row.Title,
        type: row.OpportunityType,
        company: row.Organization,
        postedBy: row.user.Name,
        deadline: row.Deadline,
        status: row.Status,
        description: row.Description,
      }))
    );
  } catch (err) {
    next(err);
  }
};

exports.listEvents = async (req, res, next) => {
  try {
    const rows = await prisma.event.findMany({
      include: { user: { select: { Name: true } } },
      orderBy: [{ DateTime: "asc" }, { EventID: "desc" }],
    });
    res.json(
      rows.map((row) => ({
        id: row.EventID,
        title: row.Title,
        organizer: row.user.Name,
        venue: row.Venue || "",
        dateTime: row.DateTime,
        status: row.Status,
        description: row.Description || "",
      }))
    );
  } catch (err) {
    next(err);
  }
};