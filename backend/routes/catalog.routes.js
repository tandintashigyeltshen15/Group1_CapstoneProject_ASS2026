const router = require("express").Router();
const prisma = require("../lib/prisma");

router.get("/programmes", async (req, res, next) => {
  try {
    const rows = await prisma.programme.findMany({
      include: { department: true },
      orderBy: { ProgrammeName: "asc" },
    });
    res.json(
      rows.map((p) => ({
        id: p.ProgrammeID,
        name: p.ProgrammeName,
        department: p.department.DepartmentName,
      }))
    );
  } catch (err) {
    next(err);
  }
});

module.exports = router;