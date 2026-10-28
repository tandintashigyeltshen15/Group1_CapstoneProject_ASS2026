"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  LayoutGrid,
  Briefcase,
  Users,
  CalendarDays,
  Send,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  Hourglass,
  Check,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------
   DATA (temporary): empty for now. Later, the backend combines three
   sources into one list: internship applications, mentorship requests
   and event registrations.

   applications: {
     id, type: "Internship" | "Mentorship" | "Event",
     title, subtitle,              // e.g. "Software Intern", "DrukTech Solutions"
     appliedAt: "2026-10-18",
     deadline: "2026-11-30",       // internships only
     eventDate: "2026-11-20",      // events only
     description,
     status: see statusConfig below
   }
------------------------------------------------------------------- */
const applications = [
  { id: 1, type: "Internship", title: "Software Engineering Intern", subtitle: "DrukTech Solutions",
    appliedAt: "2026-10-12", deadline: "2026-11-30", status: "UNDER_REVIEW",
    description: "Work with our web team on real projects." },
  { id: 2, type: "Mentorship", title: "Mentorship Request", subtitle: "to Test Alumni (Alumnus)",
    appliedAt: "2026-10-05", status: "PENDING",
    description: "Seeking guidance on a software engineering career." },
  { id: 3, type: "Event", title: "CST Alumni Career Talk", subtitle: "CST Alumni Association",
    appliedAt: "2026-10-10", eventDate: "2026-11-20", status: "REGISTERED" },
];

const tabs = [
  { label: "All Applications", type: null, icon: LayoutGrid },
  { label: "Internships", type: "Internship", icon: Briefcase },
  { label: "Mentorship", type: "Mentorship", icon: Users },
  { label: "Events", type: "Event", icon: CalendarDays },
];

const typeConfig = {
  Internship: { badge: "bg-primary", icon: Briefcase, dateLabel: "Application Date" },
  Mentorship: { badge: "bg-warning", icon: Users, dateLabel: "Application Date" },
  Event: { badge: "bg-success", icon: CalendarDays, dateLabel: "Registered on" },
};

const statusConfig = {
  // Internships (the 4 stages from the proposal)
  APPLIED: {
    label: "Applied",
    style: "bg-blue-100 text-primary",
    icon: Send,
    message: "Your application has been submitted.",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    style: "bg-orange-100 text-warning",
    icon: Clock,
    message: "Your application is currently being reviewed.",
  },
  SHORTLISTED: {
    label: "Shortlisted",
    style: "bg-purple-100 text-accent",
    icon: Star,
    message: "You have been shortlisted. Keep an eye on your notifications.",
  },
  ACCEPTED: {
    label: "Accepted",
    style: "bg-green-100 text-success",
    icon: CheckCircle2,
    message: "Congratulations! Your application has been accepted.",
  },
  NOT_SELECTED: {
    label: "Not Selected",
    style: "bg-red-100 text-danger",
    icon: XCircle,
    message: "Unfortunately, you were not selected this time.",
  },
  // Mentorship requests
  PENDING: {
    label: "Pending",
    style: "bg-purple-100 text-accent",
    icon: Hourglass,
    message: "Your request is waiting for the mentor's response.",
  },
  DECLINED: {
    label: "Declined",
    style: "bg-red-100 text-danger",
    icon: XCircle,
    message: "The mentor was unable to accept this request.",
  },
  // Events
  REGISTERED: {
    label: "Registered",
    style: "bg-blue-100 text-primary",
    icon: CheckCircle2,
    message: "You are successfully registered for this event.",
  },
};

const stages = ["APPLIED", "UNDER_REVIEW", "SHORTLISTED", "DECISION"];
const stageIndex = (status) =>
  ({ APPLIED: 0, UNDER_REVIEW: 1, SHORTLISTED: 2, ACCEPTED: 3, NOT_SELECTED: 3 }[status] ?? 0);

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/* ----------------------------- pieces ----------------------------- */
function StatusBadge({ status }) {
  const { label, style, icon: Icon } = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${style}`}
    >
      <Icon size={15} /> {label}
    </span>
  );
}

function Thumb({ type }) {
  const { badge, icon: Icon } = typeConfig[type];
  return (
    <div className="relative flex h-24 w-36 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-sidebar to-primary text-white/80">
      <Icon size={32} />
      <span
        className={`absolute left-2 top-2 rounded-md px-2 py-0.5 text-xs font-medium text-white ${badge}`}
      >
        {type}
      </span>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-sidebar">{title}</h3>
          <button onClick={onClose}>
            <X size={18} className="text-muted" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Stepper({ status }) {
  const current = stageIndex(status);
  const rejected = status === "NOT_SELECTED";
  const finalLabel = status === "ACCEPTED" ? "Accepted" : rejected ? "Not Selected" : "Decision";

  return (
    <div className="my-4 flex items-start">
      {stages.map((s, i) => {
        const done = i <= current;
        const isFinal = i === 3;
        const label = isFinal ? finalLabel : statusConfig[s].label;
        const color =
          done && isFinal && rejected ? "bg-danger" : done ? "bg-primary" : "bg-gray-200";
        return (
          <div key={s} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <div className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : done ? color : "bg-gray-200"}`} />
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-white ${color}`}
              >
                {done ? (
                  isFinal && rejected ? <X size={14} /> : <Check size={14} />
                ) : (
                  <span className="text-xs text-muted">{i + 1}</span>
                )}
              </div>
              <div className={`h-0.5 flex-1 ${i === 3 ? "opacity-0" : i < current ? "bg-primary" : "bg-gray-200"}`} />
            </div>
            <p className="mt-1 text-[11px] text-text">{label}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------- page ------------------------------ */
export default function ApplicationsPage() {
  const [tab, setTab] = useState(null);
  const [selected, setSelected] = useState(null);

  const sorted = [...applications].sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
  const list = sorted.filter((a) => !tab || a.type === tab);
  const count = (type) => (type ? applications.filter((a) => a.type === type).length : applications.length);

  const emptyMessage =
    applications.length === 0
      ? "You haven't applied or registered for anything yet."
      : "Nothing here yet.";

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
          <ClipboardCheck size={30} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-sidebar">My Applications</h1>
          <p className="text-sm text-muted">
            Track the status of your internship applications, mentorship requests and event
            registrations.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-3">
        {tabs.map(({ label, type, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setTab(type)}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
              tab === type ? "bg-primary text-white" : "bg-blue-50 text-text hover:bg-blue-100"
            }`}
          >
            <Icon size={16} />
            {label} ({count(type)})
          </button>
        ))}
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-12 text-center text-sm text-muted shadow-sm">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((a) => {
            const { dateLabel } = typeConfig[a.type];
            const { message } = statusConfig[a.status];
            return (
              <div
                key={`${a.type}-${a.id}`}
                className="flex flex-wrap items-center gap-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <Thumb type={a.type} />

                <div className="min-w-56 flex-1">
                  <h3 className="font-semibold text-sidebar">{a.title}</h3>
                  <p className="text-sm text-muted">{a.subtitle}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 text-sm text-text">
                    <span>
                      {dateLabel}: {fmt(a.appliedAt)}
                    </span>
                    {a.deadline && <span>Deadline: {fmt(a.deadline)}</span>}
                    {a.eventDate && <span>Event Date: {fmt(a.eventDate)}</span>}
                  </p>
                  {a.description && <p className="mt-1 text-sm text-muted">{a.description}</p>}
                </div>

                <div className="w-56 border-l border-gray-200 pl-5">
                  <StatusBadge status={a.status} />
                  <p className="mt-2 text-xs text-muted">{message}</p>
                </div>

                <button
                  onClick={() => setSelected(a)}
                  className="rounded-lg border border-primary px-5 py-2 text-sm font-medium text-primary hover:bg-blue-50"
                >
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Details modal */}
      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          <p className="text-sm text-muted">{selected.subtitle}</p>
          <div className="mt-3">
            <StatusBadge status={selected.status} />
            <p className="mt-2 text-sm text-text">{statusConfig[selected.status].message}</p>
          </div>

          {selected.type === "Internship" && <Stepper status={selected.status} />}

          <div className="mt-3 space-y-1 text-sm text-text">
            <p>
              <span className="text-muted">{typeConfig[selected.type].dateLabel}: </span>
              {fmt(selected.appliedAt)}
            </p>
            {selected.deadline && (
              <p>
                <span className="text-muted">Deadline: </span>
                {fmt(selected.deadline)}
              </p>
            )}
            {selected.eventDate && (
              <p>
                <span className="text-muted">Event Date: </span>
                {fmt(selected.eventDate)}
              </p>
            )}
            {selected.description && <p className="pt-2">{selected.description}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}