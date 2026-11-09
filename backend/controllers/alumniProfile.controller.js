// Alumni profile: own profile, career/project/publication/contribution records,
// dashboard counts, and the public alumni directory.
// Email is never returned by any endpoint in this file.
const prisma = require("../lib/prisma");
const { sendError, parseId, readFields, getMyAlumni } = require("./alumni.helpers");

/* ------------------------------------------------------------------ */
/* The four record lists (career, projects, publications, contributions) */
/* all work the same way, so one config object describes each of them.   */
/* ------------------------------------------------------------------ */

// Used by career and project: end date cannot be before the start date.
const endAfterStart = (r) =>
  r.StartDate && r.EndDate && r.EndDate < r.StartDate ? "End date cannot be before the start date" : null;

const SECTIONS = {
  career: {
    model: prisma.career_history,
    idField: "CareerID",
    label: "Career record",
    orderBy: { StartDate: "desc" },
    fields: [
      { name: "Organization", label: "Organization", type: "text", required: true, max: 100 },
      { name: "Position", label: "Position", type: "text", required: true, max: 30 },
      { name: "StartDate", label: "Start date", type: "date", required: true },
      { name: "EndDate", label: "End date", type: "date" }, // empty = currently working here
    ],
    check: endAfterStart,
  },
  projects: {
    model: prisma.project,
    idField: "ProjectID",
    label: "Project",
    orderBy: { StartDate: "desc" },
    fields: [
      { name: "Title", label: "Title", type: "text", required: true, max: 100 },
      { name: "Description", label: "Description", type: "longtext" },
      { name: "StartDate", label: "Start date", type: "date" },
      { name: "EndDate", label: "End date", type: "date" },
      { name: "FundingAgency", label: "Funding agency", type: "text", max: 150 },
    ],
    check: endAfterStart,
  },
  publications: {
    model: prisma.publication,
    idField: "PublicationID",
    label: "Publication",
    orderBy: { PublicationDate: "desc" },
    fields: [
      { name: "Title", label: "Title", type: "text", required: true, max: 100 },
      { name: "PublicationType", label: "Publication type", type: "text", required: true, max: 50 },
      { name: "PublicationDate", label: "Publication date", type: "date" },
    ],
  },
  contributions: {
    model: prisma.contribution,
    idField: "ContributionID",
    label: "Contribution",
    orderBy: { ContributionDate: "desc" },
    fields: [
      { name: "CategoryType", label: "Category", type: "text", required: true, max: 50 },
      { name: "Description", label: "Description", type: "longtext", required: true },
      { name: "ContributionDate", label: "Contribution date", type: "date" },
    ],
    check: (r) => (r.ContributionDate && r.ContributionDate > new Date() ? "Contribution date cannot be in the future" : null),
  },
};

// Which columns we send back for a section (AlumniID is left out).
function selectFor(cfg) {
  const select = { [cfg.idField]: true };
  cfg.fields.forEach((f) => (select[f.name] = true));
  return select;
}

// Builds add / update / remove handlers for one section.
function makeSectionHandlers(cfg) {
  const select = selectFor(cfg);

  const add = async (req, res, next) => {
    try {
      const me = await getMyAlumni(req.user.id);
      const { data, error } = readFields(req.body || {}, cfg.fields, false);
      if (error) return res.status(400).json({ message: error });
      const problem = cfg.check && cfg.check(data);
      if (problem) return res.status(400).json({ message: problem });

      // AlumniID comes from the login token, not from the request
      const row = await cfg.model.create({ data: { ...data, AlumniID: me.AlumniID }, select });
      res.status(201).json(row);
    } catch (err) {
      sendError(err, res, next);
    }
  };

  const update = async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "Invalid id" });
      const me = await getMyAlumni(req.user.id);

      // Only find the record if it belongs to this alumnus; otherwise 404
      const existing = await cfg.model.findFirst({ where: { [cfg.idField]: id, AlumniID: me.AlumniID }, select });
      if (!existing) return res.status(404).json({ message: `${cfg.label} not found` });

      const { data, error } = readFields(req.body || {}, cfg.fields, true); // only sent fields change
      if (error) return res.status(400).json({ message: error });
      if (Object.keys(data).length === 0) return res.status(400).json({ message: "Send at least one field to change" });
      const problem = cfg.check && cfg.check({ ...existing, ...data }); // check old + new values together
      if (problem) return res.status(400).json({ message: problem });

      const row = await cfg.model.update({ where: { [cfg.idField]: id }, data, select });
      res.json(row);
    } catch (err) {
      sendError(err, res, next);
    }
  };

  const remove = async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "Invalid id" });
      const me = await getMyAlumni(req.user.id);

      const result = await cfg.model.deleteMany({ where: { [cfg.idField]: id, AlumniID: me.AlumniID } });
      if (result.count === 0) return res.status(404).json({ message: `${cfg.label} not found` });
      res.json({ message: `${cfg.label} deleted` });
    } catch (err) {
      sendError(err, res, next);
    }
  };

  return { add, update, remove };
}

const career = makeSectionHandlers(SECTIONS.career);
const projects = makeSectionHandlers(SECTIONS.projects);
const publications = makeSectionHandlers(SECTIONS.publications);
const contributions = makeSectionHandlers(SECTIONS.contributions);

exports.addCareer = career.add;
exports.updateCareer = career.update;
exports.deleteCareer = career.remove;
exports.addProject = projects.add;
exports.updateProject = projects.update;
exports.deleteProject = projects.remove;
exports.addPublication = publications.add;
exports.updatePublication = publications.update;
exports.deletePublication = publications.remove;
exports.addContribution = contributions.add;
exports.updateContribution = contributions.update;
exports.deleteContribution = contributions.remove;

/* ------------------------------ own profile ------------------------------ */

// GET /api/alumni/me
exports.getMyProfile = async (req, res, next) => {
  try {
    const profile = await prisma.alumni.findUnique({
      where: { UserID: req.user.id },
      select: {
        AlumniID: true,
        GraduationYear: true,
        ProfessionalBackground: true,
        ExpertiseArea: true,
        MentorshipAvailable: true,
        IsProfilePublic: true,
        user: { select: { Name: true, AccountStatus: true, ProfilePhoto: true } }, // no Email, no Password
        programme: {
          select: { ProgrammeID: true, ProgrammeName: true, department: { select: { DepartmentName: true } } },
        },
        career_history: { select: selectFor(SECTIONS.career), orderBy: SECTIONS.career.orderBy },
        project: { select: selectFor(SECTIONS.projects), orderBy: SECTIONS.projects.orderBy },
        publication: { select: selectFor(SECTIONS.publications), orderBy: SECTIONS.publications.orderBy },
        contribution: { select: selectFor(SECTIONS.contributions), orderBy: SECTIONS.contributions.orderBy },
      },
    });
    if (!profile) return res.status(404).json({ message: "Alumni profile not found" });
    res.json(profile);
  } catch (err) {
    sendError(err, res, next);
  }
};

// PUT /api/alumni/me  (only the 4 profile fields can change)
exports.updateMyProfile = async (req, res, next) => {
  try {
    const body = req.body || {};

    // These were verified by staff, so alumni cannot change them
    const locked = ["Name", "ProgrammeID", "GraduationYear"].filter((k) => k in body);
    if (locked.length) {
      return res.status(400).json({ message: `${locked.join(", ")} cannot be changed. Contact staff if it is wrong.` });
    }

    const me = await getMyAlumni(req.user.id);
    const data = {};

    // Text fields (optional, empty clears them)
    const text = readFields(
      body,
      [
        { name: "ProfessionalBackground", label: "Professional background", type: "longtext" },
        { name: "ExpertiseArea", label: "Expertise area", type: "text", max: 255 },
      ],
      true
    );
    if (text.error) return res.status(400).json({ message: text.error });
    Object.assign(data, text.data);

    // True/false fields
    for (const [name, label] of [["MentorshipAvailable", "Mentorship available"], ["IsProfilePublic", "Public profile"]]) {
      if (!(name in body)) continue;
      if (typeof body[name] !== "boolean") return res.status(400).json({ message: `${label} must be true or false` });
      data[name] = body[name];
    }

    if (Object.keys(data).length === 0) return res.status(400).json({ message: "Send at least one field to change" });

    const updated = await prisma.alumni.update({
      where: { AlumniID: me.AlumniID },
      data,
      select: { ProfessionalBackground: true, ExpertiseArea: true, MentorshipAvailable: true, IsProfilePublic: true },
    });
    res.json(updated);
  } catch (err) {
    sendError(err, res, next);
  }
};

// GET /api/alumni/me/dashboard  (counts only)
exports.getDashboard = async (req, res, next) => {
  try {
    const me = await getMyAlumni(req.user.id);
    const myOpps = { CreatorID: req.user.id };

    const [careerCount, projectCount, publicationCount, contributionCount, mentorship, opportunities, applications] =
      await Promise.all([
        prisma.career_history.count({ where: { AlumniID: me.AlumniID } }),
        prisma.project.count({ where: { AlumniID: me.AlumniID } }),
        prisma.publication.count({ where: { AlumniID: me.AlumniID } }),
        prisma.contribution.count({ where: { AlumniID: me.AlumniID } }),
        prisma.mentorship_request.groupBy({ by: ["Status"], where: { AlumniID: me.AlumniID }, _count: { _all: true } }),
        prisma.opportunity.groupBy({ by: ["Status"], where: myOpps, _count: { _all: true } }),
        prisma.application.groupBy({
          by: ["ApplicationStatus"],
          where: { opportunity: myOpps },
          _count: { _all: true },
        }),
      ]);

    // [{ Status: "Pending", _count: { _all: 2 } }] -> { Pending: 2 }
    const toObject = (rows, key) => Object.fromEntries(rows.map((r) => [r[key], r._count._all]));

    res.json({
      career: careerCount,
      projects: projectCount,
      publications: publicationCount,
      contributions: contributionCount,
      mentorshipRequests: toObject(mentorship, "Status"),
      opportunities: toObject(opportunities, "Status"),
      applications: toObject(applications, "ApplicationStatus"),
    });
  } catch (err) {
    sendError(err, res, next);
  }
};

/* ---------------------------- alumni directory ---------------------------- */

// Only Staff and Administrator may see profiles marked private
const canSeePrivate = (role) => role === "Staff" || role === "Administrator";

// What a directory visitor can see about an alumnus (no email, no contributions)
const PUBLIC_SELECT = {
  AlumniID: true,
  GraduationYear: true,
  ProfessionalBackground: true,
  ExpertiseArea: true,
  MentorshipAvailable: true,
  IsProfilePublic: true,
  user: { select: { Name: true } },
  programme: { select: { ProgrammeID: true, ProgrammeName: true } },
};

// Rules for who may be listed: Active accounts only, and public profiles unless Staff/Admin
function visibleTo(role) {
  const where = { user: { AccountStatus: "Active" } };
  if (!canSeePrivate(role)) where.IsProfilePublic = true;
  return where;
}

// GET /api/alumni?programmeId=&graduationYear=&expertise=&mentorshipAvailable=&page=&limit=
exports.listAlumni = async (req, res, next) => {
  try {
    const q = req.query;
    const where = visibleTo(req.user.role);

    if (q.programmeId !== undefined) {
      const id = parseId(q.programmeId);
      if (!id) return res.status(400).json({ message: "programmeId must be a positive whole number" });
      where.ProgrammeID = id;
    }
    if (q.graduationYear !== undefined) {
      if (!/^\d{4}$/.test(String(q.graduationYear))) {
        return res.status(400).json({ message: "graduationYear must be a 4-digit year" });
      }
      where.GraduationYear = Number(q.graduationYear);
    }
    if (q.expertise !== undefined) {
      if (typeof q.expertise !== "string" || q.expertise.trim().length > 100) {
        return res.status(400).json({ message: "expertise must be text of at most 100 characters" });
      }
      if (q.expertise.trim()) where.ExpertiseArea = { contains: q.expertise.trim() };
    }
    if (q.mentorshipAvailable !== undefined) {
      if (q.mentorshipAvailable !== "true" && q.mentorshipAvailable !== "false") {
        return res.status(400).json({ message: "mentorshipAvailable must be true or false" });
      }
      where.MentorshipAvailable = q.mentorshipAvailable === "true";
    }

    if (q.search !== undefined) {
      if (typeof q.search !== "string" || q.search.trim().length > 100) {
        return res.status(400).json({ message: "search must be text of at most 100 characters" });
      }
      const term = q.search.trim();
      if (term) {
        where.OR = [{ user: { Name: { contains: term } } }, { ExpertiseArea: { contains: term } }];
      }
    }

    // Pagination
    const page = q.page === undefined ? 1 : parseId(q.page);
    if (!page || page > 100000) return res.status(400).json({ message: "page must be a whole number from 1 to 100000" });
    const limit = q.limit === undefined ? 20 : parseId(q.limit);
    if (!limit || limit > 50) return res.status(400).json({ message: "limit must be between 1 and 50" });

    const [total, data] = await Promise.all([
      prisma.alumni.count({ where }),
      prisma.alumni.findMany({
        where,
        select: {
          ...PUBLIC_SELECT,
          // current job = the career record with no end date
          career_history: {
            where: { EndDate: null },
            orderBy: { StartDate: "desc" },
            take: 1,
            select: { Organization: true, Position: true },
          },
        },
        orderBy: [{ GraduationYear: "desc" }, { AlumniID: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    sendError(err, res, next);
  }
};

// GET /api/alumni/:id
exports.getAlumni = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    // Same visibility rules as the list, so a private profile looks like "not found"
    const profile = await prisma.alumni.findFirst({
      where: { AlumniID: id, ...visibleTo(req.user.role) },
      select: {
        ...PUBLIC_SELECT,
        career_history: { select: selectFor(SECTIONS.career), orderBy: SECTIONS.career.orderBy },
        project: { select: selectFor(SECTIONS.projects), orderBy: SECTIONS.projects.orderBy },
        publication: { select: selectFor(SECTIONS.publications), orderBy: SECTIONS.publications.orderBy },
      },
    });
    if (!profile) return res.status(404).json({ message: "Alumni profile not found" });
    res.json(profile);
  } catch (err) {
    sendError(err, res, next);
  }
};