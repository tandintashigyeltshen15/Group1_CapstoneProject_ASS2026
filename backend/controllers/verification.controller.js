const prisma = require("../lib/prisma");
const { proofPath } = require("../lib/proofStorage");

const STATUSES = ["Pending", "Active", "Rejected"];

const toRow = (u) => ({
  id: u.UserID,
  name: u.Name,
  email: u.Email,
  status: u.AccountStatus,
  rejectionReason: u.RejectionReason || "",
  appliedAt: u.CreatedAt,
  programme: u.alumni?.programme.ProgrammeName || "",
  graduationYear: u.alumni?.GraduationYear || null,
  hasProof: !!u.alumni?.ProofDocument,
});

// GET /api/verification/alumni?status=Pending|Active|Rejected  (default Pending)
exports.listAlumni = async (req, res, next) => {
  try {
    const status = req.query.status || "Pending";
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${STATUSES.join(", ")}` });
    }

    const rows = await prisma.user.findMany({
      where: { AccountStatus: status, role: { RoleName: "Alumni" } },
      select: {
        UserID: true,
        Name: true,
        Email: true,
        AccountStatus: true,
        RejectionReason: true,
        CreatedAt: true,
        alumni: {
          select: {
            GraduationYear: true,
            ProofDocument: true,
            programme: { select: { ProgrammeName: true } },
          },
        },
      },
      orderBy: { CreatedAt: "asc" },
    });
    res.json(rows.map(toRow));
  } catch (err) {
    next(err);
  }
};

// GET /api/verification/alumni/:id/proof  (staff and administrators only)
exports.getProof = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: "Invalid ID" });

    const alumni = await prisma.alumni.findUnique({
      where: { UserID: id },
      select: { ProofDocument: true },
    });
    if (!alumni?.ProofDocument) {
      return res.status(404).json({ message: "No proof of graduation was uploaded" });
    }

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Content-Disposition", "inline");
    res.sendFile(proofPath(alumni.ProofDocument), (err) => {
      if (err && !res.headersSent) res.status(404).json({ message: "The file could not be found" });
    });
  } catch (err) {
    next(err);
  }
};

async function findPendingAlumni(id) {
  if (!Number.isSafeInteger(id) || id < 1) return null;
  const user = await prisma.user.findUnique({
    where: { UserID: id },
    include: { role: true },
  });
  if (!user || user.role.RoleName !== "Alumni" || user.AccountStatus !== "Pending") return null;
  return user;
}

// POST /api/verification/alumni/:id/approve
exports.approveAlumni = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!(await findPendingAlumni(id))) {
      return res.status(404).json({ message: "No pending alumni account with that ID" });
    }
    await prisma.user.update({
      where: { UserID: id },
      data: { AccountStatus: "Active", RejectionReason: null },
    });
    res.json({ message: "Alumni account approved" });
  } catch (err) {
    next(err);
  }
};

// POST /api/verification/alumni/:id/reject   { "reason": "..." }
exports.rejectAlumni = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const reason = String((req.body || {}).reason || "").trim();

    // RejectionReason is VarChar(250) in the database
    if (reason.length < 5 || reason.length > 250) {
      return res.status(400).json({ message: "Give a reason of 5 to 250 characters" });
    }
    if (!(await findPendingAlumni(id))) {
      return res.status(404).json({ message: "No pending alumni account with that ID" });
    }
    await prisma.user.update({
      where: { UserID: id },
      data: { AccountStatus: "Rejected", RejectionReason: reason },
    });
    res.json({ message: "Alumni registration rejected" });
  } catch (err) {
    next(err);
  }
};