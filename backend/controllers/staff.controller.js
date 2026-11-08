const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.registerStaff = async (req, res, next) => {
  try {
    const b = req.body || {};
    const name = (b.fullName || "").trim();
    const email = (b.email || "").trim().toLowerCase();
    const employeeId = String(b.employeeId || "").trim();
    const departmentId = Number(b.departmentId);
    const password = b.password || "";

    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({ message: "Name must be 2 to 50 characters" });
    }
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: "Enter a valid email address" });
    if (!/^[A-Za-z0-9-]{3,10}$/.test(employeeId)) {
      return res.status(400).json({ message: "Employee ID must be 3 to 10 letters or digits" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const dept = await prisma.department.findUnique({ where: { DepartmentID: departmentId } });
    if (!dept) return res.status(400).json({ message: "Select a department" });

        // A rejected request can be replaced by a corrected registration
    const oldRejected = await prisma.user.findMany({
      where: {
        AccountStatus: "Rejected",
        role: { RoleName: "Staff" },
        OR: [{ Email: email }, { Username: employeeId }],
      },
      select: { UserID: true },
    });
    if (oldRejected.length) {
      const ids = oldRejected.map((u) => u.UserID);
      await prisma.$transaction([
        prisma.staff.deleteMany({ where: { UserID: { in: ids } } }),
        prisma.user.deleteMany({ where: { UserID: { in: ids } } }),
      ]);
    }
    
    const role = await prisma.role.findUnique({ where: { RoleName: "Staff" } });

    await prisma.user.create({
      data: {
        RoleID: role.RoleID,
        Username: employeeId,
        Password: await bcrypt.hash(password, 10),
        Name: name,
        Email: email,
        AccountStatus: "Pending",
        staff: {
          create: {
            StaffID: employeeId,
            DepartmentID: departmentId,
            Designation: (b.designation || "").trim() || null,
          },
        },
      },
    });

    res.status(201).json({
      message: "Registration submitted. An administrator will review your account before you can log in.",
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Email or Employee ID is already registered" });
    }
    next(err);
  }
};