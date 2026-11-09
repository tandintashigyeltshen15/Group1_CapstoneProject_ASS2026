// backend/controllers/memberContributions.controller.js
// Contributor-side endpoints (staff + alumni): browse open campaigns, see bank
// details, submit a payment with a receipt, and view their own contributions.

const prisma = require("../lib/prisma");

const ALLOWED_RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const getUserId = (req) =>
  Number(req.user?.UserID ?? req.user?.userId ?? req.user?.id ?? req.user?.sub);

const num = (d) => (d == null ? 0 : Number(d));
const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);
const fail = (res, status, message) => res.status(status).json({ success: false, message });

// GET /campaigns  -> open campaigns with verified progress
exports.listOpenCampaigns = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    const campaigns = await prisma.contribution_campaign.findMany({
      where: { Status: "Open" },
      orderBy: { Deadline: "asc" },
      select: {
        CampaignID: true,
        Title: true,
        Category: true,
        ContributionType: true,
        Description: true,
        TargetAmount: true,
        Deadline: true,
        ImageType: true,
      },
    });

    const ids = campaigns.map((c) => c.CampaignID);
    let raised = [];
    let mine = [];
    if (ids.length) {
      [raised, mine] = await Promise.all([
        prisma.contribution_payment.groupBy({
          by: ["CampaignID"],
          where: { CampaignID: { in: ids }, Status: "Verified" },
          _sum: { Amount: true },
          _count: { _all: true },
        }),
        prisma.contribution_payment.groupBy({
          by: ["CampaignID"],
          where: { CampaignID: { in: ids }, UserID: userId },
          _count: { _all: true },
        }),
      ]);
    }

    const raisedMap = new Map(raised.map((r) => [r.CampaignID, r]));
    const mineMap = new Map(mine.map((r) => [r.CampaignID, r._count._all]));

    const data = campaigns.map((c) => {
      const r = raisedMap.get(c.CampaignID);
      return {
        id: c.CampaignID,
        title: c.Title,
        category: c.Category,
        type: c.ContributionType,
        description: c.Description,
        targetAmount: num(c.TargetAmount),
        raisedAmount: num(r?._sum.Amount),
        contributorCount: r?._count._all ?? 0,
        deadline: day(c.Deadline),
        hasImage: !!c.ImageType,
        myContributions: mineMap.get(c.CampaignID) ?? 0,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /campaigns/:id/image
exports.getCampaignImage = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return fail(res, 400, "Invalid campaign.");

    const c = await prisma.contribution_campaign.findUnique({
      where: { CampaignID: id },
      select: { ImageData: true, ImageType: true, Status: true },
    });
    if (!c || !c.ImageData || c.Status === "Draft") return fail(res, 404, "Image not found.");

    res.set("Content-Type", c.ImageType || "image/jpeg");
    res.set("Cache-Control", "private, max-age=300");
    res.send(Buffer.from(c.ImageData));
  } catch (err) {
    next(err);
  }
};

// GET /bank-details
exports.getBankDetails = async (req, res, next) => {
  try {
    const a = await prisma.institution_account.findFirst({ orderBy: { UpdatedAt: "desc" } });
    res.json({
      success: true,
      data: a
        ? {
            bankName: a.BankName,
            accountName: a.AccountName,
            accountNumber: a.AccountNumber,
            branch: a.Branch,
            instructions: a.Instructions ?? null,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
};

// GET /my-payments
exports.listMyPayments = async (req, res, next) => {
  try {
    const rows = await prisma.contribution_payment.findMany({
      where: { UserID: getUserId(req) },
      orderBy: { SubmittedAt: "desc" },
      select: {
        PaymentID: true,
        Amount: true,
        Reference: true,
        PaymentDate: true,
        IsAnonymous: true,
        Status: true,
        Remarks: true,
        SubmittedAt: true,
        VerifiedAt: true,
        ReceiptType: true,
        contribution_campaign: { select: { CampaignID: true, Title: true } },
      },
    });

    const data = rows.map((p) => ({
      id: p.PaymentID,
      campaignId: p.contribution_campaign?.CampaignID,
      campaignTitle: p.contribution_campaign?.Title ?? "Campaign",
      amount: num(p.Amount),
      reference: p.Reference,
      paymentDate: day(p.PaymentDate),
      isAnonymous: !!p.IsAnonymous,
      status: p.Status,
      remarks: p.Remarks,
      submittedAt: p.SubmittedAt,
      verifiedAt: p.VerifiedAt,
      receiptType: p.ReceiptType,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /my-payments/:id/receipt  (owner only)
exports.getMyReceipt = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return fail(res, 400, "Invalid payment.");

    const p = await prisma.contribution_payment.findFirst({
      where: { PaymentID: id, UserID: getUserId(req) },
      select: { ReceiptData: true, ReceiptType: true },
    });
    if (!p) return fail(res, 404, "Receipt not found.");

    res.set("Content-Type", p.ReceiptType);
    res.send(Buffer.from(p.ReceiptData));
  } catch (err) {
    next(err);
  }
};

// POST /campaigns/:id/payments   (multipart: amount, reference, paymentDate, isAnonymous, receipt)
exports.submitPayment = async (req, res, next) => {
  try {
    const campaignId = Number(req.params.id);
    if (!Number.isInteger(campaignId)) return fail(res, 400, "Invalid campaign.");

    const campaign = await prisma.contribution_campaign.findUnique({
      where: { CampaignID: campaignId },
      select: { Status: true, ContributionType: true, Deadline: true, Title: true },
    });
    if (!campaign || campaign.Status !== "Open") {
      return fail(res, 400, "This campaign is not open for contributions.");
    }
    if (campaign.ContributionType !== "Monetary") {
      return fail(res, 400, "This campaign does not accept payments. Contact the alumni office to contribute.");
    }
    if (day(campaign.Deadline) < new Date().toISOString().slice(0, 10)) {
      return fail(res, 400, "The deadline for this campaign has passed.");
    }

    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 99999999) {
      return fail(res, 400, "Enter an amount greater than zero.");
    }

    const reference = String(req.body.reference || "").trim();
    if (!reference || reference.length > 50) {
      return fail(res, 400, "Enter the transaction or journal number (up to 50 characters).");
    }

    const dateStr = String(req.body.paymentDate || "");
    const paymentDate = new Date(`${dateStr}T00:00:00.000Z`);
    const latestAllowed = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || Number.isNaN(paymentDate.getTime()) || dateStr > latestAllowed) {
      return fail(res, 400, "Enter a valid payment date that is not in the future.");
    }

    if (!req.file) return fail(res, 400, "Upload your payment receipt.");
    if (!ALLOWED_RECEIPT_TYPES.includes(req.file.mimetype)) {
      return fail(res, 400, "Receipt must be a JPG, PNG, WebP or PDF file.");
    }

    const duplicate = await prisma.contribution_payment.findFirst({
      where: { Reference: reference, Status: { not: "Rejected" } },
      select: { PaymentID: true },
    });
    if (duplicate) {
      return fail(res, 409, "A payment with this transaction number has already been submitted.");
    }

    const created = await prisma.contribution_payment.create({
      data: {
        CampaignID: campaignId,
        UserID: getUserId(req),
        Amount: amount.toFixed(2),
        Reference: reference,
        PaymentDate: paymentDate,
        ReceiptData: req.file.buffer,
        ReceiptType: req.file.mimetype,
        IsAnonymous: req.body.isAnonymous === "true" || req.body.isAnonymous === "1" ? 1 : 0,
      },
      select: { PaymentID: true, Status: true },
    });

    res.status(201).json({
      success: true,
      message: "Payment submitted. An admin will verify it shortly.",
      data: { id: created.PaymentID, status: created.Status },
    });
  } catch (err) {
    next(err);
  }
};