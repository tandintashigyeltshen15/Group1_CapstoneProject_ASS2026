const prisma = require("../lib/prisma");

const DAY = 24 * 60 * 60 * 1000;

// Open internships whose deadline hasn't passed (a deadline stays open for its whole day)
const openFilter = () => ({
  OpportunityType: "Internship",
  Status: "Open",
  OR: [{ Deadline: null }, { Deadline: { gte: new Date(Date.now() - DAY) } }],
});

const mapInternship = (o) => ({
  id: o.OpportunityID,
  title: o.Title,
  company: o.Organization,
  type: o.OpportunityType,
  description: o.Description,
  eligibility: o.EligibilityRequirements,
  duration: o.Duration,
  startDate: o.StartDate,
  deadline: o.Deadline,
});

exports.getInternships = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { UserID: req.user.id },
    });
    if (!student) return res.status(403).json({ message: "Student profile not found" });

    const [opps, apps] = await Promise.all([
      prisma.opportunity.findMany({
        where: openFilter(),
        orderBy: { OpportunityID: "desc" },
      }),
      prisma.application.findMany({
        where: { StudentID: student.StudentID },
        orderBy: { SubmissionDate: "desc" },
        include: { opportunity: true },
      }),
    ]);

    res.json({
      internships: opps.map(mapInternship),
      applications: apps.map((a) => ({
        id: a.ApplicationID,
        internshipId: a.OpportunityID,
        appliedAt: a.SubmissionDate,
        status: a.ApplicationStatus,
        internship: mapInternship(a.opportunity),
      })),
    });
  } catch (err) {
    console.error("Internships error:", err);
    res.status(500).json({ message: "Failed to load internships" });
  }
};

exports.apply = async (req, res) => {
  try {
    const oppId = Number(req.params.id);
    if (!Number.isInteger(oppId)) {
      return res.status(400).json({ message: "Invalid internship" });
    }

    const student = await prisma.student.findUnique({
      where: { UserID: req.user.id },
      include: { user: { select: { Name: true } } },
    });
    if (!student) return res.status(403).json({ message: "Student profile not found" });

    const opp = await prisma.opportunity.findFirst({
      where: { OpportunityID: oppId, ...openFilter() },
    });
    if (!opp) {
      return res.status(404).json({ message: "This internship is closed or no longer available" });
    }

    await prisma.$transaction([
      prisma.application.create({
        data: { StudentID: student.StudentID, OpportunityID: oppId },
        // ApplicationStatus defaults to "Under Review"
      }),
      prisma.notification.create({
        data: {
          UserID: opp.CreatorID,
          NotificationType: "Internship Application",
          Message: `${student.user.Name} applied for ${opp.Title}`.slice(0, 200),
        },
      }),
    ]);

    res.status(201).json({ message: "Application submitted" });
  } catch (err) {
    // unique (StudentID, OpportunityID): already applied
    if (err.code === "P2002") {
      return res.status(409).json({ message: "You have already applied to this internship" });
    }
    console.error("Apply error:", err);
    res.status(500).json({ message: "Failed to submit application" });
  }
};