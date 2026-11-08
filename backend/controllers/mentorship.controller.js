const prisma = require("../lib/prisma");

// Same approved-status list as the alumni hub controller
const APPROVED = ["Active", "Approved"];

const mentorWhere = {
  MentorshipAvailable: true,
  IsProfilePublic: true,
  user: { AccountStatus: { in: APPROVED } },
};

/* ---------------------------- STUDENT ---------------------------- */

exports.getStudentMentorship = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { UserID: req.user.id },
    });
    if (!student) return res.status(403).json({ message: "Student profile not found" });

    const [mentorRows, requestRows] = await Promise.all([
      prisma.alumni.findMany({
        where: mentorWhere,
        orderBy: { AlumniID: "desc" },
        select: {
          AlumniID: true,
          GraduationYear: true,
          ExpertiseArea: true,
          ProfessionalBackground: true,
          user: { select: { Name: true } },
          programme: { select: { ProgrammeName: true } },
          career_history: {
            orderBy: { StartDate: "desc" },
            take: 1,
            select: { Organization: true, Position: true },
          },
        },
      }),
      prisma.mentorship_request.findMany({
        where: { StudentID: student.StudentID },
        orderBy: { RequestDate: "desc" },
        include: {
          alumni: { select: { user: { select: { Name: true, Email: true } } } },
        },
      }),
    ]);

    // alumniId -> status of my most recent request (list is newest first)
    const latestStatus = {};
    for (const r of requestRows) {
      if (!(r.AlumniID in latestStatus)) latestStatus[r.AlumniID] = r.Status;
    }

    const mentors = mentorRows.map((a) => {
      const job = a.career_history[0];
      return {
        id: a.AlumniID,
        name: a.user.Name,
        programme: a.programme.ProgrammeName,
        graduationYear: a.GraduationYear,
        jobTitle: job?.Position || "",
        company: job?.Organization || "",
        expertise: (a.ExpertiseArea || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean), // "Software Development, Career Guidance" -> tags
        bio: a.ProfessionalBackground || "",
        myRequestStatus: latestStatus[a.AlumniID] || null,
      };
    });

    const requests = requestRows.map((r) => ({
      id: r.RequestID,
      alumniId: r.AlumniID,
      mentorName: r.alumni.user.Name,
      subject: r.RequestSubject,
      detail: r.RequestDetail,
      duration: r.Duration,
      date: r.RequestDate,
      status: r.Status,
      // contact email only after the mentor accepts
      contactEmail: r.Status === "Accepted" ? r.alumni.user.Email : null,
    }));

    res.json({
      stats: {
        mentorsAvailable: mentors.length,
        pendingRequests: requests.filter((r) => r.status === "Pending").length,
        myMentors: new Set(
          requests.filter((r) => r.status === "Accepted").map((r) => r.alumniId)
        ).size,
      },
      mentors,
      requests,
    });
  } catch (err) {
    console.error("Mentorship error:", err);
    res.status(500).json({ message: "Failed to load mentorship" });
  }
};

exports.createRequest = async (req, res) => {
  try {
    const { alumniId, subject, detail, duration } = req.body;
    const aid = Number(alumniId);

    if (!Number.isInteger(aid) || !subject?.trim() || !detail?.trim()) {
      return res.status(400).json({ message: "Subject and details are required" });
    }
    if (subject.trim().length > 50) {
      return res.status(400).json({ message: "Subject must be 50 characters or less" });
    }

    const student = await prisma.student.findUnique({
      where: { UserID: req.user.id },
      include: { user: { select: { Name: true } } },
    });
    if (!student) return res.status(403).json({ message: "Student profile not found" });

    const mentor = await prisma.alumni.findFirst({
      where: { AlumniID: aid, ...mentorWhere },
      select: { AlumniID: true, UserID: true },
    });
    if (!mentor) {
      return res.status(404).json({ message: "This mentor is not available" });
    }

    const pending = await prisma.mentorship_request.findFirst({
      where: { StudentID: student.StudentID, AlumniID: aid, Status: "Pending" },
    });
    if (pending) {
      return res.status(409).json({ message: "You already have a pending request with this mentor" });
    }

    const [created] = await prisma.$transaction([
      prisma.mentorship_request.create({
        data: {
          StudentID: student.StudentID,
          AlumniID: aid,
          RequestSubject: subject.trim(),
          RequestDetail: detail.trim(),
          Duration: duration?.trim() || null,
        },
      }),
      prisma.notification.create({
        data: {
          UserID: mentor.UserID,
          NotificationType: "Mentorship Request",
          Message: `${student.user.Name} sent you a mentorship request: ${subject.trim()}`.slice(0, 200),
        },
      }),
    ]);

    res.status(201).json({ message: "Request sent", id: created.RequestID });
  } catch (err) {
    console.error("Create mentorship request error:", err);
    res.status(500).json({ message: "Failed to send request" });
  }
};

/* ----------------------------- ALUMNI ----------------------------- */

exports.getIncoming = async (req, res) => {
  try {
    const alumni = await prisma.alumni.findUnique({ where: { UserID: req.user.id } });
    if (!alumni) return res.status(403).json({ message: "Alumni profile not found" });

    const rows = await prisma.mentorship_request.findMany({
      where: { AlumniID: alumni.AlumniID },
      orderBy: { RequestDate: "desc" },
      include: {
        student: {
          select: {
            StudentID: true,
            programme: { select: { ProgrammeName: true } },
            user: { select: { Name: true, Email: true } },
          },
        },
      },
    });

    res.json({
      requests: rows.map((r) => ({
        id: r.RequestID,
        studentName: r.student.user.Name,
        programme: r.student.programme.ProgrammeName,
        subject: r.RequestSubject,
        detail: r.RequestDetail,
        duration: r.Duration,
        date: r.RequestDate,
        status: r.Status,
        contactEmail: r.Status === "Accepted" ? r.student.user.Email : null,
      })),
    });
  } catch (err) {
    console.error("Incoming requests error:", err);
    res.status(500).json({ message: "Failed to load requests" });
  }
};

exports.respondToRequest = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(id) || !["Accepted", "Declined"].includes(status)) {
      return res.status(400).json({ message: "Status must be Accepted or Declined" });
    }

    const alumni = await prisma.alumni.findUnique({ where: { UserID: req.user.id } });
    if (!alumni) return res.status(403).json({ message: "Alumni profile not found" });

    const request = await prisma.mentorship_request.findUnique({
      where: { RequestID: id },
      include: { student: { select: { UserID: true } } },
    });
    // 404 (not 403) so people can't probe other alumni's request ids
    if (!request || request.AlumniID !== alumni.AlumniID) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.Status !== "Pending") {
      return res.status(409).json({ message: "This request was already answered" });
    }

    await prisma.$transaction([
      prisma.mentorship_request.update({
        where: { RequestID: id },
        data: { Status: status },
      }),
      prisma.notification.create({
        data: {
          UserID: request.student.UserID,
          NotificationType: "Mentorship Update",
          Message: `Your mentorship request "${request.RequestSubject}" was ${status.toLowerCase()}.`.slice(0, 200),
        },
      }),
    ]);

    res.json({ message: `Request ${status.toLowerCase()}` });
  } catch (err) {
    console.error("Respond to request error:", err);
    res.status(500).json({ message: "Failed to update request" });
  }
};