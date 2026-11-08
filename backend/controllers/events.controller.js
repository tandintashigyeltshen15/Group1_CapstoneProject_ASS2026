// Events: Alumni, Staff and Administrator can post events (hosted by us or held
// elsewhere that could help students). Every logged-in role can view and register.
const prisma = require("../lib/prisma");
const { HttpError, sendError, parseId, readFields } = require("./alumni.helpers");

// If the database rejects a status, run: SHOW CREATE TABLE event;  and fix this list.
const STATUSES = ["Published", "Cancelled"];
const MANAGERS = ["Staff", "Administrator"]; // may edit or delete ANY event

const FIELDS = [
  { name: "Title", label: "Title", type: "text", required: true, max: 200 },
  { name: "Description", label: "Description", type: "longtext" },
  { name: "DateTime", label: "Date and time", type: "datetime", required: true },
  { name: "Duration", label: "Duration", type: "text", max: 50 },
  { name: "Venue", label: "Venue", type: "text", max: 200 },
];

const EVENT_SELECT = {
  EventID: true,
  Title: true,
  Description: true,
  DateTime: true,
  Duration: true,
  Venue: true,
  Status: true,
  CreatorID: true,
  user: { select: { Name: true, role: { select: { RoleName: true } } } },
  _count: { select: { event_registration: true } },
};

// Loads an event and checks the logged-in user may change it.
async function loadEditableEvent(req) {
  const id = parseId(req.params.id);
  if (!id) throw new HttpError(400, "Invalid event id");
  const event = await prisma.event.findUnique({ where: { EventID: id } });
  if (!event) throw new HttpError(404, "Event not found");
  const isOwner = event.CreatorID === req.user.id;
  if (!isOwner && !MANAGERS.includes(req.user.role)) {
    throw new HttpError(403, "You can only change events you posted");
  }
  return event;
}

// GET /api/events?status=Published&upcoming=true
exports.listEvents = async (req, res, next) => {
  try {
    const where = {};
    // Students and alumni only see published events; staff/admin can filter by status.
    if (MANAGERS.includes(req.user.role) && req.query.status) {
      if (!STATUSES.includes(req.query.status)) {
        throw new HttpError(400, `Status must be one of: ${STATUSES.join(", ")}`);
      }
      where.Status = req.query.status;
    } else if (!MANAGERS.includes(req.user.role)) {
      where.Status = "Published";
    }
    if (req.query.upcoming === "true") where.DateTime = { gte: new Date() };

    const events = await prisma.event.findMany({
      where,
      select: EVENT_SELECT,
      orderBy: { DateTime: "asc" },
    });
    res.json(events);
  } catch (err) {
    sendError(err, res, next);
  }
};

// GET /api/events/mine  (events I posted)
exports.listMyEvents = async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: { CreatorID: req.user.id },
      select: EVENT_SELECT,
      orderBy: { DateTime: "asc" },
    });
    res.json(events);
  } catch (err) {
    sendError(err, res, next);
  }
};

// GET /api/events/registrations/mine  (events I registered for)
exports.listMyRegistrations = async (req, res, next) => {
  try {
    const rows = await prisma.event_registration.findMany({
      where: { UserID: req.user.id },
      select: {
        RegistrationID: true,
        RegistrationDate: true,
        event: { select: EVENT_SELECT },
      },
      orderBy: { RegistrationDate: "desc" },
    });
    res.json(rows);
  } catch (err) {
    sendError(err, res, next);
  }
};

// GET /api/events/:id
exports.getEvent = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new HttpError(400, "Invalid event id");
    const event = await prisma.event.findUnique({ where: { EventID: id }, select: EVENT_SELECT });
    if (!event) throw new HttpError(404, "Event not found");
    if (event.Status !== "Published" && event.CreatorID !== req.user.id && !MANAGERS.includes(req.user.role)) {
      throw new HttpError(404, "Event not found");
    }
    const registered = await prisma.event_registration.findUnique({
      where: { UserID_EventID: { UserID: req.user.id, EventID: id } },
    });
    res.json({ ...event, isRegistered: !!registered });
  } catch (err) {
    sendError(err, res, next);
  }
};

// POST /api/events
exports.createEvent = async (req, res, next) => {
  try {
    const { data, error } = readFields(req.body || {}, FIELDS, false);
    if (error) throw new HttpError(400, error);
    if (data.DateTime < new Date()) throw new HttpError(400, "Event date and time must be in the future");

    const event = await prisma.event.create({
      data: { ...data, CreatorID: req.user.id },
      select: EVENT_SELECT,
    });
    res.status(201).json(event);
  } catch (err) {
    sendError(err, res, next);
  }
};

// PUT /api/events/:id
exports.updateEvent = async (req, res, next) => {
  try {
    await loadEditableEvent(req);
    const { data, error } = readFields(req.body || {}, FIELDS, true);
    if (error) throw new HttpError(400, error);
    if (Object.keys(data).length === 0) throw new HttpError(400, "Send at least one field to change");

    const event = await prisma.event.update({
      where: { EventID: parseId(req.params.id) },
      data,
      select: EVENT_SELECT,
    });
    res.json(event);
  } catch (err) {
    sendError(err, res, next);
  }
};

// PATCH /api/events/:id   { "Status": "Cancelled" }
exports.setEventStatus = async (req, res, next) => {
  try {
    await loadEditableEvent(req);
    const status = req.body && req.body.Status;
    if (!STATUSES.includes(status)) throw new HttpError(400, `Status must be one of: ${STATUSES.join(", ")}`);
    const event = await prisma.event.update({
      where: { EventID: parseId(req.params.id) },
      data: { Status: status },
      select: EVENT_SELECT,
    });
    res.json(event);
  } catch (err) {
    sendError(err, res, next);
  }
};

// DELETE /api/events/:id   (registrations are removed automatically)
exports.deleteEvent = async (req, res, next) => {
  try {
    await loadEditableEvent(req);
    await prisma.event.delete({ where: { EventID: parseId(req.params.id) } });
    res.json({ message: "Event deleted" });
  } catch (err) {
    sendError(err, res, next);
  }
};

// POST /api/events/:id/register
exports.registerForEvent = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new HttpError(400, "Invalid event id");
    const event = await prisma.event.findUnique({ where: { EventID: id } });
    if (!event || event.Status !== "Published") throw new HttpError(404, "Event not found");
    if (event.DateTime < new Date()) throw new HttpError(400, "This event has already taken place");

    const existing = await prisma.event_registration.findUnique({
      where: { UserID_EventID: { UserID: req.user.id, EventID: id } },
    });
    if (existing) throw new HttpError(409, "You are already registered for this event");

    const reg = await prisma.event_registration.create({
      data: { UserID: req.user.id, EventID: id },
    });
    res.status(201).json({ message: "Registered for the event", RegistrationID: reg.RegistrationID });
  } catch (err) {
    sendError(err, res, next);
  }
};

// DELETE /api/events/:id/register
exports.cancelRegistration = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new HttpError(400, "Invalid event id");
    const result = await prisma.event_registration.deleteMany({
      where: { UserID: req.user.id, EventID: id },
    });
    if (result.count === 0) throw new HttpError(404, "You are not registered for this event");
    res.json({ message: "Registration cancelled" });
  } catch (err) {
    sendError(err, res, next);
  }
};

// GET /api/events/:id/registrations   (owner, staff or admin: who is attending)
exports.listRegistrations = async (req, res, next) => {
  try {
    await loadEditableEvent(req);
    const rows = await prisma.event_registration.findMany({
      where: { EventID: parseId(req.params.id) },
      select: {
        RegistrationID: true,
        RegistrationDate: true,
        user: { select: { Name: true, role: { select: { RoleName: true } } } }, // no email
      },
      orderBy: { RegistrationDate: "asc" },
    });
    res.json(rows);
  } catch (err) {
    sendError(err, res, next);
  }
};