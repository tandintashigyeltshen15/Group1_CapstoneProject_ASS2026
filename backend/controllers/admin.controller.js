const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLE_NAMES = { STAFF: "Staff", ADMIN: "Administrator" };

exports.createUser = async (req, res, next) => {
  try {
    const b = req.body || {};
    const roleName = ROLE_NAMES[b.role];
    const name = (b.fullName || "").trim();
    const email = (b.email || "").trim().toLowerCase();
    const password = b.password || "";

    if (!roleName) return res.status(400).json({ message: "Role must be STAFF or ADMIN" });
    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({ message: "Name must be 2 to 50 characters" });
    }
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: "Enter a valid email address" });
    if (password.length < 8) {
      return res.status(400).json({ message: "Temporary password must be at least 8 characters" });
    }

    const role = await prisma.role.findUnique({ where: { RoleName: roleName } });
    const base = {
      RoleID: role.RoleID,
      Password: await bcrypt.hash(password, 10),
      Name: name,
      Email: email,
      AccountStatus: "Active",
    };

    let data;
    if (b.role === "STAFF") {
      const employeeId = String(b.employeeId || "").trim();
      const departmentId = Number(b.departmentId);
      if (!/^[A-Za-z0-9-]{3,10}$/.test(employeeId)) {
        return res.status(400).json({ message: "Employee ID must be 3 to 10 letters or digits" });
      }
      const dept = await prisma.department.findUnique({ where: { DepartmentID: departmentId } });
      if (!dept) return res.status(400).json({ message: "Select a department" });

      data = {
        ...base,
        Username: employeeId,
        staff: {
          create: {
            StaffID: employeeId,
            DepartmentID: departmentId,
            Designation: (b.designation || "").trim() || null,
          },
        },
      };
    } else {
      const username = String(b.username || "").trim();
      if (!/^[A-Za-z0-9._-]{3,50}$/.test(username)) {
        return res.status(400).json({ message: "Username must be 3 to 50 letters, digits or . _ -" });
      }
      data = { ...base, Username: username };
    }

    const user = await prisma.user.create({ data });
    res.status(201).json({
      message: `${roleName} account created. Share the temporary password privately.`,
      user: { id: user.UserID, name: user.Name, email: user.Email, role: roleName },
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Email, ID or username is already in use" });
    }
    next(err);
  }
};

// Revoke (Suspended) or restore (Active) an account
exports.setStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const status = (req.body || {}).status;

    if (!["Active", "Suspended"].includes(status)) {
      return res.status(400).json({ message: "Status must be Active or Suspended" });
    }
    if (id === req.user.id) {
      return res.status(400).json({ message: "You cannot change your own account" });
    }
    const user = await prisma.user.findUnique({ where: { UserID: id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    await prisma.user.update({ where: { UserID: id }, data: { AccountStatus: status } });
    res.json({ message: `Account ${status === "Active" ? "restored" : "suspended"}` });
  } catch (err) {
    next(err);
  }
};

// Staff waiting for approval
exports.listPendingStaff = async (req, res, next) => {
  try {
    const rows = await prisma.user.findMany({
      where: { AccountStatus: "Pending", role: { RoleName: "Staff" } },
      include: { staff: { include: { department: true } } },
      orderBy: { UserID: "asc" },
    });
    res.json(
      rows.map((u) => ({
        id: u.UserID,
        name: u.Name,
        email: u.Email,
        employeeId: u.staff?.StaffID,
        department: u.staff?.department?.DepartmentName,
        designation: u.staff?.Designation,
      }))
    );
  } catch (err) {
    next(err);
  }
};

async function findPendingStaff(id) {
  const user = await prisma.user.findUnique({
    where: { UserID: id },
    include: { role: true },
  });
  if (!user || user.role.RoleName !== "Staff" || user.AccountStatus !== "Pending") return null;
  return user;
}

exports.approveStaff = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!(await findPendingStaff(id))) {
      return res.status(404).json({ message: "No pending staff account with that ID" });
    }
    await prisma.user.update({ where: { UserID: id }, data: { AccountStatus: "Active" } });
    res.json({ message: "Staff account approved" });
  } catch (err) {
    next(err);
  }
};

exports.listStaff = async (req, res, next) => {
  try {
    const statusLabel = {
      Pending: "Pending Review",
      Active: "Approved",
      Suspended: "Suspended",
      Rejected: "Rejected",
    };
    const rows = await prisma.user.findMany({
      where: {
        role: { RoleName: "Staff" },
        AccountStatus: { in: ["Pending", "Active", "Suspended", "Rejected"] },
      },
      include: { staff: { include: { department: true } } },
      orderBy: { UserID: "desc" },
    });
    res.json(
      rows.map((u) => ({
        id: u.UserID,
        name: u.Name,
        email: u.Email,
        employeeId: u.staff?.StaffID || "",
        department: u.staff?.department?.DepartmentName || "",
        designation: u.staff?.Designation || "",
        status: statusLabel[u.AccountStatus],
        rejectionReason: u.RejectionReason || "",
      }))
    );
  } catch (err) {
    next(err);
  }
};

// Reject = keep the record, mark it Rejected and store the reason
exports.rejectStaff = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const reason = String((req.body || {}).reason || "").trim();

    if (reason.length < 5 || reason.length > 500) {
      return res.status(400).json({ message: "Give a reason of 5 to 500 characters" });
    }
    if (!(await findPendingStaff(id))) {
      return res.status(404).json({ message: "No pending staff account with that ID" });
    }
    await prisma.user.update({
      where: { UserID: id },
      data: { AccountStatus: "Rejected", RejectionReason: reason },
    });
    res.json({ message: "Staff registration rejected" });
  } catch (err) {
    next(err);
  }
};