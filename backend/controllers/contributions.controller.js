const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const CATEGORIES = [
  "Scholarships",
  "Laboratory Upgrade",
  "Library Development",
  "Campus Infrastructure",
  "Student Activities",
  "Other",
];
const TYPES = ["Monetary", "Equipment", "Other"];
const CAMPAIGN_STATUSES = ["Draft", "Open", "Closed"];
const CONTRIBUTOR_ROLES = ["Staff", "Alumni"];

const MAX_TARGET = 1_000_000_000;
const MAX_PAYMENT = 10_000_000;
const DAY = 24 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONEY_RE = /^\d+(\.\d{1,2})?$/;
const REF_RE = /^[A-Za-z0-9][A-Za-z0-9\-_/ ]{3,49}$/;

/* ------------------------------ helpers ------------------------------ */

const num = (d) => (d == null ? 0 : Number(d));
const isId = (v) => Number.isSafeInteger(v) && v > 0;
const ymd = (d) => (d ? d.toISOString().slice(0, 10) : "");
const toDate = (s) => new Date(`${s}T00:00:00.000Z`);
const validDate = (s) => {
  if (!DATE_RE.test(s)) return false;
  const d = toDate(s);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};
const isPast = (deadline) => Date.now() > deadline.getTime() + DAY; // the deadline day itself still counts
const money = (n) => `Nu. ${Number(n).toLocaleString("en-IN")}`;

// Receipt links are signed with a DIFFERENT secret, so a receipt link can never be used as a login token
const receiptSecret = () => `${process.env.JWT_SECRET}:receipt`;
const receiptPath = (id) =>
  `/contributions/payments/${id}/receipt?token=${jwt.sign({ pid: id }, receiptSecret(), { expiresIn: "30m" })}`;

function detectType(buf) {
  if (!buf || buf.length < 8) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.toString("latin1", 0, 4) === "%PDF") return "application/pdf";
  return null;
}

// verified money per campaign, and how many different people gave
async function totalsMap() {
  const rows = await prisma.contribution_payment.groupBy({
    by: ["CampaignID", "UserID"],
    where: { Status: "Verified" },
    _sum: { Amount: true },
  });
  const map = new Map();
  for (const r of rows) {
    const t = map.get(r.CampaignID) || { raised: 0, count: 0 };
    t.raised += num(r._sum.Amount);
    t.count += 1;
    map.set(r.CampaignID, t);
  }
  return map;
}

function mapCampaign(c, t) {
  const raised = t ? t.raised : 0;
  const target = num(c.TargetAmount);
  const pastDeadline = isPast(c.Deadline);

  // what students, staff and alumni see: Open, Completed or Closed
  let displayStatus = "Draft";
  if (c.Status !== "Draft") {
    if (raised >= target) displayStatus = "Completed";
    else if (c.Status === "Closed" || pastDeadline) displayStatus = "Closed";
    else displayStatus = "Open";
  }

  return {
    id: c.CampaignID,
    title: c.Title,
    category: c.Category,
    type: c.ContributionType,
    description: c.Description,
    target,
    raised,
    percent: Math.min(100, Math.round((raised / target) * 1000) / 10),
    deadline: ymd(c.Deadline),
    status: c.Status,
    displayStatus,
    isOpen: c.Status === "Open" && !pastDeadline,
    acceptsPayments: c.ContributionType === "Monetary",
    contributors: t ? t.count : 0,
    imageUrl: c.ImageType
      ? `/contributions/campaigns/${c.CampaignID}/image?v=${c.ImageUpdatedAt ? c.ImageUpdatedAt.getTime() : 0}`
      : "",
    createdAt: c.CreatedAt,
  };
}

const mapBank = (b) => ({
  bankName: b?.BankName || "",
  accountName: b?.AccountName || "",
  accountNumber: b?.AccountNumber || "",
  branch: b?.Branch || "",
  updatedAt: b?.UpdatedAt || "",
});

const paymentSelect = {
  PaymentID: true,
  CampaignID: true,
  Amount: true,
  Reference: true,
  PaymentDate: true,
  Status: true,
  Remarks: true,
  SubmittedAt: true,
  VerifiedAt: true,
  IsAnonymous: true,
  user: { select: { Name: true, Email: true, role: { select: { RoleName: true } } } },
};

// the shape the admin page uses
const mapPayment = (p) => ({
  id: p.PaymentID,
  campaignId: p.CampaignID,
  donor: p.user.Name,
  donorType: p.user.role.RoleName,
  email: p.user.Email,
  amount: num(p.Amount),
  reference: p.Reference,
  date: ymd(p.PaymentDate),
  submittedAt: p.SubmittedAt,
  status: p.Status,
  receiptUrl: receiptPath(p.PaymentID),
  reason: p.Status === "Rejected" ? p.Remarks || "" : "",
  remarks: p.Remarks || "",
  anonymous: p.IsAnonymous,
});

function readCampaign(b) {
  const title = String(b.title || "").trim();
  const description = String(b.description || "").trim();
  const targetText = String(b.target ?? "").trim();
  const type = b.type || "Monetary";
  const deadline = String(b.deadline || "");

  if (title.length < 3 || title.length > 150) return { error: "Title must be 3 to 150 characters" };
  if (!CATEGORIES.includes(b.category)) return { error: "Select a category" };
  if (!TYPES.includes(type)) return { error: "Select a contribution type" };
  if (description.length < 10 || description.length > 5000) {
    return { error: "Description must be 10 to 5000 characters" };
  }
  if (!MONEY_RE.test(targetText) || Number(targetText) < 1 || Number(targetText) > MAX_TARGET) {
    return { error: "Enter a target amount between Nu. 1 and Nu. 1,000,000,000" };
  }
  if (!validDate(deadline)) return { error: "Choose a valid deadline" };

  return {
    data: { title, description, category: b.category, type, target: Number(targetText), deadline },
  };
}

/* ======================= ALL ROLES (logged in) ======================= */

// GET /api/contributions
exports.getOverview = async (req, res, next) => {
  try {
    const role = req.user.role;
    const canContribute = CONTRIBUTOR_ROLES.includes(role);

    const [rows, totals, supporters, recent, mine] = await Promise.all([
      prisma.contribution_campaign.findMany({
        where: { Status: { not: "Draft" } },
        orderBy: { CampaignID: "desc" },
      }),
      totalsMap(),
      prisma.contribution_payment.findMany({
        where: { Status: "Verified" },
        distinct: ["UserID"],
        select: { UserID: true },
      }),
      prisma.contribution_payment.findMany({
        where: { Status: "Verified" },
        orderBy: { VerifiedAt: "desc" },
        take: 5,
        select: {
          PaymentID: true,
          Amount: true,
          PaymentDate: true,
          IsAnonymous: true,
          contribution_campaign: { select: { Title: true } },
          user: { select: { Name: true, role: { select: { RoleName: true } } } },
        },
      }),
      canContribute
        ? prisma.contribution_payment.aggregate({
            where: { UserID: req.user.id, Status: "Verified" },
            _sum: { Amount: true },
            _count: { PaymentID: true },
          })
        : Promise.resolve(null),
    ]);

    const campaigns = rows.map((c) => mapCampaign(c, totals.get(c.CampaignID)));

    res.json({
      role,
      canContribute,
      stats: {
        totalRaised: [...totals.values()].reduce((s, t) => s + t.raised, 0),
        activeRequests: campaigns.filter((c) => c.displayStatus === "Open").length,
        completedRequests: campaigns.filter((c) => c.displayStatus === "Completed").length,
        supporters: supporters.length,
        myTotal: mine ? num(mine._sum.Amount) : 0,
        myCount: mine ? mine._count.PaymentID : 0,
      },
      campaigns,
      // students never see who gave; everyone else sees names unless the donor chose to hide theirs
      recent: recent.map((p) => ({
        id: p.PaymentID,
        donor:
          role === "Student"
            ? p.user.role.RoleName === "Alumni"
              ? "An alumnus"
              : "A staff member"
            : p.IsAnonymous
            ? "Anonymous"
            : p.user.Name,
        campaign: p.contribution_campaign.Title,
        amount: num(p.Amount),
        date: ymd(p.PaymentDate),
      })),
    });
  } catch (err) {
    next(err);
  }
};

/* ========================== STAFF and ALUMNI ========================== */

// GET /api/contributions/mine
exports.getMine = async (req, res, next) => {
  try {
    const rows = await prisma.contribution_payment.findMany({
      where: { UserID: req.user.id },
      orderBy: { SubmittedAt: "desc" },
      take: 200,
      select: {
        PaymentID: true,
        CampaignID: true,
        Amount: true,
        Reference: true,
        PaymentDate: true,
        Status: true,
        Remarks: true,
        SubmittedAt: true,
        contribution_campaign: { select: { Title: true } },
      },
    });

    const sum = (status) =>
      rows.filter((r) => r.Status === status).reduce((s, r) => s + num(r.Amount), 0);

    res.json({
      totals: { verified: sum("Verified"), pending: sum("Pending"), count: rows.length },
      payments: rows.map((p) => ({
        id: p.PaymentID,
        campaignId: p.CampaignID,
        campaign: p.contribution_campaign.Title,
        amount: num(p.Amount),
        reference: p.Reference,
        date: ymd(p.PaymentDate),
        submittedAt: p.SubmittedAt,
        status: p.Status,
        remarks: p.Remarks || "",
        receiptUrl: receiptPath(p.PaymentID),
      })),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/contributions/bank-details   (Staff, Alumni, Administrator; never students)
exports.getBank = async (req, res, next) => {
  try {
    const b = await prisma.institution_account.findFirst({ orderBy: { AccountID: "desc" } });
    res.json({ bank: b ? mapBank(b) : null });
  } catch (err) {
    next(err);
  }
};

// POST /api/contributions/campaigns/:id/payments   multipart: amount, reference, paymentDate, anonymous, receipt
exports.submitPayment = async (req, res, next) => {
  try {
    const campaignId = Number(req.params.id);
    const b = req.body || {};
    if (!isId(campaignId)) return res.status(400).json({ message: "Invalid request" });

    const amountText = String(b.amount ?? "").trim();
    if (!MONEY_RE.test(amountText) || Number(amountText) < 1 || Number(amountText) > MAX_PAYMENT) {
      return res.status(400).json({ message: "Enter an amount between Nu. 1 and Nu. 10,000,000" });
    }
    const amount = Number(amountText);

    const reference = String(b.reference || "").trim();
    if (!REF_RE.test(reference)) {
      return res.status(400).json({
        message: "Enter the transaction reference from your bank (4 to 50 letters, digits, - _ /)",
      });
    }

    const paymentDate = String(b.paymentDate || "");
    const latest = new Date(Date.now() + DAY).toISOString().slice(0, 10);
    if (!validDate(paymentDate) || paymentDate > latest) {
      return res.status(400).json({ message: "Enter the date you made the payment" });
    }

    if (!req.file) return res.status(400).json({ message: "Upload your payment receipt" });
    const receiptType = detectType(req.file.buffer);
    if (!receiptType) {
      return res.status(400).json({ message: "The receipt must be a JPG, PNG or PDF file" });
    }

    const campaign = await prisma.contribution_campaign.findUnique({ where: { CampaignID: campaignId } });
    if (!campaign || campaign.Status === "Draft") {
      return res.status(404).json({ message: "Request not found" });
    }
    if (campaign.ContributionType !== "Monetary") {
      return res.status(400).json({
        message: "This request accepts equipment or other support. Please contact the college office.",
      });
    }
    if (campaign.Status !== "Open" || isPast(campaign.Deadline)) {
      return res.status(400).json({ message: "This request is no longer accepting contributions" });
    }

    const duplicate = await prisma.contribution_payment.findFirst({
      where: { Reference: reference, Status: { in: ["Pending", "Verified"] } },
      select: { PaymentID: true },
    });
    if (duplicate) {
      return res.status(409).json({ message: "That transaction reference was already submitted" });
    }

    const [me, admins] = await Promise.all([
      prisma.user.findUnique({ where: { UserID: req.user.id }, select: { Name: true } }),
      prisma.user.findMany({
        where: { AccountStatus: "Active", role: { RoleName: "Administrator" } },
        select: { UserID: true },
      }),
    ]);

    const [payment] = await prisma.$transaction([
      prisma.contribution_payment.create({
        data: {
          CampaignID: campaignId,
          UserID: req.user.id,
          Amount: amount,
          Reference: reference,
          PaymentDate: toDate(paymentDate),
          ReceiptData: req.file.buffer,
          ReceiptType: receiptType,
          IsAnonymous: b.anonymous === "true" || b.anonymous === true,
        },
        select: { PaymentID: true },
      }),
      prisma.notification.createMany({
        data: admins.map((a) => ({
          UserID: a.UserID,
          NotificationType: "Contribution Payment",
          Message: `${me?.Name || "A user"} submitted ${money(amount)} for ${campaign.Title}. Awaiting verification.`.slice(0, 200),
        })),
      }),
    ]);

    res.status(201).json({
      message: "Payment submitted. You'll be notified once it has been verified.",
      id: payment.PaymentID,
    });
  } catch (err) {
    next(err);
  }
};

/* ============== PUBLIC FILE ROUTES (no login header needed) ============== */

// GET /api/contributions/payments/:id/receipt?token=...   short-lived signed link
exports.getReceipt = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    try {
      const t = jwt.verify(String(req.query.token || ""), receiptSecret());
      if (t.pid !== id) throw new Error("wrong receipt");
    } catch {
      return res.status(401).json({ message: "This link has expired. Reload the page and open the receipt again." });
    }

    const p = await prisma.contribution_payment.findUnique({
      where: { PaymentID: id },
      select: { ReceiptData: true, ReceiptType: true },
    });
    if (!p) return res.status(404).json({ message: "Receipt not found" });

    res.set({
      "Content-Type": p.ReceiptType,
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
    });
    res.send(Buffer.from(p.ReceiptData));
  } catch (err) {
    next(err);
  }
};

// GET /api/contributions/campaigns/:id/image   (campaign pictures are public information)
exports.getCampaignImage = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!isId(id)) return res.status(404).end();
    const c = await prisma.contribution_campaign.findUnique({
      where: { CampaignID: id },
      select: { ImageData: true, ImageType: true },
    });
    if (!c || !c.ImageData) return res.status(404).end();

    res.set({
      "Content-Type": c.ImageType,
      // helmet blocks cross-origin images by default; the frontend runs on another port
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Cache-Control": "public, max-age=86400",
    });
    res.send(Buffer.from(c.ImageData));
  } catch (err) {
    next(err);
  }
};

/* ============================ ADMINISTRATOR ============================ */

// GET /api/contributions/admin/overview  -> everything the admin page loads
exports.adminOverview = async (req, res, next) => {
  try {
    const [campaigns, totals, payments, bank] = await Promise.all([
      prisma.contribution_campaign.findMany({ orderBy: { CampaignID: "desc" } }),
      totalsMap(),
      prisma.contribution_payment.findMany({
        orderBy: { SubmittedAt: "desc" },
        take: 500,
        select: paymentSelect,
      }),
      prisma.institution_account.findFirst({ orderBy: { AccountID: "desc" } }),
    ]);

    res.json({
      campaigns: campaigns.map((c) => mapCampaign(c, totals.get(c.CampaignID))),
      contributions: payments.map(mapPayment),
      bank: mapBank(bank),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/contributions/campaigns   { title, category, type, target, deadline, description, publish }
exports.createCampaign = async (req, res, next) => {
  try {
    const b = req.body || {};
    const { data, error } = readCampaign(b);
    if (error) return res.status(400).json({ message: error });

    const publish = b.publish !== false;
    if (publish && isPast(toDate(data.deadline))) {
      return res.status(400).json({ message: "The deadline can't be in the past" });
    }

    const c = await prisma.contribution_campaign.create({
      data: {
        CreatorID: req.user.id,
        Title: data.title,
        Category: data.category,
        ContributionType: data.type,
        Description: data.description,
        TargetAmount: data.target,
        Deadline: toDate(data.deadline),
        Status: publish ? "Open" : "Draft",
      },
    });

    res.status(201).json({
      message: publish ? "Request published" : "Draft saved",
      campaign: mapCampaign(c, null),
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/contributions/campaigns/:id
exports.updateCampaign = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!isId(id)) return res.status(400).json({ message: "Invalid request" });

    const existing = await prisma.contribution_campaign.findUnique({ where: { CampaignID: id } });
    if (!existing) return res.status(404).json({ message: "Request not found" });

    const { data, error } = readCampaign(req.body || {});
    if (error) return res.status(400).json({ message: error });

    const collected = await prisma.contribution_payment.aggregate({
      where: { CampaignID: id, Status: "Verified" },
      _sum: { Amount: true },
    });
    if (data.target < num(collected._sum.Amount)) {
      return res.status(400).json({ message: "The target can't be lower than the amount already collected" });
    }
    if (existing.Status === "Open" && isPast(toDate(data.deadline))) {
      return res.status(400).json({ message: "The deadline can't be in the past for an open request" });
    }

    const c = await prisma.contribution_campaign.update({
      where: { CampaignID: id },
      data: {
        Title: data.title,
        Category: data.category,
        ContributionType: data.type,
        Description: data.description,
        TargetAmount: data.target,
        Deadline: toDate(data.deadline),
      },
    });
    const totals = await totalsMap();
    res.json({ message: "Request updated", campaign: mapCampaign(c, totals.get(id)) });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/contributions/campaigns/:id/status   { status: "Draft" | "Open" | "Closed" }
exports.setCampaignStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const status = (req.body || {}).status;
    if (!isId(id)) return res.status(400).json({ message: "Invalid request" });
    if (!CAMPAIGN_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${CAMPAIGN_STATUSES.join(", ")}` });
    }

    const c = await prisma.contribution_campaign.findUnique({ where: { CampaignID: id } });
    if (!c) return res.status(404).json({ message: "Request not found" });

    if (status === "Open" && isPast(c.Deadline)) {
      return res.status(400).json({ message: "The deadline has passed. Edit the request and extend it first." });
    }
    if (status === "Draft") {
      const payments = await prisma.contribution_payment.count({ where: { CampaignID: id } });
      if (payments > 0) {
        return res.status(400).json({ message: "This request already has contributions, so it can't go back to draft. Close it instead." });
      }
    }

    await prisma.contribution_campaign.update({ where: { CampaignID: id }, data: { Status: status } });
    res.json({ message: `Request is now ${status.toLowerCase()}` });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/contributions/campaigns/:id
exports.deleteCampaign = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!isId(id)) return res.status(400).json({ message: "Invalid request" });

    const payments = await prisma.contribution_payment.count({ where: { CampaignID: id } });
    if (payments > 0) {
      return res.status(409).json({ message: "This request has contributions, so it can't be deleted. Close it instead." });
    }
    const result = await prisma.contribution_campaign.deleteMany({ where: { CampaignID: id } });
    if (result.count === 0) return res.status(404).json({ message: "Request not found" });
    res.json({ message: "Request deleted" });
  } catch (err) {
    next(err);
  }
};

// POST /api/contributions/campaigns/:id/image   multipart: image (JPG or PNG)
exports.uploadCampaignImage = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!isId(id)) return res.status(400).json({ message: "Invalid request" });
    if (!req.file) return res.status(400).json({ message: "Choose an image" });

    const type = detectType(req.file.buffer);
    if (type !== "image/jpeg" && type !== "image/png") {
      return res.status(400).json({ message: "The image must be a JPG or PNG file" });
    }

    const result = await prisma.contribution_campaign.updateMany({
      where: { CampaignID: id },
      data: { ImageData: req.file.buffer, ImageType: type, ImageUpdatedAt: new Date() },
    });
    if (result.count === 0) return res.status(404).json({ message: "Request not found" });

    res.json({
      message: "Image saved",
      imageUrl: `/contributions/campaigns/${id}/image?v=${Date.now()}`,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/contributions/:id/verify   { status: "Verified" | "Rejected", remarks }
exports.reviewPayment = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const status = (req.body || {}).status;
    const remarks = String((req.body || {}).remarks || "").trim();

    if (!isId(id)) return res.status(400).json({ message: "Invalid payment" });
    if (!["Verified", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be Verified or Rejected" });
    }
    if (remarks.length > 250) {
      return res.status(400).json({ message: "Remarks must be 250 characters or less" });
    }
    if (status === "Rejected" && remarks.length < 5) {
      return res.status(400).json({ message: "Add a remark (at least 5 characters) so the contributor knows what to fix" });
    }

    const p = await prisma.contribution_payment.findUnique({
      where: { PaymentID: id },
      select: {
        UserID: true,
        Amount: true,
        contribution_campaign: { select: { Title: true } },
      },
    });
    if (!p) return res.status(404).json({ message: "Payment not found" });

    // only a Pending payment can be decided, even if two admins click at once
    const result = await prisma.contribution_payment.updateMany({
      where: { PaymentID: id, Status: "Pending" },
      data: {
        Status: status,
        Remarks: remarks || null,
        VerifiedBy: req.user.id,
        VerifiedAt: new Date(),
      },
    });
    if (result.count === 0) {
      return res.status(409).json({ message: "This payment was already reviewed" });
    }

    const title = p.contribution_campaign.Title;
    const message =
      status === "Verified"
        ? `Your contribution of ${money(p.Amount)} to ${title} was verified. Thank you!`
        : `Your contribution of ${money(p.Amount)} to ${title} was rejected: ${remarks}`;
    await prisma.notification.create({
      data: { UserID: p.UserID, NotificationType: "Contribution Update", Message: message.slice(0, 200) },
    });

    res.json({ message: `Payment ${status.toLowerCase()}` });
  } catch (err) {
    next(err);
  }
};

// PUT /api/contributions/bank-details   { bankName, accountName, accountNumber, branch }
exports.updateBank = async (req, res, next) => {
  try {
    const b = req.body || {};
    const bankName = String(b.bankName || "").trim();
    const accountName = String(b.accountName || "").trim();
    const accountNumber = String(b.accountNumber || "").trim();
    const branch = String(b.branch || "").trim();

    if (bankName.length < 2 || bankName.length > 100) {
      return res.status(400).json({ message: "Bank name must be 2 to 100 characters" });
    }
    if (accountName.length < 2 || accountName.length > 150) {
      return res.status(400).json({ message: "Account name must be 2 to 150 characters" });
    }
    if (!/^[0-9A-Za-z\- ]{5,40}$/.test(accountNumber)) {
      return res.status(400).json({ message: "Enter a valid account number" });
    }
    if (branch.length > 100) {
      return res.status(400).json({ message: "Branch must be 100 characters or less" });
    }

    const data = {
      BankName: bankName,
      AccountName: accountName,
      AccountNumber: accountNumber,
      Branch: branch || null,
      UpdatedBy: req.user.id,
      UpdatedAt: new Date(),
    };
    const existing = await prisma.institution_account.findFirst({ orderBy: { AccountID: "desc" } });
    const saved = existing
      ? await prisma.institution_account.update({ where: { AccountID: existing.AccountID }, data })
      : await prisma.institution_account.create({ data });

    res.json({ message: "Official bank details were updated", bank: mapBank(saved) });
  } catch (err) {
    next(err);
  }
};