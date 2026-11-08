const prisma = require("../lib/prisma");

exports.getContributions = async (req, res) => {
  try {
    const [initiatives, totals, recent, donors] = await Promise.all([
      prisma.funding_initiative.findMany({
        orderBy: { CreatedAt: "desc" },
        include: { user: { select: { Name: true } } },
      }),
      // received pledges per initiative
      prisma.pledge.groupBy({
        by: ["InitiativeID"],
        where: { Status: "Received" },
        _sum: { Amount: true },
        _count: { _all: true },
      }),
      prisma.pledge.findMany({
        where: { Status: "Received" },
        orderBy: { ReceivedDate: "desc" },
        take: 5,
        include: {
          funding_initiative: { select: { Title: true } },
          alumni: {
            select: { GraduationYear: true, user: { select: { Name: true } } },
          },
        },
      }),
      // distinct alumni who have contributed
      prisma.pledge.groupBy({
        by: ["AlumniID"],
        where: { Status: "Received" },
      }),
    ]);

    const byId = Object.fromEntries(totals.map((t) => [t.InitiativeID, t]));

    const list = initiatives.map((i) => {
      const t = byId[i.InitiativeID];
      return {
        id: i.InitiativeID,
        title: i.Title,
        description: i.Description,
        type: i.FundingType,
        targetAmount: i.TargetAmount ? Number(i.TargetAmount) : null,
        receivedAmount: Number(t?._sum.Amount || 0),
        contributors: t?._count._all || 0,
        deadline: i.Deadline,
        status: i.Status,
        createdAt: i.CreatedAt,
        postedBy: i.user.Name,
      };
    });

    res.json({
      stats: {
        total: list.length,
        ongoing: list.filter((i) => i.status === "Open").length,
        completed: list.filter((i) => i.status === "Completed").length,
        contributors: donors.length,
      },
      initiatives: list,
      recentContributors: recent.map((p) => ({
        id: p.PledgeID,
        // anonymous pledges hide the name and graduation year
        name: p.IsAnonymous ? "Anonymous Alumnus" : p.alumni.user.Name,
        graduationYear: p.IsAnonymous ? null : p.alumni.GraduationYear,
        initiative: p.funding_initiative.Title,
        amount: p.Amount ? Number(p.Amount) : null,
        date: p.ReceivedDate,
      })),
    });
  } catch (err) {
    console.error("Contributions error:", err);
    res.status(500).json({ message: "Failed to load contributions" });
  }
};