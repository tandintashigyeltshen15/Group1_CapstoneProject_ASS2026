// backend/controllers/alumniStudentPortfolio.controller.js
// Lets an alumnus see the portfolio of a student who contacted them:
// either the student sent them a mentorship request, or applied to an opportunity they posted.
// Only files the student chose to share are visible, and no email or phone is returned.

const prisma = require("../lib/prisma");
const { HttpError, sendError, getMyAlumni } = require("./alumni.helpers");

const validStudentId = (v) => typeof v === "string" && /^[A-Za-z0-9_-]{1,30}$/.test(v);

// Finds the student, and checks this alumnus has a real reason to see them.
// Anything else gets the same 404, so nobody can use this to look students up.
async function loadAllowedStudent(req) {
  const studentId = req.params.studentId;
  if (!validStudentId(studentId)) throw new HttpError(404, "Student not found");

  const me = await getMyAlumni(req.user.id);

  const student = await prisma.student.findFirst({
    where: { StudentID: studentId },
    select: {
      UserID: true,
      StudentID: true,
      JoinYear: true,
      Projects: true,
      TechnicalSkills: true,
      SoftSkills: true,
      user: { select: { Name: true } },
      programme: { select: { ProgrammeName: true } },
    },
  });
  if (!student) throw new HttpError(404, "Student not found");

  const [asked, applied] = await Promise.all([
    prisma.mentorship_request.findFirst({
      where: { AlumniID: me.AlumniID, student: { StudentID: studentId } },
      select: { RequestID: true },
    }),
    prisma.application.findFirst({
      where: { student: { StudentID: studentId }, opportunity: { CreatorID: req.user.id } },
      select: { ApplicationID: true },
    }),
  ]);
  if (!asked && !applied) throw new HttpError(404, "Student not found");

  return student;
}

// GET /api/alumni/me/students/:studentId/portfolio
exports.getStudentPortfolio = async (req, res, next) => {
  try {
    const s = await loadAllowedStudent(req);

    const files = await prisma.student_portfolio_file.findMany({
      where: { UserID: s.UserID, SharedWithReviewers: true },
      orderBy: { UploadedAt: "desc" },
      select: {
        PortfolioFileID: true,
        Title: true,
        Category: true,
        Description: true,
        FileName: true,
        FileSize: true,
        LinkUrl: true,
        UploadedAt: true,
      },
    });

    res.json({
      studentId: s.StudentID,
      name: s.user.Name,
      programme: s.programme.ProgrammeName,
      joinYear: s.JoinYear,
      projects: s.Projects || "",
      technicalSkills: s.TechnicalSkills || "",
      softSkills: s.SoftSkills || "",
      files: files.map((f) => ({
        id: f.PortfolioFileID,
        kind: f.LinkUrl ? "link" : "file",
        url: f.LinkUrl,
        title: f.Title,
        category: f.Category,
        description: f.Description,
        fileName: f.FileName,
        size: f.FileSize,
        uploadedAt: f.UploadedAt,
      })),
    });
  } catch (err) {
    sendError(err, res, next);
  }
};

// GET /api/alumni/me/students/:studentId/portfolio/:fileId/download
exports.downloadSharedFile = async (req, res, next) => {
  try {
    const s = await loadAllowedStudent(req);
    const fileId = Number(req.params.fileId);
    if (!Number.isInteger(fileId)) throw new HttpError(404, "File not found");

    const f = await prisma.student_portfolio_file.findFirst({
      where: { PortfolioFileID: fileId, UserID: s.UserID, SharedWithReviewers: true },
      select: { FileData: true, FileName: true, MimeType: true },
    });
    if (!f || !f.FileData) throw new HttpError(404, "File not found");

    res.set("Content-Type", f.MimeType || "application/octet-stream");
    res.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(f.FileName || "portfolio.pdf")}`);
    res.set("X-Content-Type-Options", "nosniff");
    res.send(Buffer.from(f.FileData));
  } catch (err) {
    sendError(err, res, next);
  }
};