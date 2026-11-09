const prisma = require("../lib/prisma");
const bcrypt = require("bcryptjs");

// Same six fields the dashboard uses for the profile-completion percentage
const OPTIONAL_FIELDS = ["PhoneNo", "Dzongkhag", "Gewog", "Projects", "TechnicalSkills", "SoftSkills"];

const completion = (s) => {
  const filled = OPTIONAL_FIELDS.filter((f) => s[f] && String(s[f]).trim() !== "").length;
  return Math.round((filled / OPTIONAL_FIELDS.length) * 100);
};

const loadProfile = async (userId) => {
  const s = await prisma.student.findUnique({
    where: { UserID: userId },
    include: {
      programme: { select: { ProgrammeName: true } },
      user: {
        select: {
          Name: true,
          Email: true,
          AccountStatus: true,
          role: { select: { RoleName: true } },
        },
      },
    },
  });
  if (!s) return null;

  return {
    name: s.user.Name,
    email: s.user.Email,
    role: s.user.role.RoleName,
    accountStatus: s.user.AccountStatus,
    studentId: s.StudentID,
    programme: s.programme.ProgrammeName,
    joinYear: s.JoinYear,
    phone: s.PhoneNo || "",
    dzongkhag: s.Dzongkhag || "",
    gewog: s.Gewog || "",
    projects: s.Projects || "",
    technicalSkills: s.TechnicalSkills || "",
    softSkills: s.SoftSkills || "",
    completion: completion(s),
  };
};

exports.getProfile = async (req, res) => {
  try {
    const profile = await loadProfile(req.user.id);
    if (!profile) return res.status(404).json({ message: "Student profile not found" });
    res.json(profile);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Failed to load profile" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const b = req.body || {};
    const clean = (v) => {
      const s = v == null ? "" : String(v).trim();
      return s === "" ? null : s;
    };

    const phone = clean(b.phone);
    const dzongkhag = clean(b.dzongkhag);
    const gewog = clean(b.gewog);
    const projects = clean(b.projects);
    const technicalSkills = clean(b.technicalSkills);
    const softSkills = clean(b.softSkills);

    if (phone && !/^\d{8}$/.test(phone)) {
      return res.status(400).json({ message: "Phone number must be exactly 8 digits" });
    }
    if (dzongkhag && dzongkhag.length > 20) {
      return res.status(400).json({ message: "Dzongkhag is too long" });
    }
    if (gewog && gewog.length > 20) {
      return res.status(400).json({ message: "Gewog must be 20 characters or less" });
    }
    for (const [label, value] of [
      ["Projects", projects],
      ["Technical skills", technicalSkills],
      ["Soft skills", softSkills],
    ]) {
      if (value && value.length > 2000) {
        return res.status(400).json({ message: `${label} must be 2000 characters or less` });
      }
    }

    await prisma.student.update({
      where: { UserID: req.user.id },
      data: {
        PhoneNo: phone,
        Dzongkhag: dzongkhag,
        Gewog: gewog,
        Projects: projects,
        TechnicalSkills: technicalSkills,
        SoftSkills: softSkills,
      },
    });

    res.json(await loadProfile(req.user.id));
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "That phone number is already used by another account" });
    }
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { current, next } = req.body || {};

    if (!current || !next) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    if (next.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }
    if (next.length > 72) {
      return res.status(400).json({ message: "New password is too long (max 72 characters)" });
    }

    const user = await prisma.user.findUnique({
      where: { UserID: req.user.id },
      select: { Password: true },
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 400, NOT 401: the frontend api() helper logs the user out on any 401
    if (!(await bcrypt.compare(current, user.Password))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    if (await bcrypt.compare(next, user.Password)) {
      return res.status(400).json({ message: "New password must be different from the current one" });
    }

    await prisma.user.update({
      where: { UserID: req.user.id },
      data: { Password: await bcrypt.hash(next, 10) },
    });

    res.json({ message: "Password updated" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Failed to change password" });
  }
};