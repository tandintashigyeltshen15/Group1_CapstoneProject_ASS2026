const prisma = require("../lib/prisma");

const TYPES = ["Internship", "Job"];
const OPP_STATUSES = ["Open", "Filled"];
const APP_STATUSES = ["Under Review", "Shortlisted", "Accepted", "Not Selected"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

exports.list = async (req, res, next) => {
  try {
    const rows = await prisma.opportunity.findMany({
      orderBy: { OpportunityID: "desc" },
      take: 200,
      include: {
        user: { select: { Name: true } },
        application: {
          orderBy: { SubmissionDate: "desc" },
          include: {
            student: { select: { StudentID: true, user: { select: { Name: true } } } },
          },
        },
      },
    });

    res.json(
      rows.map((o) => ({
        id: o.OpportunityID,
        title: o.Title,
        organization: o.Organization,
        type: o.OpportunityType,
        description: o.Description,
        eligibility: o.EligibilityRequirements || "",
        duration: o.Duration || "",
        deadline: o.Deadline,
        startDate: o.StartDate,
        status: o.Status,
        postedBy: o.user.Name,
        applications: o.application.map((a) => ({
          id: a.ApplicationID,
          studentName: a.student.user.Name,
          studentId: a.student.StudentID,
          appliedAt: a.SubmissionDate,
          status: a.ApplicationStatus,
        })),
      }))
    );
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const b = req.body || {};
    const title = String(b.title || "").trim();
    const organization = String(b.organization || "").trim();
    const description = String(b.description || "").trim();
    const duration = String(b.duration || "").trim();
    const eligibility = String(b.eligibility || "").trim();

    if (title.length < 3 || title.length > 150) {
      return res.status(400).json({ message: "Title must be 3 to 150 characters" });
    }
    if (organization.length < 2 || organization.length > 100) {
      return res.status(400).json({ message: "Organisation must be 2 to 100 characters" });
    }
    if (!TYPES.includes(b.type)) {
      return res.status(400).json({ message: `Type must be one of: ${TYPES.join(", ")}` });
    }
    if (description.length < 5) {
      return res.status(400).json({ message: "Add a description" });
    }
    if (duration.length > 50) {
      return res.status(400).json({ message: "Duration must be 50 characters or less" });
    }

    let deadline = null;
    if (b.deadline) {
      if (!DATE_RE.test(b.deadline)) return res.status(400).json({ message: "Invalid deadline" });
      deadline = new Date(`${b.deadline}T23:59:00`);
      if (deadline < new Date()) {
        return res.status(400).json({ message: "The deadline cannot be in the past" });
      }
    }
    let startDate = null;
    if (b.startDate) {
      if (!DATE_RE.test(b.startDate)) return res.status(400).json({ message: "Invalid start date" });
      if (b.deadline && b.startDate < b.deadline) {
        return res.status(400).json({ message: "The start date should be after the application deadline" });
      }
      startDate = new Date(b.startDate);
    }

    const created = await prisma.opportunity.create({
      data: {
        CreatorID: req.user.id,
        Title: title,
        Organization: organization,
        OpportunityType: b.type,
        Description: description,
        Deadline: deadline,
        StartDate: startDate,
        Duration: duration || null,
        EligibilityRequirements: eligibility || null,
        Status: "Open",
      },
    });
    res.status(201).json({ message: "Opportunity posted", id: created.OpportunityID });
  } catch (err) {
    next(err);
  }
};

exports.setStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const status = (req.body || {}).status;
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: "Invalid opportunity" });
    if (!OPP_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${OPP_STATUSES.join(", ")}` });
    }
    const result = await prisma.opportunity.updateMany({
      where: { OpportunityID: id },
      data: { Status: status },
    });
    if (result.count === 0) return res.status(404).json({ message: "Opportunity not found" });
    res.json({ message: "Status updated" });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: "Invalid opportunity" });

    const applications = await prisma.application.count({ where: { OpportunityID: id } });
    if (applications > 0) {
      return res.status(409).json({
        message: "This posting has applications, so it can't be deleted. Mark it as filled instead.",
      });
    }
    const result = await prisma.opportunity.deleteMany({ where: { OpportunityID: id } });
    if (result.count === 0) return res.status(404).json({ message: "Opportunity not found" });
    res.json({ message: "Opportunity deleted" });
  } catch (err) {
    next(err);
  }
};

// PATCH /applications/:id  { status } — also tells the student
exports.updateApplication = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const status = (req.body || {}).status;
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: "Invalid application" });
    if (!APP_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${APP_STATUSES.join(", ")}` });
    }

    const app = await prisma.application.findUnique({
      where: { ApplicationID: id },
      include: {
        opportunity: { select: { Title: true } },
        student: { select: { UserID: true } },
      },
    });
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (app.ApplicationStatus === status) return res.json({ message: "No change" });

    await prisma.$transaction([
      prisma.application.update({ where: { ApplicationID: id }, data: { ApplicationStatus: status } }),
      prisma.notification.create({
        data: {
          UserID: app.student.UserID,
          NotificationType: "Application Status",
          Message: `Your application for ${app.opportunity.Title} is now ${status}.`.slice(0, 200),
        },
      }),
    ]);
    res.json({ message: "Application updated" });
  } catch (err) {
    next(err);
  }
};