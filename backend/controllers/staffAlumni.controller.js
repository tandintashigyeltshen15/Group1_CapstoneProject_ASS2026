const prisma = require("../lib/prisma");

exports.list = async (req, res, next) => {
  try {
    const [rows, programmes] = await Promise.all([
      prisma.alumni.findMany({
        where: { user: { AccountStatus: "Active" } },
        orderBy: [{ GraduationYear: "desc" }, { AlumniID: "desc" }],
        select: {
          AlumniID: true,
          GraduationYear: true,
          ProfessionalBackground: true,
          ExpertiseArea: true,
          MentorshipAvailable: true,
          IsProfilePublic: true,
          ProgrammeID: true,
          user: { select: { Name: true, Email: true } },
          programme: { select: { ProgrammeName: true } },
          career_history: {
            orderBy: { StartDate: "desc" },
            take: 1,
            select: { Organization: true, Position: true },
          },
        },
      }),
      prisma.programme.findMany({
        orderBy: { ProgrammeName: "asc" },
        select: { ProgrammeID: true, ProgrammeName: true },
      }),
    ]);

    res.json({
      programmes: programmes.map((p) => ({ id: p.ProgrammeID, name: p.ProgrammeName })),
      alumni: rows.map((a) => ({
        id: a.AlumniID,
        name: a.user.Name,
        email: a.user.Email,
        programmeId: a.ProgrammeID,
        programme: a.programme.ProgrammeName,
        graduationYear: a.GraduationYear,
        jobTitle: a.career_history[0]?.Position || "",
        company: a.career_history[0]?.Organization || "",
        expertise: a.ExpertiseArea || "",
        bio: a.ProfessionalBackground || "",
        isMentor: a.MentorshipAvailable,
        isPublic: a.IsProfilePublic,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// Staff correct the verified details and the mentor flag
exports.update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const b = req.body || {};
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: "Invalid alumni" });

    const name = String(b.name || "").trim();
    const programmeId = Number(b.programmeId);
    const year = Number(b.graduationYear);
    const expertise = String(b.expertise || "").trim();
    const bio = String(b.bio || "").trim();

    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({ message: "Name must be 2 to 50 characters" });
    }
    if (!Number.isInteger(year) || year < 1980 || year > new Date().getFullYear()) {
      return res.status(400).json({ message: "Enter a valid graduation year" });
    }
    if (expertise.length > 255) {
      return res.status(400).json({ message: "Expertise must be 255 characters or less" });
    }
    if (typeof b.isMentor !== "boolean") {
      return res.status(400).json({ message: "isMentor must be true or false" });
    }
    const programme = await prisma.programme.findUnique({ where: { ProgrammeID: programmeId } });
    if (!programme) return res.status(400).json({ message: "Select a programme" });

    const exists = await prisma.alumni.findUnique({ where: { AlumniID: id } });
    if (!exists) return res.status(404).json({ message: "Alumni not found" });

    await prisma.alumni.update({
      where: { AlumniID: id },
      data: {
        ProgrammeID: programmeId,
        GraduationYear: year,
        ExpertiseArea: expertise || null,
        ProfessionalBackground: bio || null,
        MentorshipAvailable: b.isMentor,
        user: { update: { Name: name } },
      },
    });
    res.json({ message: "Record updated" });
  } catch (err) {
    next(err);
  }
};