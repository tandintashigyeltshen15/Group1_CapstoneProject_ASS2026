"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  CalendarDays, Briefcase, ClipboardList, ShieldCheck, ChevronRight, ArrowRight,
  MapPin, Clock, Zap, Plus, Megaphone, GraduationCap,
} from "lucide-react";
import { Card, Badge, EmptyState } from "@/components/ui";

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// Application statuses as stored in the database
const appTones = {
  "Under Review": "orange",
  Shortlisted: "blue",
  Accepted: "green",
  "Not Selected": "red",
};

const emptyData = {
  name: "",
  stats: { pendingVerifications: 0, openOpportunities: 0, newApplications: 0, upcomingEvents: 0 },
  pendingAlumni: [],
  upcomingEventList: [],
  recentApplications: [],
};

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

export default function StaffDashboardPage() {
  const [data, setData] = useState(emptyData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api("/staff/dashboard")
      .then((d) => {
        setData(d);
        setLoaded(true);
      })
      .catch((err) => {
        console.warn(err.message);
        setLoaded(true);
      });
  }, []);

  const { stats, pendingAlumni, upcomingEventList, recentApplications } = data;
  const firstName = data.name ? data.name.split(" ")[0] : "";

  return (
    <div>
      <h1 className="text-3xl font-bold text-sidebar">
        Welcome back{firstName ? `, ${firstName}` : ""}
      </h1>
      <p className="mb-6 text-muted">Here&apos;s what&apos;s happening at CST.</p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ShieldCheck} label="Pending Verifications" value={stats.pendingVerifications} caption="Alumni awaiting review" href="/staff/verification" iconStyle="bg-blue-100 text-primary" />
        <StatCard icon={Briefcase} label="Open Opportunities" value={stats.openOpportunities} caption="Accepting applications" href="/staff/opportunities" iconStyle="bg-purple-100 text-accent" />
        <StatCard icon={ClipboardList} label="New Applications" value={stats.newApplications} caption="Awaiting review" href="/staff/opportunities" iconStyle="bg-orange-100 text-warning" />
        <StatCard icon={CalendarDays} label="Upcoming Events" value={stats.upcomingEvents} caption="Published" href="/staff/events" iconStyle="bg-green-100 text-success" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Alumni Awaiting Verification" icon={ShieldCheck} action={<ViewAll href="/staff/verification" />}>
          {pendingAlumni.length === 0 ? (
            <EmptyState message={loaded ? "No alumni applications are waiting." : "Loading..."} />
          ) : (
            <ul className="divide-y divide-gray-100">
              {pendingAlumni.map((v) => (
                <li key={v.id} className="flex items-center gap-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
                    <GraduationCap size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sidebar">{v.name}</p>
                    <p className="text-xs text-muted">{v.programme}, class of {v.graduationYear}</p>
                  </div>
                  <span className="text-xs text-muted">{fmtDate(v.appliedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Upcoming Events" icon={CalendarDays} action={<ViewAll href="/staff/events" />}>
          {upcomingEventList.length === 0 ? (
            <EmptyState message={loaded ? "No upcoming events. Create one from Events." : "Loading..."} />
          ) : (
            <ul className="divide-y divide-gray-100">
              {upcomingEventList.map((e) => {
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
                      {e.venue && (
                        <p className="flex items-center gap-1 text-xs text-muted"><MapPin size={12} /> {e.venue}</p>
                      )}
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
          {recentApplications.length === 0 ? (
            <EmptyState message={loaded ? "No applications received yet." : "Loading..."} />
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentApplications.map((a) => (
                <li key={a.id} className="flex items-center gap-4 py-3">
                  <div className="flex-1">
                    <p className="font-medium text-sidebar">{a.studentName}</p>
                    <p className="text-xs text-muted">{a.opportunity}</p>
                  </div>
                  <div className="text-right">
                    <Badge tone={appTones[a.status] || "gray"}>{a.status}</Badge>
                    <p className="mt-1 text-xs text-muted">{fmtDate(a.date)}</p>
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