
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { sendMail } = require("../lib/mailer");

const TOKEN_MINUTES = 15;

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const SAME_ANSWER = {
  message: "If an account exists for that email, a reset link has been sent.",
};

// POST /api/password-reset/request
exports.requestReset = async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();

    if (!email || email.length > 254 || !email.includes("@")) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    const user = await prisma.user.findFirst({
      where: {
        Email: email,
        AccountStatus: { notIn: ["Suspended", "Rejected"] },
      },
      select: { UserID: true, Name: true, Email: true },
    });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");

      await prisma.$transaction([
        prisma.password_reset_token.deleteMany({
          where: { UserID: user.UserID },
        }),
        prisma.password_reset_token.create({
          data: {
            UserID: user.UserID,
            TokenHash: hashToken(token),
            ExpiresAt: new Date(Date.now() + TOKEN_MINUTES * 60 * 1000),
          },
        }),
      ]);

      const base = (process.env.CLIENT_URL || "http://localhost:3000")
        .replace(/\/$/, "");

      const link = `${base}/reset-password?token=${token}`;

      try {
        await sendMail({
          to: user.Email,
          subject: "Reset your CST Alumni Portal password",
          text:
            `Hello ${user.Name},\n\n` +
            `We received a request to reset your password. ` +
            `Open this link to choose a new one:\n${link}\n\n` +
            `The link works once and expires in ${TOKEN_MINUTES} minutes. ` +
            `If you did not ask for this, you can ignore this email.\n\n` +
            `CST Alumni Portal`,
          html:
            `<p>Hello ${user.Name.replace(/[<>&"]/g, "")},</p>` +
            `<p>We received a request to reset your password.</p>` +
            `<p><a href="${link}">Choose a new password</a></p>` +
            `<p>The link works once and expires in ${TOKEN_MINUTES} minutes. ` +
            `If you did not ask for this, you can ignore this email.</p>` +
            `<p>CST Alumni Portal</p>`,
        });
      } catch (mailErr) {
        console.error("Password reset email failed:", mailErr.message);
      }
    }

    return res.json(SAME_ANSWER);
  } catch (err) {
    next(err);
  }
};

// POST /api/password-reset/confirm
exports.confirmReset = async (req, res, next) => {
  try {
    const token = String(req.body?.token || "");
    const password = String(req.body?.password || "");

    const INVALID = {
      message: "This reset link is invalid or has expired. Please request a new one.",
    };

    if (!/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json(INVALID);
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    if (password.length > 72) {
      return res.status(400).json({
        message: "Password is too long (max 72 characters)",
      });
    }

    const record = await prisma.password_reset_token.findFirst({
      where: {
        TokenHash: hashToken(token),
        ExpiresAt: { gt: new Date() },
      },
      select: { UserID: true },
    });

    if (!record) {
      return res.status(400).json(INVALID);
    }

    const newHash = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { UserID: record.UserID },
        data: { Password: newHash },
      }),
      prisma.password_reset_token.deleteMany({
        where: { UserID: record.UserID },
      }),
    ]);

    return res.json({
      message: "Password updated. You can now log in.",
    });
  } catch (err) {
    next(err);
  }
};
