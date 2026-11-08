"use client";

import Link from "next/link";
import {
  CalendarDays, Briefcase, ClipboardList, ShieldCheck, ChevronRight, ArrowRight,
  MapPin, Clock, Zap, Plus, Megaphone, GraduationCap,
} from "lucide-react";
import { useStore, formatDate } from "@/lib/store";
import { Card, Badge, EmptyState } from "@/components/ui";

function ViewAll({ href }) {
  return (
    <Link href={href} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
      View All <ArrowRight size={14} />
    </Link>
  );
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

const appTones = { Submitted: "blue", UnderReview: "orange", Shortlisted: "blue", Accepted: "green", Rejected: "red", Withdrawn: "gray" };
const appLabel = (s) => (s === "UnderReview" ? "Under review" : s);

export default function StaffDashboardPage() {
  const [profile] = useStore("staffProfile");
  const [events] = useStore("events");
  const [opportunities] = useStore("opportunities");
  const [applications] = useStore("applications");
  const [verification] = useStore("verificationRequests");

  const now = new Date();
  const upcoming = events
    .filter((e) => e.status === "Published" && new Date(e.dateTime) >= now)
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  const openOpps = opportunities.filter((o) => o.status === "Open");
  const toReview = applications.filter((a) => a.applicationStatus === "Submitted").length;
  const pending = verification
    .filter((v) => v.status === "Pending")
    .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
  const recentApps = [...applications]
    .sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate))
    .slice(0, 4);
  const oppTitle = (id) => opportunities.find((o) => o.id === id)?.title ?? "Removed posting";

  return (
    <div>
      <h1 className="text-3xl font-bold text-sidebar">Welcome back, {profile.name.split(" ")[0]}</h1>
      <p className="mb-6 text-muted">Here&apos;s what&apos;s happening at CST.</p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ShieldCheck} label="Pending Verifications" value={pending.length} caption="Alumni awaiting review" href="/staff/verification" iconStyle="bg-blue-100 text-primary" />
        <StatCard icon={Briefcase} label="Open Opportunities" value={openOpps.length} caption="Accepting applications" href="/staff/opportunities" iconStyle="bg-purple-100 text-accent" />
        <StatCard icon={ClipboardList} label="New Applications" value={toReview} caption="Awaiting review" href="/staff/opportunities" iconStyle="bg-orange-100 text-warning" />
        <StatCard icon={CalendarDays} label="Upcoming Events" value={upcoming.length} caption="Published" href="/staff/events" iconStyle="bg-green-100 text-success" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Alumni Awaiting Verification" icon={ShieldCheck} action={<ViewAll href="/staff/verification" />}>
          {pending.length === 0 ? (
            <EmptyState message="No alumni applications are waiting." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {pending.slice(0, 3).map((v) => (
                <li key={v.id} className="flex items-center gap-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
                    <GraduationCap size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sidebar">{v.name}</p>
                    <p className="text-xs text-muted">{v.programme}, class of {v.graduationYear}</p>
                  </div>
                  <span className="text-xs text-muted">{formatDate(v.submittedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Upcoming Events" icon={CalendarDays} action={<ViewAll href="/staff/events" />}>
          {upcoming.length === 0 ? (
            <EmptyState message="No upcoming events. Create one from Events." />
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
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Recent Applications" icon={ClipboardList} action={<ViewAll href="/staff/opportunities" />}>
          {recentApps.length === 0 ? (
            <EmptyState message="No applications received yet." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentApps.map((a) => (
                <li key={a.id} className="flex items-center gap-4 py-3">
                  <div className="flex-1">
                    <p className="font-medium text-sidebar">{a.studentName}</p>
                    <p className="text-xs text-muted">{oppTitle(a.opportunityId)}</p>
                  </div>
                  <div className="text-right">
                    <Badge tone={appTones[a.applicationStatus]}>{appLabel(a.applicationStatus)}</Badge>
                    <p className="mt-1 text-xs text-muted">{formatDate(a.submissionDate)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Quick Actions" icon={Zap}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <QuickAction icon={ShieldCheck} label="Verify Alumni" href="/staff/verification" />
            <QuickAction icon={Plus} label="Post Opportunity" href="/staff/opportunities" />
            <QuickAction icon={Plus} label="Create Event" href="/staff/events" />
            <QuickAction icon={Megaphone} label="Post Announcement" href="/staff/announcements" />
          </div>
        </Card>
      </div>
    </div>
  );
}