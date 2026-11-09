// Staff portal: the logged-in staff member's own profile and notifications.
// Every route that uses this file is protected in staffPortal.routes.js
// (authenticate + requireRole("Staff")), so req.user.id is always a staff user.
const prisma = require("../lib/prisma");
const { HttpError, sendError, parseId } = require("./alumni.helpers");

/* --------------------------------- helpers --------------------------------- */

// Finds the staff row of the logged-in user. The id always comes from the login token,
// never from the request body or URL.
async function getMyStaff(userId) {
  const staff = await prisma.staff.findUnique({
    where: { UserID: userId },
    select: {
      StaffID: true,
      PhoneNo: true,
      Designation: true,
      department: { select: { DepartmentName: true } },
      user: { select: { Name: true, Email: true, AccountStatus: true, ProfilePhoto: true } },
    },
  });
  if (!staff) throw new HttpError(404, "Staff profile not found");
  // A token stays valid for a day, so check the account is still active.
  if (staff.user.AccountStatus !== "Active") throw new HttpError(403, "Your account is not active");
  return staff;
}

// Uses the same field names as staffProfile in the frontend's lib/store.js,
// so the staff pages need no changes when they switch from mock data to the API.
function toProfile(staff) {
  return {
    name: staff.user.Name,
    email: staff.user.Email,
    employeeId: staff.StaffID,
    phone: staff.PhoneNo || "",
    department: staff.department.DepartmentName,
    designation: staff.Designation || "",
    photoUrl: staff.user.ProfilePhoto || "",
  };
}

// Reads a text field from the body; rejects numbers, objects, arrays.
function asText(value, label) {
  if (typeof value !== "string") throw new HttpError(400, `${label} must be text`);
  return value.trim();
}

/* ---------------------------------- profile --------------------------------- */

// GET /api/staff/me
exports.getMyProfile = async (req, res, next) => {
  try {
    res.json(toProfile(await getMyStaff(req.user.id)));
  } catch (err) {
    sendError(err, res, next);
  }
};

// PUT /api/staff/me   body: { name?, phone?, designation? }  (only fields you send are changed)
// Email, employee ID and department are not editable here: the email and employee ID are
// the staff member's login details, and the department is set by an administrator.
exports.updateMyProfile = async (req, res, next) => {
  try {
    await getMyStaff(req.user.id);
    const body = req.body || {};
    const userData = {}; // columns on the User table
    const staffData = {}; // columns on the Staff table

    if ("name" in body) {
      const name = asText(body.name ?? "", "Name");
      if (name.length < 2 || name.length > 50) throw new HttpError(400, "Name must be 2 to 50 characters");
      userData.Name = name;
    }
    if ("phone" in body) {
      const phone = asText(body.phone ?? "", "Phone number");
      if (phone && !/^\d{8}$/.test(phone)) throw new HttpError(400, "Phone number must be 8 digits");
      staffData.PhoneNo = phone || null; // empty clears it
    }
    if ("designation" in body) {
      const designation = asText(body.designation ?? "", "Designation");
      if (designation.length > 100) throw new HttpError(400, "Designation must be at most 100 characters");
      staffData.Designation = designation || null;
    }

    const hasStaffChanges = Object.keys(staffData).length > 0;
    if (Object.keys(userData).length === 0 && !hasStaffChanges) {
      throw new HttpError(400, "Send at least one field to change");
    }

    // One update call changes both tables together (all or nothing)
    await prisma.user.update({
      where: { UserID: req.user.id },
      data: {
        ...userData,
        ...(hasStaffChanges ? { staff: { update: staffData } } : {}),
      },
    });

    res.json(toProfile(await getMyStaff(req.user.id)));
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ message: "That phone number is already in use" });
    sendError(err, res, next);
  }
};

/* ------------------------------- notifications ------------------------------- */

const NOTIFICATION_SELECT = {
  NotificationID: true,
  NotificationType: true,
  Message: true,
  CreatedAt: true,
  IsRead: true,
};

// Same field names as staffNotifications in the frontend's lib/store.js
const toNotification = (n) => ({
  id: n.NotificationID,
  type: n.NotificationType,
  message: n.Message,
  createdAt: n.CreatedAt,
  isRead: n.IsRead,
});

// GET /api/staff/notifications   (newest first, at most 100)
exports.listNotifications = async (req, res, next) => {
  try {
    const rows = await prisma.notification.findMany({
      where: { UserID: req.user.id },
      select: NOTIFICATION_SELECT,
      orderBy: { CreatedAt: "desc" },
      take: 100,
    });
    res.json(rows.map(toNotification));
  } catch (err) {
    sendError(err, res, next);
  }
};

// POST /api/staff/notifications/read-all
exports.markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { UserID: req.user.id, IsRead: false },
      data: { IsRead: true },
    });
    res.json({ updated: result.count });
  } catch (err) {
    sendError(err, res, next);
  }
};

// PATCH /api/staff/notifications/:id/read
exports.markNotificationRead = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new HttpError(400, "Invalid notification id");

    // UserID is in the filter, so someone else's notification gives a 404
    const result = await prisma.notification.updateMany({
      where: { NotificationID: id, UserID: req.user.id },
      data: { IsRead: true },
    });
    if (result.count === 0) throw new HttpError(404, "Notification not found");
    res.json({ message: "Marked as read" });
  } catch (err) {
    sendError(err, res, next);
  }
};