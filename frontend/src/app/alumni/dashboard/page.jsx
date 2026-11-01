"use client";

import Link from "next/link";
import {
  UserRound, CalendarDays, Briefcase, ClipboardList, ChevronRight, ArrowRight,
  MapPin, Clock, Megaphone, Zap, Users, Heart,
} from "lucide-react";
import { useStore, formatDate } from "@/lib/store";

function Panel({ icon: Icon, title, href, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sidebar">
          <Icon size={20} className="text-primary" />
          <h2 className="font-semibold">{title}</h2>
        </div>
        {href && (
          <Link href={href} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            View All <ArrowRight size={14} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }) {
  return <p className="py-8 text-center text-sm text-muted">{message}</p>;
}

function StatCard({ icon: Icon, label, value, caption, href, iconStyle }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${iconStyle}`}>
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

export default function DashboardPage() {
  const [profile] = useStore("profile");
  const [career] = useStore("career");
  const [publications] = useStore("publications");
  const [projects] = useStore("projects");
  const [contributions] = useStore("contributions");
  const [mentorship] = useStore("mentorship");
  const [opportunities] = useStore("opportunities");
  const [applications] = useStore("applications");
  const [events] = useStore("events");
  const [registrations] = useStore("registrations");
  const [notifications] = useStore("notifications");

  // profile completion: 5 info fields + 4 sections
  const checks = [
    profile.name, profile.professionalBackground, profile.areaOfExpertise, profile.phone, profile.programme,
    career.length, publications.length, projects.length, contributions.length,
  ];
  const completion = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  const now = new Date();
  const upcoming = events
    .filter((e) => e.status === "Published" && new Date(e.dateTime) >= now)
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  const pending = mentorship.filter((m) => m.status === "Pending").length;
  const openOpps = opportunities.filter((o) => o.status === "Open");
  const newApplicants = applications.filter((a) => a.applicationStatus === "Submitted").length;
  const unread = notifications.filter((n) => !n.isRead);

  return (
    <div>
      <h1 className="text-3xl font-bold text-sidebar">Welcome back, {profile.name.split(" ")[0]}</h1>
      <p className="mb-6 text-muted">Here&apos;s what&apos;s happening at CST.</p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={UserRound} label="My Profile" value={`${completion}%`} caption="Profile Completed" href="/alumni/profile" iconStyle="bg-blue-100 text-primary" />
        <StatCard icon={Users} label="Mentorship Requests" value={pending} caption="Waiting for your reply" href="/alumni/mentorship" iconStyle="bg-purple-100 text-accent" />
        <StatCard icon={CalendarDays} label="Upcoming Events" value={upcoming.length} caption={`${registrations.length} registered`} href="/alumni/events" iconStyle="bg-green-100 text-success" />
        <StatCard icon={ClipboardList} label="New Applications" value={newApplicants} caption="To review" href="/alumni/applications" iconStyle="bg-orange-100 text-warning" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel icon={CalendarDays} title="Upcoming Events" href="/alumni/events">
          {upcoming.length === 0 ? (
            <EmptyState message="No upcoming events yet." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {upcoming.slice(0, 3).map((e) => {
                const d = new Date(e.dateTime);
                return (
                  <li key={e.id} className="flex items-center gap-4 py-3">
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-gray-50">
                      <span className="text-lg font-bold text-sidebar">{d.getDate()}</span>
                      <span className="text-[10px] font-medium uppercase text-muted">
                        {d.toLocaleDateString("en-GB", { month: "short" })}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sidebar">{e.title}</p>
                      <p className="flex items-center gap-1 text-xs text-muted"><MapPin size={12} /> {e.venue}</p>
                      <p className="flex items-center gap-1 text-xs text-muted">
                        <Clock size={12} /> {d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                    {registrations.some((r) => r.eventId === e.id) && (
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-success">Registered</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel icon={Briefcase} title="My Internship Postings" href="/alumni/internships">
          {openOpps.length === 0 ? (
            <EmptyState message="No open internships. Post one from Internship Postings." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {openOpps.slice(0, 3).map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
                    <Briefcase size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sidebar">{i.title}</p>
                    <p className="text-xs text-muted">{i.organization}</p>
                    <span className="mt-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-[11px] text-text">{i.duration}</span>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-warning">Apply by</p>
                    <p className="font-semibold text-danger">{formatDate(i.deadline)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel icon={Megaphone} title="Recent Notifications" href="/alumni/notifications">
          {unread.length === 0 ? (
            <EmptyState message="You're all caught up." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {unread.slice(0, 4).map((n) => (
                <li key={n.id} className="flex items-start gap-3 py-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <p className="flex-1 text-sm text-sidebar">{n.message}</p>
                  <span className="text-xs text-muted">{formatDate(n.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel icon={Zap} title="Quick Actions">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <QuickAction icon={UserRound} label="Update Profile" href="/alumni/profile" />
            <QuickAction icon={Heart} label="Add Contribution" href="/alumni/contributions" />
            <QuickAction icon={Briefcase} label="Post Internship" href="/alumni/internships" />
            <QuickAction icon={Users} label="Review Mentorship" href="/alumni/mentorship" />
            <QuickAction icon={CalendarDays} label="Register for Events" href="/alumni/events" />
          </div>
        </Panel>
      </div>
    </div>
  );
}

