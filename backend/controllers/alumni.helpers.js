// Small helpers shared by the three alumni controllers.
// Keeping them here means each controller only has the code for its own feature.
const prisma = require("../lib/prisma");

const LONG_TEXT_MAX = 5000; // our own limit for TEXT columns (the DB allows more)

// An error we throw on purpose, with the HTTP status to send back.
// Throwing it inside prisma.$transaction also rolls the transaction back.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// One place to turn an error into a response (used in every catch block).
function sendError(err, res, next) {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  if (err.code === "P2002") return res.status(409).json({ message: "That record already exists" });
  if (err.code === "P2003") return res.status(409).json({ message: "This record is linked to other data" });
  if (err.code === "P2025") return res.status(404).json({ message: "Not found" });
  next(err);
}

// Turns a URL id like "12" into the number 12. Returns null if it is not a valid id.
function parseId(value) {
  const text = String(value);
  if (!/^[1-9]\d{0,9}$/.test(text)) return null;
  const n = Number(text);
  return n <= 4294967295 ? n : null; // UNSIGNED INT maximum
}

// Cuts text to a maximum length (used for notification messages, max 200 chars).
function fit(text, max) {
  return text.length <= max ? text : text.slice(0, max - 3) + "...";
}

// Checks that year/month/day make a real calendar date (rejects 2026-02-31).
function isRealDate(y, m, d) {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

// "YYYY-MM-DD" -> Date, or null if invalid.
function parseDate(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!m || !isRealDate(+m[1], +m[2], +m[3])) return null;
  return new Date(text + "T00:00:00.000Z");
}

// "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm" (seconds optional) -> Date, or null if invalid.
// A time without a timezone is read in the server's timezone.
function parseDateTime(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(text);
  if (!m || !isRealDate(+m[1], +m[2], +m[3])) return null;
  if (m[4] !== undefined && (+m[4] > 23 || +m[5] > 59 || +(m[6] || 0) > 59)) return null;
  const date = new Date(text.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
}

/*
  Reads and checks fields from a request body.
  spec  = list of { name, label, type: "text" | "longtext" | "date" | "datetime", required, max }
  partial = true for updates: only fields that were sent are checked.
  Returns { data } on success or { error } with a clear message.
  Only fields listed in spec are copied, so nothing extra can be saved.
*/
function readFields(body, spec, partial) {
  const data = {};
  for (const f of spec) {
    if (partial && !(f.name in body)) continue;
    const raw = body[f.name];

    // Missing, null or empty text
    if (raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "")) {
      if (f.required) return { error: `${f.label} is required` };
      data[f.name] = null;
      continue;
    }

    if (typeof raw !== "string") return { error: `${f.label} must be text` };
    const value = raw.trim();

    if (f.type === "text" || f.type === "longtext") {
      const max = f.type === "text" ? f.max : LONG_TEXT_MAX;
      if (value.length > max) return { error: `${f.label} must be at most ${max} characters` };
      data[f.name] = value;
    } else if (f.type === "date") {
      const date = parseDate(value);
      if (!date) return { error: `${f.label} must be a valid date (YYYY-MM-DD)` };
      data[f.name] = date;
    } else if (f.type === "datetime") {
      const date = parseDateTime(value);
      if (!date) return { error: `${f.label} must be a valid date and time (YYYY-MM-DDTHH:mm)` };
      data[f.name] = date;
    }
  }
  return { data };
}

// Finds the alumni row of the logged-in user. The id always comes from the login token,
// never from the request body or URL.
async function getMyAlumni(userId) {
  const alumni = await prisma.alumni.findUnique({
    where: { UserID: userId },
    select: { AlumniID: true, user: { select: { Name: true, AccountStatus: true } } },
  });
  if (!alumni) throw new HttpError(404, "Alumni profile not found");
  // A token stays valid for a day, so check the account is still active (e.g. not suspended).
  if (alumni.user.AccountStatus !== "Active") throw new HttpError(403, "Your account is not active");
  return { AlumniID: alumni.AlumniID, Name: alumni.user.Name };
}

module.exports = { HttpError, sendError, parseId, fit, readFields, getMyAlumni };