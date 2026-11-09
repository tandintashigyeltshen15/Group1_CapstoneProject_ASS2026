const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../lib/prisma");
const { saveProof, removeProof } = require("../lib/proofStorage");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TAB_ROLES = {
  student: "Student",
  alumni: "Alumni",
  staff: "Staff",
  admin: "Administrator",
};

exports.register = async (req, res, next) => {
  let savedProof = null; // name of the proof file, so it can be deleted if registration fails
  try {
    const b = req.body || {};
    const name = String(b.fullName || "").trim();
    const email = String(b.email || "").trim().toLowerCase();
    const password = String(b.password || "");
    const programmeId = Number(b.programmeId);

    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({
        message: "Name must be 2 to 50 characters",
      });
    }

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({
        message: "Enter a valid email address",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    if (!Number.isInteger(programmeId)) {
      return res.status(400).json({
        message: "Select your programme",
      });
    }

    const programme = await prisma.programme.findUnique({
      where: { ProgrammeID: programmeId },
    });

    if (!programme) {
      return res.status(400).json({
        message: "Unknown programme",
      });
    }

    const Password = await bcrypt.hash(password, 10);
    let data;

    if (b.role === "STUDENT") {
      const domain = "@" + (process.env.STUDENT_EMAIL_DOMAIN || "rub.edu.bt");

      if (!email.endsWith(domain)) {
        return res.status(400).json({
          message: `Use your CST email (${domain})`,
        });
      }

      const studentId = String(b.studentId || "").trim();

      if (!/^\d{8}$/.test(studentId)) {
        return res.status(400).json({
          message: "Student ID must be 8 digits",
        });
      }

      const joinYear = Number(b.joinYear);

      if (
        !Number.isInteger(joinYear) ||
        joinYear < 2000 ||
        joinYear > new Date().getFullYear()
      ) {
        return res.status(400).json({
          message: "Enter a valid year of joining",
        });
      }

      const role = await prisma.role.findUnique({
        where: { RoleName: "Student" },
      });

      if (!role) {
        return res.status(400).json({
          message: "Student role not found",
        });
      }

      data = {
        RoleID: role.RoleID,
        Username: studentId,
        Password,
        Name: name,
        Email: email,
        AccountStatus: "Active",
        student: {
          create: {
            StudentID: studentId,
            ProgrammeID: programmeId,
            JoinYear: joinYear,
          },
        },
      };
    } else if (b.role === "ALUMNI") {
      const graduationYear = Number(b.graduationYear);

      if (
        !Number.isInteger(graduationYear) ||
        graduationYear < 2001 ||
        graduationYear > new Date().getFullYear()
      ) {
        return res.status(400).json({
          message: "Enter a valid graduation year",
        });
      }

      const role = await prisma.role.findUnique({
        where: { RoleName: "Alumni" },
      });

      if (!role) {
        return res.status(400).json({
          message: "Alumni role not found",
        });
      }

      // Proof of graduation is required: it is what staff check against the registry
      try {
        savedProof = await saveProof(req.file);
      } catch (e) {
        return res.status(400).json({ message: e.message });
      }

      data = {
        RoleID: role.RoleID,
        Username: "alumni-" + crypto.randomBytes(4).toString("hex"),
        Password,
        Name: name,
        Email: email,
        AccountStatus: "Pending",
        alumni: {
          create: {
            ProgrammeID: programmeId,
            GraduationYear: graduationYear,
            ProofDocument: savedProof,
          },
        },
      };
    } else {
      return res.status(400).json({
        message: "Staff and admin accounts are created by an admin",
      });
    }

    const user = await prisma.user.create({ data });

    res.status(201).json({
      message:
        user.AccountStatus === "Pending"
          ? "Registered. Your account will be active after staff verifies it."
          : "Registered successfully. You can log in now.",
      user: {
        id: user.UserID,
        name: user.Name,
        status: user.AccountStatus,
      },
    });
  } catch (err) {
    if (savedProof) await removeProof(savedProof); // don't leave an orphan file behind

    if (err.code === "P2002") {
      return res.status(409).json({
        message: "Email or student ID is already registered",
      });
    }

    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const body = req.body || {};
    const identifier = String(
      body.identifier || body.email || ""
    ).trim();

    const password = body.password || "";

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Enter your ID or email and password",
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { Email: identifier.toLowerCase() },
          { Username: identifier },
        ],
      },
      include: {
        role: true,
      },
    });

    const wrongTab =
      body.role && TAB_ROLES[body.role] !== user?.role?.RoleName;

    if (
      !user ||
      wrongTab ||
      !(await bcrypt.compare(password, user.Password))
    ) {
      return res.status(401).json({
        message: "Invalid login details",
      });
    }

    // Check account status after verifying the password.
    if (user.AccountStatus !== "Active") {

      // Show the rejection reason.
      if (user.AccountStatus === "Rejected") {
        return res.status(403).json({
          message: "Your registration was rejected.",
          rejectionReason:
            user.RejectionReason || "No rejection reason was provided.",
        });
      }

      const messages = {
        Pending: "Your account is waiting for approval.",
        Suspended: "Your account is suspended. Contact the administrator.",
      };

      return res.status(403).json({
        message:
          messages[user.AccountStatus] || "Account not active.",
      });
    }

    const token = jwt.sign(
      {
        id: user.UserID,
        role: user.role.RoleName,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({
      token,
      user: {
        id: user.UserID,
        name: user.Name,
        email: user.Email,
        role: user.role.RoleName,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        UserID: req.user.id,
      },
      include: {
        role: true,
        student: true,
        alumni: true,
        staff: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const { Password, ...safe } = user;

    res.json({
      ...safe,
      role: user.role.RoleName,
    });
  } catch (err) {
    next(err);
  }
};