const prisma = require("../lib/prisma");

async function myAlumni(userId) {
  return prisma.alumni.findUnique({
    where: { UserID: userId },
    select: {
      AlumniID: true,
      MentorshipAvailable: true,
      IsProfilePublic: true,
      user: { select: { Name: true } },
    },
  });
}

// GET /api/mentor-inbox
exports.getInbox = async (req, res, next) => {
  try {
    const me = await myAlumni(req.user.id);
    if (!me) return res.status(403).json({ message: "Alumni profile not found" });

    const rows = await prisma.mentorship_request.findMany({
      where: { AlumniID: me.AlumniID },
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
      available: me.MentorshipAvailable,
      isPublic: me.IsProfilePublic,
      requests: rows.map((r) => ({
        id: r.RequestID,
        studentName: r.student.user.Name,
        studentId: r.student.StudentID,
        programme: r.student.programme.ProgrammeName,
        subject: r.RequestSubject,
        detail: r.RequestDetail,
        duration: r.Duration || "",
        requestDate: r.RequestDate,
        status: r.Status,
        // contact details are shared only once the mentor accepts
        contactEmail: r.Status === "Accepted" ? r.student.user.Email : null,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/mentor-inbox/availability   { available: true | false }
exports.setAvailability = async (req, res, next) => {
  try {
    const available = (req.body || {}).available;
    if (typeof available !== "boolean") {
      return res.status(400).json({ message: "available must be true or false" });
    }
    const result = await prisma.alumni.updateMany({
      where: { UserID: req.user.id },
      data: { MentorshipAvailable: available },
    });
    if (result.count === 0) return res.status(403).json({ message: "Alumni profile not found" });
    res.json({ available });
  } catch (err) {
    next(err);
  }
};

// GET /api/mentor-inbox/requests/:id/student   (only for students who asked YOU)
exports.getStudent = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: "Invalid request" });

    const me = await myAlumni(req.user.id);
    if (!me) return res.status(403).json({ message: "Alumni profile not found" });

    const r = await prisma.mentorship_request.findUnique({
      where: { RequestID: id },
      include: {
        student: {
          include: {
            programme: { select: { ProgrammeName: true } },
            user: { select: { Name: true, Email: true } },
          },
        },
      },
    });
    // 404 for other alumni's requests, so ids can't be probed
    if (!r || r.AlumniID !== me.AlumniID) return res.status(404).json({ message: "Request not found" });

    const s = r.student;
    res.json({
      name: s.user.Name,
      studentId: s.StudentID,
      programme: s.programme.ProgrammeName,
      joinYear: s.JoinYear,
      technicalSkills: s.TechnicalSkills || "",
      softSkills: s.SoftSkills || "",
      projects: s.Projects || "",
      // no phone number or address, and the email only after acceptance
      email: r.Status === "Accepted" ? s.user.Email : null,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/mentor-inbox/requests/:id   { status: "Accepted" | "Declined", note }
exports.respond = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const status = (req.body || {}).status;
    const note = String((req.body || {}).note || "").trim();

    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: "Invalid request" });
    if (!["Accepted", "Declined"].includes(status)) {
      return res.status(400).json({ message: "Status must be Accepted or Declined" });
    }
    if (note.length > 120) {
      return res.status(400).json({ message: "The note must be 120 characters or less" });
    }

    const me = await myAlumni(req.user.id);
    if (!me) return res.status(403).json({ message: "Alumni profile not found" });

    const r = await prisma.mentorship_request.findUnique({
      where: { RequestID: id },
      select: { AlumniID: true, RequestSubject: true, student: { select: { UserID: true } } },
    });
    if (!r || r.AlumniID !== me.AlumniID) return res.status(404).json({ message: "Request not found" });

    // only a Pending request can be answered, even if it is clicked twice
    const result = await prisma.mentorship_request.updateMany({
      where: { RequestID: id, Status: "Pending" },
      data: { Status: status },
    });
    if (result.count === 0) return res.status(409).json({ message: "This request was already answered" });

    const verb = status === "Accepted" ? "accepted" : "declined";
    const message = `${me.user.Name} ${verb} your mentorship request "${r.RequestSubject}".${note ? ` Note: ${note}` : ""}`;
    await prisma.notification.create({
      data: {
        UserID: r.student.UserID,
        NotificationType: "Mentorship Update",
        Message: message.slice(0, 200),
      },
    });

    res.json({ message: `Request ${verb}` });
  } catch (err) {
    next(err);
  }
};