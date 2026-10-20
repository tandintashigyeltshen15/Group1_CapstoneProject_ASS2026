"use client";
/* ------------------------------------------------------------------
   Frontend-only data store (localStorage).
   Every key matches a table in the MySQL schema, so later you can
   swap these hooks for API calls without changing the pages.

   useStore("mentorship")  -> [value, setValue]   (like useState)
   update(key, fn)         -> change data from anywhere
   addNotification(...)    -> adds a row for the Notification table
------------------------------------------------------------------- */
import { useCallback, useSyncExternalStore } from "react";

const PREFIX = "cst-portal:";
const listeners = new Set();
const cache = {};

export const SEEDS = {
  // Alumni_Profile + User
  profile: {
    name: "Sonam Dorji",
    email: "sonam.dorji@drukconnect.bt",
    phone: "17123456",
    location: "Thimphu, Bhutan",
    programme: "B.E. in Information Technology",
    graduationYear: 2021,
    professionalBackground:
      "Passionate software engineer and lifelong learner. Grateful to CST for the foundation and opportunities. Committed to giving back to the college community.",
    areaOfExpertise: "Web Development, Cloud Computing, Mentoring",
    linkedin: "linkedin.com/in/sonam-dorji",
    github: "github.com/sonam-dorji",
    website: "",
    isAvailableForMentorship: true,
    isProfilePublic: true,
  },
  // Career_History
  career: [
    { id: 1, organization: "DrukConnect", position: "Software Engineer", startDate: "2025-01-06", endDate: "" },
    { id: 2, organization: "Bhutan Telecom", position: "Junior Developer", startDate: "2023-02-01", endDate: "2024-12-31" },
    { id: 3, organization: "Druk Green Power Corporation", position: "IT Intern", startDate: "2021-07-01", endDate: "2022-01-31" },
  ],
  // Publication
  publications: [
    { id: 1, title: "Adoption of Digital Records in Bhutanese Public Offices", publicationType: "Journal Article", publicationDate: "2023-05-12" },
  ],
  // Project
  projects: [
    { id: 1, title: "Hydropower Plant Monitoring Dashboard", description: "Real-time dashboard for plant output and maintenance alerts.", startDate: "2022-03-01", endDate: "2023-01-31", fundingAgency: "Druk Green Power Corporation" },
  ],
  // Contribution
  contributions: [
    { id: 1, categoryType: "Financial Support", description: "Donation to the CST Scholarship Fund.", contributionDate: "2024-10-12" },
    { id: 2, categoryType: "Equipment Donation", description: "Computer Lab Upgrade: donated 5 desktop computers.", contributionDate: "2023-06-20" },
    { id: 3, categoryType: "Guest Lecture", description: "Talk on career paths in software engineering for final-year students.", contributionDate: "2025-03-14" },
  ],
  // Mentorship_Request
  mentorship: [
    { id: 1, studentName: "Pema Choden", studentId: "02210045", subject: "Guidance on building a web development portfolio", detail: "I am a third-year IT student and want advice on which projects to include.", duration: "3 months", requestDate: "2026-10-12", status: "Pending" },
    { id: 2, studentName: "Tenzin Wangmo", studentId: "02210112", subject: "Preparing for software engineering interviews", detail: "Looking for mock interviews and feedback on my CV.", duration: "2 months", requestDate: "2026-10-14", status: "Pending" },
    { id: 3, studentName: "Karma Jamtsho", studentId: "02200078", subject: "Cloud computing career advice", detail: "Which certifications should I start with?", duration: "1 month", requestDate: "2026-10-08", status: "Pending" },
    { id: 4, studentName: "Dechen Yangzom", studentId: "02210201", subject: "Final year project topic selection", detail: "I need help choosing a project topic.", duration: "1 month", requestDate: "2026-09-28", status: "Accepted" },
  ],
  // Opportunity (OpportunityType = Internship)
  opportunities: [
    { id: 1, title: "Web Development Intern", organization: "Druk Green Power Corporation", description: "Work with our team on internal dashboards using React and Node.js.", deadline: "2026-11-30", startDate: "2027-01-05", duration: "3 months", eligibilityRequirements: "3rd/4th year IT or CS students with basic JavaScript knowledge.", status: "Open" },
  ],
  // Application (students applying to the alumni's opportunities)
  applications: [
    { id: 1, opportunityId: 1, studentName: "Sonam Pelden", studentId: "02210150", submissionDate: "2026-10-15", applicationStatus: "Submitted" },
    { id: 2, opportunityId: 1, studentName: "Ugyen Tshering", studentId: "02200033", submissionDate: "2026-10-16", applicationStatus: "UnderReview" },
  ],
  // Event
  events: [
    { id: 1, title: "Career Fair 2026", description: "Meet employers and alumni from across Bhutan.", dateTime: "2026-11-03T09:00", duration: "1 day", venue: "CST Campus", status: "Published" },
    { id: 2, title: "Alumni Homecoming", description: "Annual gathering of CST alumni with talks and dinner.", dateTime: "2026-11-21T16:00", duration: "4 hours", venue: "CST Auditorium", status: "Published" },
    { id: 3, title: "Tech Talk: AI in Bhutan", description: "Panel discussion on the future of AI in the region.", dateTime: "2026-12-05T14:00", duration: "2 hours", venue: "Seminar Hall", status: "Published" },
    { id: 4, title: "Freshers' Welcome 2026", description: "Welcome event for new students.", dateTime: "2026-08-20T10:00", duration: "3 hours", venue: "CST Ground", status: "Completed" },
  ],
  // Event_Registration
  registrations: [],
  // Notification
  notifications: [
    { id: 1, type: "Mentorship", message: "Pema Choden sent you a new mentorship request.", createdAt: "2026-10-12T10:20:00", isRead: false },
    { id: 2, type: "Application", message: "Sonam Pelden applied to Web Development Intern.", createdAt: "2026-10-15T09:05:00", isRead: false },
    { id: 3, type: "Event", message: "Alumni Homecoming registration is now open.", createdAt: "2026-10-10T08:00:00", isRead: true },
  ],
  // Settings (frontend preferences)
  settings: {
    emailNotifications: true,
    mentorshipAlerts: true,
    eventReminders: true,
    applicationUpdates: true,
  },
};

function readKey(key) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return SEEDS[key];
    const hit = cache[key];
    if (hit && hit.raw === raw) return hit.value;
    const value = JSON.parse(raw);
    cache[key] = { raw, value };
    return value;
  } catch {
    return SEEDS[key];
  }
}

function writeKey(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: ignore */
  }
  listeners.forEach((l) => l());
}

export function update(key, fn) {
  writeKey(key, fn(readKey(key)));
}

export function nextId(list) {
  return list.reduce((m, x) => Math.max(m, x.id), 0) + 1;
}

export function addNotification(type, message) {
  update("notifications", (list) => [
    { id: nextId(list), type, message, createdAt: new Date().toISOString(), isRead: false },
    ...list,
  ]);
}

export function resetDemoData() {
  Object.keys(SEEDS).forEach((k) => window.localStorage.removeItem(PREFIX + k));
  Object.keys(cache).forEach((k) => delete cache[k]);
  listeners.forEach((l) => l());
}

function subscribe(cb) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export function useStore(key) {
  const value = useSyncExternalStore(
    subscribe,
    () => readKey(key),
    () => SEEDS[key]
  );
  const set = useCallback(
    (next) => writeKey(key, typeof next === "function" ? next(readKey(key)) : next),
    [key]
  );
  return [value, set];
}

/* ----------------------------- helpers ----------------------------- */
export const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "";

export const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
      })
    : "";

export const formatMonthYear = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "";

/* "2 yrs 3 mos" between two dates (end empty = today) */
export function durationText(start, end) {
  if (!start) return "";
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const total = Math.max(0, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()));
  const yrs = Math.floor(total / 12);
  const mos = total % 12;
  const parts = [];
  if (yrs) parts.push(`${yrs} yr${yrs > 1 ? "s" : ""}`);
  if (mos) parts.push(`${mos} mo${mos > 1 ? "s" : ""}`);
  return parts.join(" ") || "Less than a month";
}
