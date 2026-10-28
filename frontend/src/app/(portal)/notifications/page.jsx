"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  Check,
  Users,
  FileText,
  CalendarDays,
  Megaphone,
  Clock,
  ChevronRight,
  Filter,
} from "lucide-react";

/* ------------------------------------------------------------------
   DATA (temporary): empty for now. Later, fetch from the backend.
   The system creates these automatically (new event, request accepted,
   application status changed, staff announcement...).

   notifications: {
     id,
     type: "MENTORSHIP" | "APPLICATION" | "EVENT" | "ANNOUNCEMENT",
     title, message,
     createdAt: "2026-10-18T10:30:00",
     isRead: false,
     href: "/mentorship"          // optional: where clicking it should go
   }
------------------------------------------------------------------- */
const initialNotifications = [
  { id: 1, type: "MENTORSHIP", title: "Mentorship Request Update",
    message: "Your mentorship request has been accepted by Test Alumni.",
    createdAt: "2026-10-18T18:40:00", isRead: false, href: "/mentorship" },
  { id: 2, type: "EVENT", title: "New Event: Alumni Career Talk",
    message: "Join us on November 20 at the Seminar Hall.",
    createdAt: "2026-10-17T16:15:00", isRead: false, href: "/events" },
  { id: 3, type: "APPLICATION", title: "Application Status Updated",
    message: "Your DrukTech internship application is now under review.",
    createdAt: "2026-10-10T09:20:00", isRead: true, href: "/applications" },
  { id: 4, type: "ANNOUNCEMENT", title: "System Maintenance Notice",
    message: "The portal will be down briefly this weekend.",
    createdAt: "2026-10-07T08:10:00", isRead: true },
];

const typeConfig = {
  MENTORSHIP: {
    label: "Mentorship",
    icon: Users,
    circle: "bg-purple-100 text-accent",
    pill: "bg-purple-50 text-accent",
  },
  APPLICATION: {
    label: "Application",
    icon: FileText,
    circle: "bg-blue-100 text-primary",
    pill: "bg-blue-50 text-primary",
  },
  EVENT: {
    label: "Event",
    icon: CalendarDays,
    circle: "bg-green-100 text-success",
    pill: "bg-green-50 text-success",
  },
  ANNOUNCEMENT: {
    label: "Announcement",
    icon: Megaphone,
    circle: "bg-orange-100 text-warning",
    pill: "bg-orange-50 text-warning",
  },
};

const filters = [
  { label: "All", type: null, icon: Bell },
  { label: "Mentorship", type: "MENTORSHIP", icon: Users },
  { label: "Applications", type: "APPLICATION", icon: FileText },
  { label: "Events", type: "EVENT", icon: CalendarDays },
  { label: "Announcements", type: "ANNOUNCEMENT", icon: Megaphone },
];

const DAY = 86400000;

const formatDateTime = (d) => {
  const date = new Date(d);
  const day = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} • ${time}`;
};

/* ----------------------------- pieces ----------------------------- */
function SummaryCell({ label, value, icon: Icon, tone }) {
  return (
    <div className="flex flex-col items-center gap-1 py-5">
      <Icon size={20} className={tone} />
      <p className="text-2xl font-bold text-sidebar">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function CountBadge({ value, active }) {
  return (
    <span
      className={`min-w-7 rounded-full px-2 py-0.5 text-center text-xs font-medium ${
        active ? "bg-primary text-white" : "bg-gray-100 text-text"
      }`}
    >
      {value}
    </span>
  );
}

/* ------------------------------- page ------------------------------ */
export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [tab, setTab] = useState(null);
  const [search, setSearch] = useState("");

  const countType = (type) =>
    type ? notifications.filter((n) => n.type === type).length : notifications.length;

  const total = notifications.length;
  const unread = notifications.filter((n) => !n.isRead).length;
  const thisWeek = notifications.filter(
    (n) => Date.now() - new Date(n.createdAt).getTime() <= 7 * DAY
  ).length;

  const list = [...notifications]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter(
      (n) =>
        (!tab || n.type === tab) &&
        `${n.title} ${n.message}`.toLowerCase().includes(search.toLowerCase())
    );

  const markRead = (id) => {
    // TODO (backend phase): PATCH /api/notifications/:id/read
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = () => {
    // TODO (backend phase): PATCH /api/notifications/read-all
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const open = (n) => {
    markRead(n.id);
    if (n.href) router.push(n.href);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
          <Bell size={34} />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-sidebar">Notifications</h1>
          <p className="text-muted">
            Stay updated with the latest activities, opportunities, and announcements from CST.
          </p>
        </div>
        <button
          onClick={markAllRead}
          disabled={unread === 0}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-primary hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-white"
        >
          <Check size={16} /> Mark all as read
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]">
        {/* Left: tabs + list */}
        <div>
          <div className="mb-4 flex flex-wrap gap-3">
            {filters.map(({ label, type, icon: Icon }) => (
              <button
                key={label}
                onClick={() => setTab(type)}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                  tab === type ? "bg-primary text-white" : "bg-blue-50 text-text hover:bg-blue-100"
                }`}
              >
                <Icon size={16} /> {label} ({countType(type)})
              </button>
            ))}
          </div>

          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-text outline-none focus:border-primary"
            />
          </div>

          {list.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white py-14 text-center text-sm text-muted shadow-sm">
              {notifications.length === 0
                ? "You're all caught up. No notifications yet."
                : "No notifications match your filters."}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {list.map((n) => {
                const { icon: Icon, circle, pill, label } = typeConfig[n.type];
                return (
                  <button
                    key={n.id}
                    onClick={() => open(n)}
                    className={`flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-gray-50 ${
                      n.isRead ? "" : "bg-blue-50/40"
                    }`}
                  >
                    <span
                      className={`mt-6 h-2 w-2 shrink-0 rounded-full ${
                        n.isRead ? "bg-transparent" : "bg-primary"
                      }`}
                    />
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${circle}`}
                    >
                      <Icon size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3
                          className={`text-sidebar ${n.isRead ? "font-medium" : "font-semibold"}`}
                        >
                          {n.title}
                        </h3>
                        <span className={`shrink-0 rounded-full px-3 py-0.5 text-xs font-medium ${pill}`}>
                          {label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted">{n.message}</p>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                        <Clock size={12} /> {formatDateTime(n.createdAt)}
                      </p>
                    </div>
                    <ChevronRight size={18} className="mt-6 shrink-0 text-muted" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: summary + quick filters */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <h2 className="border-b border-gray-100 px-5 py-4 font-semibold text-sidebar">
              Notification Summary
            </h2>
            <div className="grid grid-cols-2 divide-x divide-y divide-gray-100">
              <SummaryCell label="Total Notifications" value={total} icon={Bell} tone="text-primary" />
              <SummaryCell label="Unread" value={unread} icon={Bell} tone="text-danger" />
              <SummaryCell label="This Week" value={thisWeek} icon={CalendarDays} tone="text-success" />
              <SummaryCell label="Read" value={total - unread} icon={Check} tone="text-muted" />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 px-1 font-semibold text-sidebar">
              <Filter size={16} className="text-primary" /> Quick Filters
            </h2>
            <div className="space-y-1">
              {filters.map(({ label, type, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => setTab(type)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    tab === type ? "bg-blue-50 text-primary" : "text-text hover:bg-gray-50"
                  }`}
                >
                  <Icon size={16} />
                  <span className="flex-1 text-left">
                    {label === "All" ? "All Notifications" : label}
                  </span>
                  <CountBadge value={countType(type)} active={tab === type} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex h-40 flex-col items-center justify-center rounded-xl bg-linear-to-br from-sidebar to-primary p-6 text-center text-white">
            <p className="text-lg italic">&ldquo;Stay connected. Grow together.&rdquo;</p>
            <p className="mt-1 text-xs text-white/80">– CST Alumni Community</p>
          </div>
        </div>
      </div>
    </div>
  );
}