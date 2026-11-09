// Mentorship requests sent to the logged-in alumnus.
// Alumni can read their own requests and accept or decline them.
const prisma = require("../lib/prisma");
const { HttpError, sendError, parseId, fit, getMyAlumni } = require("./alumni.helpers");

const STATUSES = ["Pending", "Accepted", "Declined"]; // allowed by the database CHECK
const REPLIES = ["Accepted", "Declined"]; // what an alumnus can answer with

// Basic student info shown with every request (no email, no phone)
const STUDENT_BASE = {
  StudentID: true,
  JoinYear: true,
  user: { select: { Name: true } },
  programme: { select: { ProgrammeName: true } },
};

const REQUEST_SELECT = {
  RequestID: true,
  RequestSubject: true,
  RequestDetail: true,
  Duration: true,
  RequestDate: true,
  Status: true,
};

// GET /api/alumni/me/mentorship-requests?status=Pending
exports.listMyRequests = async (req, res, next) => {
  try {
    const me = await getMyAlumni(req.user.id);
    const where = { AlumniID: me.AlumniID };

    if (req.query.status !== undefined) {
      if (!STATUSES.includes(req.query.status)) {
        return res.status(400).json({ message: `status must be one of: ${STATUSES.join(", ")}` });
      }
      where.Status = req.query.status;
    }

    const rows = await prisma.mentorship_request.findMany({
      where,
      select: { ...REQUEST_SELECT, student: { select: STUDENT_BASE } },
      orderBy: { RequestDate: "desc" },
    });
    res.json(rows);
  } catch (err) {
    sendError(err, res, next);
  }
};

// GET /api/alumni/me/mentorship-requests/:id  (adds the student's portfolio)
exports.getMyRequest = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    const me = await getMyAlumni(req.user.id);

    const row = await prisma.mentorship_request.findFirst({
      where: { RequestID: id, AlumniID: me.AlumniID }, // someone else's request = 404
      select: {
        ...REQUEST_SELECT,
        student: { select: { ...STUDENT_BASE, Projects: true, TechnicalSkills: true, SoftSkills: true } },
      },
    });
    if (!row) return res.status(404).json({ message: "Mentorship request not found" });
    res.json(row);
  } catch (err) {
    sendError(err, res, next);
  }
};

// PATCH /api/alumni/me/mentorship-requests/:id   body: { "Status": "Accepted" | "Declined" }
exports.respondToRequest = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const status = (req.body || {}).Status;
    if (!REPLIES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${REPLIES.join(", ")}` });
    }
    const me = await getMyAlumni(req.user.id);

    // The status change and the student's notification succeed or fail together
    const updated = await prisma.$transaction(async (tx) => {
      const request = await tx.mentorship_request.findFirst({
        where: { RequestID: id, AlumniID: me.AlumniID },
        select: { RequestSubject: true, Status: true, student: { select: { UserID: true } } },
      });
      if (!request) throw new HttpError(404, "Mentorship request not found");
      if (request.Status !== "Pending") {
        throw new HttpError(409, `This request was already ${request.Status.toLowerCase()}`);
      }

      // "Status: Pending" in the where stops two answers at the same moment
      const changed = await tx.mentorship_request.updateMany({
        where: { RequestID: id, Status: "Pending" },
        data: { Status: status },
      });
      if (changed.count === 0) throw new HttpError(409, "This request was already answered");

      await tx.notification.create({
        data: {
          UserID: request.student.UserID,
          NotificationType: "Mentorship",
          Message: fit(`${me.Name} ${status.toLowerCase()} your mentorship request: ${request.RequestSubject}`, 200),
        },
      });

      return tx.mentorship_request.findUnique({
        where: { RequestID: id },
        select: { ...REQUEST_SELECT, student: { select: STUDENT_BASE } },
      });
    });

    res.json(updated);
  } catch (err) {
    sendError(err, res, next);
  }
};