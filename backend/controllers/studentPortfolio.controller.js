// backend/controllers/studentPortfolio.controller.js
// A student's portfolio is a list of items. Each item is either a PDF the student
// uploads or a web link (GitHub, personal site, Google Drive, LinkedIn...) with the details.
// PDFs are stored in the database. Only the owner can list, download or delete them.

const path = require("path");
const prisma = require("../lib/prisma");

const CATEGORIES = ["CV", "Certificate", "Project", "Other"];
const MAX_ITEMS_PER_STUDENT = 10;

// Check the real file bytes, because the browser's file type claim can be faked
const isPdf = (buf) => buf.length > 4 && buf.subarray(0, 4).toString("latin1") === "%PDF";

const cleanName = (name) => {
  const base = path.basename(String(name || "")).replace(/[\u0000-\u001f<>:"/\\|?*]/g, "_").trim();
  const safe = (base || "portfolio.pdf").slice(0, 196);
  return safe.toLowerCase().endsWith(".pdf") ? safe : `${safe}.pdf`;
};

// Accepts "github.com/me" too. Only http and https links are allowed.
const cleanUrl = (raw) => {
  let text = String(raw || "").trim();
  if (!text) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) text = `https://${text}`;
  let u;
  try {
    u = new URL(text);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(u.protocol) || !u.hostname.includes(".")) return null;
  const out = u.toString();
  return out.length <= 500 ? out : null;
};

const getUserId = (req) => Number(req.user?.id);

// GET /api/student/portfolio
exports.listFiles = async (req, res, next) => {
  try {
    const rows = await prisma.student_portfolio_file.findMany({
      where: { UserID: getUserId(req) },
      orderBy: { UploadedAt: "desc" },
      select: {
        PortfolioFileID: true,
        Title: true,
        Category: true,
        Description: true,
        SharedWithReviewers: true,
        FileName: true,
        MimeType: true,
        FileSize: true,
        LinkUrl: true,
        UploadedAt: true,
      },
    });

    res.json({
      maxFiles: MAX_ITEMS_PER_STUDENT,
      files: rows.map((r) => ({
        id: r.PortfolioFileID,
        kind: r.LinkUrl ? "link" : "file",
        title: r.Title,
        category: r.Category,
        description: r.Description,
        shared: r.SharedWithReviewers,
        fileName: r.FileName,
        mimeType: r.MimeType,
        size: r.FileSize,
        url: r.LinkUrl,
        uploadedAt: r.UploadedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/student/portfolio
// multipart fields: kind ("file" or "link"), title, category, description, shared,
// and either the PDF in "file" or the web address in "url"
exports.uploadFile = async (req, res, next) => {
  try {
    const kind = req.body.kind === "link" ? "link" : "file";
    const title = String(req.body.title || "").trim();
    const category = String(req.body.category || "");
    const description = String(req.body.description || "").trim();
    const shared = req.body.shared === "true" || req.body.shared === "1";

    if (!title || title.length > 150) {
      return res.status(400).json({ message: "Enter a title (up to 150 characters)" });
    }
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "Choose a valid category" });
    }
    if (description.length > 300) {
      return res.status(400).json({ message: "Description must be 300 characters or fewer" });
    }

    const data = {
      UserID: getUserId(req),
      Title: title,
      Category: category,
      Description: description || null,
      SharedWithReviewers: shared,
    };

    if (kind === "link") {
      const url = cleanUrl(req.body.url);
      if (!url) {
        return res.status(400).json({ message: "Enter a valid web link, for example https://github.com/you/project" });
      }
      data.LinkUrl = url;
    } else {
      if (!req.file) return res.status(400).json({ message: "Choose a PDF to upload" });
      if (!isPdf(req.file.buffer)) {
        return res.status(400).json({ message: "Only PDF files can be uploaded. For anything else, add a link instead." });
      }
      data.FileName = cleanName(req.file.originalname);
      data.MimeType = "application/pdf";
      data.FileSize = req.file.size;
      data.FileData = req.file.buffer;
    }

    const count = await prisma.student_portfolio_file.count({ where: { UserID: data.UserID } });
    if (count >= MAX_ITEMS_PER_STUDENT) {
      return res
        .status(400)
        .json({ message: `You can keep up to ${MAX_ITEMS_PER_STUDENT} portfolio items. Delete one first.` });
    }

    const created = await prisma.student_portfolio_file.create({ data, select: { PortfolioFileID: true } });
    res.status(201).json({ id: created.PortfolioFileID, message: "Added to your portfolio" });
  } catch (err) {
    next(err);
  }
};

// GET /api/student/portfolio/:id/download   (owner only, PDFs only)
exports.downloadFile = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid file" });

    const f = await prisma.student_portfolio_file.findFirst({
      where: { PortfolioFileID: id, UserID: getUserId(req) },
      select: { FileData: true, FileName: true, MimeType: true },
    });
    if (!f || !f.FileData) return res.status(404).json({ message: "File not found" });

    res.set("Content-Type", f.MimeType || "application/octet-stream");
    res.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(f.FileName || "portfolio.pdf")}`);
    res.set("X-Content-Type-Options", "nosniff");
    res.send(Buffer.from(f.FileData));
  } catch (err) {
    next(err);
  }
};

// PATCH /api/student/portfolio/:id/share   body: { "shared": true | false }
// Lets the student choose whether alumni they applied to can see this item
exports.setShared = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid file" });
    if (typeof req.body?.shared !== "boolean") {
      return res.status(400).json({ message: "shared must be true or false" });
    }

    const result = await prisma.student_portfolio_file.updateMany({
      where: { PortfolioFileID: id, UserID: getUserId(req) },
      data: { SharedWithReviewers: req.body.shared },
    });
    if (result.count === 0) return res.status(404).json({ message: "File not found" });

    res.json({ shared: req.body.shared });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/student/portfolio/:id   (owner only)
exports.deleteFile = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid file" });

    const result = await prisma.student_portfolio_file.deleteMany({
      where: { PortfolioFileID: id, UserID: getUserId(req) },
    });
    if (result.count === 0) return res.status(404).json({ message: "File not found" });

    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};