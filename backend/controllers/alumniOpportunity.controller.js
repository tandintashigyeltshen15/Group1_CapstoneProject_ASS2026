// Opportunities (internships/jobs) posted by the logged-in alumnus,
// and the applications students send to them.
const prisma = require("../lib/prisma");
const { HttpError, sendError, parseId, fit, readFields, getMyAlumni } = require("./alumni.helpers");

const OPP_STATUSES = ["Open", "Filled"]; // allowed by the database CHECK
const APP_STATUSES = ["Under Review", "Shortlisted", "Accepted", "Not Selected"]; // same

// Fields an alumnus can set when posting or editing (Status has its own endpoint)
const FIELDS = [
  { name: "Title", label: "Title", type: "text", required: true, max: 150 },
  { name: "Organization", label: "Organization", type: "text", required: true, max: 100 },
  { name: "OpportunityType", label: "Opportunity type", type: "text", required: true, max: 30 },
  { name: "Description", label: "Description", type: "longtext", required: true },
  { name: "Deadline", label: "Deadline", type: "datetime" },
  { name: "StartDate", label: "Start date", type: "date" },
  { name: "Duration", label: "Duration", type: "text", max: 50 },
  { name: "EligibilityRequirements", label: "Eligibility requirements", type: "longtext" },
];

const OPP_SELECT = {
  OpportunityID: true,
  Title: true,
  Organization: true,
  OpportunityType: true,
  Description: true,
  Deadline: true,
  StartDate: true,
  Duration: true,
  EligibilityRequirements: true,
  Status: true,
};

// Applicant info shown to the alumnus (no email, no phone)
const APPLICATION_SELECT = {
  ApplicationID: true,
  SubmissionDate: true,
  ApplicationStatus: true,
  student: {
    select: {
      StudentID: true,
      JoinYear: true,
      Projects: true,
      TechnicalSkills: true,
      SoftSkills: true,
      user: { select: { Name: true } },
      programme: { select: { ProgrammeName: true } },
    },
  },
};

/* ------------------------------ opportunities ------------------------------ */

// GET /api/alumni/me/opportunities?status=Open
exports.listMyOpportunities = async (req, res, next) => {
  try {
    await getMyAlumni(req.user.id);
    const where = { CreatorID: req.user.id };

    if (req.query.status !== undefined) {
      if (!OPP_STATUSES.includes(req.query.status)) {
        return res.status(400).json({ message: `status must be one of: ${OPP_STATUSES.join(", ")}` });
      }
      where.Status = req.query.status;
    }

    const rows = await prisma.opportunity.findMany({
      where,
      select: { ...OPP_SELECT, _count: { select: { application: true } } }, // how many students applied
      orderBy: { OpportunityID: "desc" },
    });
    res.json(rows);
  } catch (err) {
    sendError(err, res, next);
  }
};

// POST /api/alumni/me/opportunities
exports.createOpportunity = async (req, res, next) => {
  try {
    await getMyAlumni(req.user.id);
    const { data, error } = readFields(req.body || {}, FIELDS, false);
    if (error) return res.status(400).json({ message: error });

    // CreatorID comes from the login token; Status starts as "Open" (database default)
    const row = await prisma.opportunity.create({
      data: { ...data, CreatorID: req.user.id },
      select: OPP_SELECT,
    });
    res.status(201).json(row);
  } catch (err) {
    sendError(err, res, next);
  }
};

// PUT /api/alumni/me/opportunities/:id  (only the fields you send are changed)
exports.updateOpportunity = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    await getMyAlumni(req.user.id);

    const mine = await prisma.opportunity.findFirst({
      where: { OpportunityID: id, CreatorID: req.user.id }, // someone else's = 404
      select: { OpportunityID: true },
    });
    if (!mine) return res.status(404).json({ message: "Opportunity not found" });

    const { data, error } = readFields(req.body || {}, FIELDS, true);
    if (error) return res.status(400).json({ message: error });
    if (Object.keys(data).length === 0) return res.status(400).json({ message: "Send at least one field to change" });

    const row = await prisma.opportunity.update({ where: { OpportunityID: id }, data, select: OPP_SELECT });
    res.json(row);
  } catch (err) {
    sendError(err, res, next);
  }
};

// PATCH /api/alumni/me/opportunities/:id   body: { "Status": "Open" | "Filled" }
exports.setOpportunityStatus = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    const status = (req.body || {}).Status;
    if (!OPP_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${OPP_STATUSES.join(", ")}` });
    }
    await getMyAlumni(req.user.id);

    const result = await prisma.opportunity.updateMany({
      where: { OpportunityID: id, CreatorID: req.user.id },
      data: { Status: status },
    });
    if (result.count === 0) return res.status(404).json({ message: "Opportunity not found" });

    const row = await prisma.opportunity.findUnique({ where: { OpportunityID: id }, select: OPP_SELECT });
    res.json(row);
  } catch (err) {
    sendError(err, res, next);
  }
};

// DELETE /api/alumni/me/opportunities/:id
exports.deleteOpportunity = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    await getMyAlumni(req.user.id);

    await prisma.$transaction(async (tx) => {
      const mine = await tx.opportunity.findFirst({
        where: { OpportunityID: id, CreatorID: req.user.id },
        select: { _count: { select: { application: true } } },
      });
      if (!mine) throw new HttpError(404, "Opportunity not found");

      // The database does not allow deleting an opportunity that has applications
      // (and students' applications are not ours to delete).
      if (mine._count.application > 0) {
        throw new HttpError(409, "This opportunity has applications and cannot be deleted. Mark it as Filled instead.");
      }
      await tx.opportunity.delete({ where: { OpportunityID: id } });
    });

    res.json({ message: "Opportunity deleted" });
  } catch (err) {
    sendError(err, res, next);
  }
};

/* ------------------------------- applications ------------------------------- */

// GET /api/alumni/me/opportunities/:id/applications?status=Shortlisted
exports.listApplications = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    await getMyAlumni(req.user.id);

    const where = { OpportunityID: id, opportunity: { CreatorID: req.user.id } }; // only my opportunities

    if (req.query.status !== undefined) {
      if (!APP_STATUSES.includes(req.query.status)) {
        return res.status(400).json({ message: `status must be one of: ${APP_STATUSES.join(", ")}` });
      }
      where.ApplicationStatus = req.query.status;
    }

    // Make sure the opportunity exists and is mine, so a wrong id gives 404 (not an empty list)
    const mine = await prisma.opportunity.findFirst({
      where: { OpportunityID: id, CreatorID: req.user.id },
      select: { OpportunityID: true },
    });
    if (!mine) return res.status(404).json({ message: "Opportunity not found" });

    const rows = await prisma.application.findMany({
      where,
      select: APPLICATION_SELECT,
      orderBy: { SubmissionDate: "desc" },
    });
    res.json(rows);
  } catch (err) {
    sendError(err, res, next);
  }
};

// PATCH /api/alumni/me/applications/:id   body: { "ApplicationStatus": "Shortlisted" }
exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    const status = (req.body || {}).ApplicationStatus;
    if (!APP_STATUSES.includes(status)) {
      return res.status(400).json({ message: `ApplicationStatus must be one of: ${APP_STATUSES.join(", ")}` });
    }
    await getMyAlumni(req.user.id);

    // The status change and the student's notification succeed or fail together
    const updated = await prisma.$transaction(async (tx) => {
      const application = await tx.application.findFirst({
        where: { ApplicationID: id, opportunity: { CreatorID: req.user.id } }, // my opportunities only
        select: {
          ApplicationStatus: true,
          student: { select: { UserID: true } },
          opportunity: { select: { Title: true } },
        },
      });
      if (!application) throw new HttpError(404, "Application not found");

      // Same status again: nothing to change, and no repeat notification
      if (application.ApplicationStatus !== status) {
        await tx.application.update({ where: { ApplicationID: id }, data: { ApplicationStatus: status } });
        await tx.notification.create({
          data: {
            UserID: application.student.UserID,
            NotificationType: "Application",
            Message: fit(`Your application for "${fit(application.opportunity.Title, 100)}" is now: ${status}`, 200),
          },
        });
      }

      return tx.application.findUnique({ where: { ApplicationID: id }, select: APPLICATION_SELECT });
    });

    res.json(updated);
  } catch (err) {
    sendError(err, res, next);
  }
};