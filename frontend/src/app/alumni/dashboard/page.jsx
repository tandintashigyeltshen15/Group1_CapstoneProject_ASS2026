"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  UserRound, Users, CalendarDays, ClipboardList, Briefcase, ChevronRight, ArrowRight,
  MapPin, Clock, Zap, Plus, HandHeart,
} from "lucide-react";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

const emptyData = {
  name: "",
  stats: { profileCompletion: 0, pendingMentorship: 0, upcomingEvents: 0, registeredUpcoming: 0, newApplications: 0 },
  upcomingEventList: [],
  postings: [],
  requests: [],
};

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

const Empty = ({ message }) => <p className="py-8 text-center text-sm text-muted">{message}</p>;

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

export default function AlumniDashboardPage() {
  const [data, setData] = useState(emptyData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api("/alumni-dashboard")
      .then((d) => {
        setData(d);
        setLoaded(true);
      })
      .catch((err) => {
        console.warn(err.message);
        setLoaded(true);
      });
  }, []);

  const { stats, upcomingEventList, postings, requests } = data;
  const firstName = data.name ? data.name.split(" ")[0] : "";
  const loading = (text) => (loaded ? text : "Loading...");

  return (
    <div>
      <h1 className="text-3xl font-bold text-sidebar">
        Welcome back{firstName ? `, ${firstName}` : ""}
      </h1>
      <p className="mb-6 text-muted">Here&apos;s what&apos;s happening at CST.</p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={UserRound} label="My Profile" value={`${stats.profileCompletion}%`} caption="Profile Completed" href="/alumni/profile" iconStyle="bg-blue-100 text-primary" />
        <StatCard icon={Users} label="Mentorship Requests" value={stats.pendingMentorship} caption="Waiting for your reply" href="/alumni/mentorship" iconStyle="bg-purple-100 text-accent" />
        <StatCard icon={CalendarDays} label="Upcoming Events" value={stats.upcomingEvents} caption={`${stats.registeredUpcoming} registered`} href="/alumni/events" iconStyle="bg-green-100 text-success" />
        <StatCard icon={ClipboardList} label="New Applications" value={stats.newApplications} caption="To review" href="/alumni/applications" iconStyle="bg-orange-100 text-warning" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel icon={CalendarDays} title="Upcoming Events" href="/alumni/events">
          {upcomingEventList.length === 0 ? (
            <Empty message={loading("No upcoming events.")} />
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
                    {e.registered && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-success">Registered</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel icon={Briefcase} title="My Internship Postings" href="/alumni/internships">
          {postings.length === 0 ? (
            <Empty message={loading("You haven't posted any opportunities yet.")} />
          ) : (
            <ul className="divide-y divide-gray-100">
              {postings.map((o) => (
                <li key={o.id} className="flex items-center gap-4 py-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
                    <Briefcase size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sidebar">{o.title}</p>
                    <p className="text-xs text-muted">{o.organization}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {o.duration && (
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-text">{o.duration}</span>
                      )}
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] text-primary">
                        {o.applications} applicant{o.applications === 1 ? "" : "s"}
                      </span>
                      {o.status !== "Open" && (
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-muted">{o.status}</span>
                      )}
                    </div>
                  </div>
                  {o.deadline && (
                    <div className="text-right text-xs">
                      <p className="text-warning">Apply by</p>
                      <p className="font-semibold text-danger">{fmtDate(o.deadline)}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel icon={Users} title="Mentorship Requests" href="/alumni/mentorship">
          {requests.length === 0 ? (
            <Empty message={loading("No requests are waiting for your reply.")} />
          ) : (
            <ul className="divide-y divide-gray-100">
              {requests.map((r) => (
                <li key={r.id} className="flex items-center gap-4 py-3">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-sidebar">{r.student}</p>
                    <p className="text-xs text-muted">{r.subject}</p>
                  </div>
                  <span className="text-xs text-muted">{fmtDate(r.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel icon={Zap} title="Quick Actions">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <QuickAction icon={Plus} label="Post Opportunity" href="/alumni/internships" />
            <QuickAction icon={UserRound} label="Update Profile" href="/alumni/profile" />
            <QuickAction icon={CalendarDays} label="View Events" href="/alumni/events" />
            <QuickAction icon={HandHeart} label="Contribute" href="/alumni/contributions" />
          </div>
        </Panel>
      </div>
    </div>
  );
}