const prisma = require("../lib/prisma");

// AccountStatus values that count as approved. Check yours with:
//   SELECT DISTINCT AccountStatus FROM user;
const APPROVED = ["Active", "Approved"];

exports.getAlumniHub = async (req, res) => {
  try {
    const [rows, opps] = await Promise.all([
      prisma.alumni.findMany({
        where: {
          IsProfilePublic: true,
          user: { AccountStatus: { in: APPROVED } },
        },
        select: {
          AlumniID: true,
          GraduationYear: true,
          ProfessionalBackground: true,
          ExpertiseArea: true,
          MentorshipAvailable: true,
          user: { select: { Name: true } },
          programme: { select: { ProgrammeName: true } },
          career_history: {
            orderBy: { StartDate: "desc" },
            take: 1,
            select: { Organization: true, Position: true },
          },
        },
        orderBy: [{ GraduationYear: "desc" }, { AlumniID: "desc" }],
      }),
      prisma.opportunity.findMany({
        where: {
          OpportunityType: "Internship",
          Status: "Open",
          OR: [{ Deadline: null }, { Deadline: { gte: new Date() } }],
        },
        orderBy: { OpportunityID: "desc" },
        take: 4,
        select: {
          OpportunityID: true,
          Title: true,
          Organization: true,
          Deadline: true,
          OpportunityType: true,
        },
      }),
    ]);

    // Only public fields: no email, no username
    const alumni = rows.map((a) => {
      const job = a.career_history[0];
      return {
        id: a.AlumniID,
        name: a.user.Name,
        programme: a.programme.ProgrammeName,
        graduationYear: a.GraduationYear,
        jobTitle: job?.Position || "",
        company: job?.Organization || "",
        location: "", // no column yet
        expertise: a.ExpertiseArea || "",
        isMentor: a.MentorshipAvailable,
        bio: a.ProfessionalBackground || "",
      };
    });

    const internships = opps.map((o) => ({
      id: o.OpportunityID,
      title: o.Title,
      company: o.Organization,
      deadline: o.Deadline,
      type: o.OpportunityType,
    }));

    res.json({ alumni, internships });
  } catch (err) {
    console.error("Alumni hub error:", err);
    res.status(500).json({ message: "Failed to load Alumni Hub" });
  }
};