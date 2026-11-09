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
    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      totalAlumni,
      activeMentors,
      totalContributions,
      openOpportunities,
      upcomingEvents,
      pendingStaff,
      recentContributions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { AccountStatus: "Active" } }),
      prisma.user.count({ where: { AccountStatus: "Pending" } }),
      prisma.alumni.count(),
      prisma.alumni.count({
        where: {
          MentorshipAvailable: true,
          user: { AccountStatus: "Active" },
        },
      }),
      prisma.contribution.count(),
      prisma.opportunity.count({ where: { Status: "Open" } }),
      prisma.event.count({ where: { Status: "Published", DateTime: { gte: now } } }),
      prisma.user.count({
        where: { AccountStatus: "Pending", role: { RoleName: "Staff" } },
      }),
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
    ]);

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        pendingUsers,
        totalAlumni,
        activeMentors,
        totalContributions,
        openOpportunities,
        upcomingEvents,
        pendingStaff,
      },
      recentContributions: recentContributions.map((row) => ({
        id: row.ContributionID,
        donor: row.alumni.user.Name,
        type: row.CategoryType,
        details: row.Description,
        date: row.ContributionDate,
      })),
    });
  } catch (err) {
    next(err);
  }
};

exports.getReports = async (req, res, next) => {
  try {
    const [roles, contributionsByType, opportunitiesByStatus, eventsByStatus] =
      await Promise.all([
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
      ]);

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
