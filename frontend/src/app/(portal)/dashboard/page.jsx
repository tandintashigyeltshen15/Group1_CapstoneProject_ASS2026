import Link from "next/link";
import {
  UserRound,
  CalendarDays,
  Briefcase,
  ClipboardList,
  ChevronRight,
  ArrowRight,
  MapPin,
  Clock,
  Megaphone,
  Zap,
  Users,
} from "lucide-react";

/* ------------------------------------------------------------------
   DATA (temporary)
   For now everything is empty / 0. Later, replace these with data
   fetched from the backend. The page below will update by itself.

   events:        { id, title, date: "2026-09-25", time: "10:00 AM", location: "CST Campus" }
   internships:   { id, title, company, tags: ["Internship", "Remote"], deadline: "2026-09-30" }
   applications:  { id, ... }
   announcements: { id, title, description, date: "2026-09-10" }
------------------------------------------------------------------- */
const profileCompletion = 0; // 0-100, becomes 100 when the profile is fully filled
const events = [
  { id: 1, title: "Career Fair 2026", date: "2026-10-03", time: "9:00 AM", location: "CST Campus" },
];
const internships = [];
const applications = [];
const announcements = [];

/* ----------------------------- helpers ----------------------------- */
const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function Panel({ icon: Icon, title, href, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sidebar">
          <Icon size={20} className="text-primary" />
          <h2 className="font-semibold">{title}</h2>
        </div>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View All <ArrowRight size={14} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <p className="py-8 text-center text-sm text-muted">{message}</p>
  );
}

function StatCard({ icon: Icon, label, value, caption, href, iconStyle }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${iconStyle}`}
      >
        <Icon size={26} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-sidebar">{label}</p>
        <p className="text-2xl font-bold text-sidebar">{value}</p>
        <p className="text-xs text-muted">{caption}</p>
      </div>
      <ChevronRight size={18} className="text-muted" />
    </Link>
  );
}

function QuickAction({ icon: Icon, label, href }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-blue-50/50 px-4 py-3 text-sm font-medium text-sidebar transition-colors hover:bg-blue-50"
    >
      <Icon size={20} className="text-primary" />
      <span className="flex-1">{label}</span>
      <ChevronRight size={16} className="text-muted" />
    </Link>
  );
}

/* ------------------------------- page ------------------------------ */
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-sidebar">Welcome back,</h1>
      <p className="mb-6 text-muted">Here&apos;s what&apos;s happening at CST.</p>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={UserRound}
          label="My Profile"
          value={`${profileCompletion}%`}
          caption="Profile Completed"
          href="/profile"
          iconStyle="bg-blue-100 text-primary"
        />
        <StatCard
          icon={CalendarDays}
          label="Upcoming Events"
          value={events.length}
          caption="This Month"
          href="/events"
          iconStyle="bg-green-100 text-success"
        />
        <StatCard
          icon={Briefcase}
          label="Available Internships"
          value={internships.length}
          caption="New Opportunities"
          href="/internships"
          iconStyle="bg-purple-100 text-accent"
        />
        <StatCard
          icon={ClipboardList}
          label="My Applications"
          value={applications.length}
          caption="In Progress"
          href="/applications"
          iconStyle="bg-orange-100 text-warning"
        />
      </div>

      {/* Events + Opportunities */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel icon={CalendarDays} title="Upcoming Events" href="/events">
          {events.length === 0 ? (
            <EmptyState message="No upcoming events yet." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {events.map((e) => {
                const d = new Date(e.date);
                return (
                  <li key={e.id} className="flex items-center gap-4 py-3">
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-gray-50">
                      <span className="text-lg font-bold text-sidebar">
                        {d.getDate()}
                      </span>
                      <span className="text-[10px] font-medium uppercase text-muted">
                        {d.toLocaleDateString("en-GB", { month: "short" })}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sidebar">{e.title}</p>
                      <p className="flex items-center gap-1 text-xs text-muted">
                        <MapPin size={12} /> {e.location}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted">
                        <Clock size={12} /> {e.time}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel icon={Briefcase} title="Latest Opportunities" href="/internships">
          {internships.length === 0 ? (
            <EmptyState message="No internships posted yet." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {internships.map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
                    <Briefcase size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sidebar">{i.title}</p>
                    <p className="text-xs text-muted">{i.company}</p>
                    <div className="mt-1 flex gap-2">
                      {i.tags?.map((t) => (
                        <span
                          key={t}
                          className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-text"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-warning">Apply by</p>
                    <p className="font-semibold text-danger">
                      {formatDate(i.deadline)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Announcements + Quick actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel icon={Megaphone} title="Recent Announcements" href="/notifications">
          {announcements.length === 0 ? (
            <EmptyState message="No announcements yet." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {announcements.map((a) => (
                <li key={a.id} className="flex items-start gap-3 py-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-sidebar">{a.title}</p>
                    <p className="text-xs text-muted">{a.description}</p>
                  </div>
                  <span className="text-xs text-muted">{formatDate(a.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel icon={Zap} title="Quick Actions">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <QuickAction icon={UserRound} label="Update Profile" href="/profile" />
            <QuickAction
              icon={Briefcase}
              label="Browse Internships"
              href="/internships"
            />
            <QuickAction
              icon={Users}
              label="Request Mentorship"
              href="/mentorship"
            />
            <QuickAction icon={CalendarDays} label="View Events" href="/events" />
          </div>
        </Panel>
      </div>
    </div>
  );
}