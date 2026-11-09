"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  ArrowRight, UserCheck, ShieldCheck, Send, FileText, Bell, MapPin, Clock,
} from "lucide-react";
import { Card, EmptyState } from "@/components/ui";
import { Avatar, Table } from "@/components/AdminUI";

const seriesColor = {
  users: "#2563EB",
  applications: "#7C3AED",
  mentorship: "#F79009",
  registrations: "#12B76A",
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "-";

const emptyData = {
  stats: {
    totalAlumni: 0,
    totalStudents: 0,
    activeMentors: 0,
    openInternships: 0,
    upcomingEvents: 0,
    pendingAlumni: 0,
    pendingStaff: 0,
    pendingMentorship: 0,
    applications: 0,
    unreadNotifications: 0,
  },
  activity: { labels: [], series: [] },
  recentContributions: [],
  upcomingEventList: [],
};

function ViewAll({ href }) {
  return (
    <Link href={href} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
      View All <ArrowRight size={14} />
    </Link>
  );
}

function Kpi({ label, value, href }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <p className="text-sm font-medium text-sidebar">{label}</p>
      <p className="mt-1 text-2xl font-bold text-sidebar">{value}</p>
    </Link>
  );
}

/* Line chart drawn with SVG so we do not need a chart library */
function LineChart({ labels, series }) {
  const [hover, setHover] = useState(null);
  const W = 640, H = 240, L = 36, R = 28, T = 12, B = 30;
  const dataMax = Math.max(...series.flatMap((s) => s.values), 0);
  const max = Math.max(4, Math.ceil(dataMax / 4) * 4); // multiple of 4 so ticks are whole numbers
  const x = (i) => L + (i * (W - L - R)) / (labels.length - 1);
  const y = (v) => T + (1 - v / max) * (H - T - B);
  const ticks = [0, 1, 2, 3, 4].map((t) => (max / 4) * t);
  const step = (W - L - R) / (labels.length - 1);

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-xs font-medium">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5" style={{ color: s.color }}>
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Activity over the last 7 days">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#EAECF0" />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#667085">{t}</text>
          </g>
        ))}

        {labels.map((l, i) => (
          <text key={l} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#667085">{l}</text>
        ))}

        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="#D0D5DD" strokeDasharray="4 4" />
        )}

        {series.map((s) => (
          <g key={s.key}>
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
            />
            {hover !== null && (
              <circle cx={x(hover)} cy={y(s.values[hover])} r="4.5" fill="#fff" stroke={s.color} strokeWidth="2.5" />
            )}
          </g>
        ))}

        {labels.map((l, i) => (
          <rect
            key={l}
            x={x(i) - step / 2}
            y={T}
            width={step}
            height={H - T - B}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>

      <p className="h-5 text-xs text-muted">
        {hover !== null && `${labels[hover]}: ${series.map((s) => `${s.label} ${s.values[hover]}`).join(", ")}`}
      </p>
    </div>
  );
}

function QuickStat({ icon: Icon, label, value, href }) {
  return (
    <Link href={href} className="flex items-center gap-3 py-3 text-sm hover:bg-gray-50">
      <Icon size={16} className="text-muted" />
      <span className="flex-1 text-sidebar">{label}</span>
      <span className="font-bold text-sidebar">{value}</span>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(emptyData);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/admin/dashboard")
      .then((d) => {
        setData(d);
        setLoaded(true);
      })
      .catch((err) => {
        setError(err.message);
        setLoaded(true);
      });
  }, []);

  const { stats, activity, recentContributions, upcomingEventList } = data;
  const series = activity.series.map((s) => ({ ...s, color: seriesColor[s.key] }));

  return (
    <div>
      <h1 className="text-3xl font-bold text-sidebar">Admin Dashboard</h1>
      <p className="mb-6 text-muted">Welcome back! Here&apos;s what&apos;s happening on the CST Alumni Portal.</p>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Total Alumni" value={stats.totalAlumni} href="/admin/users" />
        <Kpi label="Total Students" value={stats.totalStudents} href="/admin/users" />
        <Kpi label="Active Mentors" value={stats.activeMentors} href="/admin/users" />
        <Kpi label="Open Internships" value={stats.openInternships} href="/admin/opportunities" />
        <Kpi label="Upcoming Events" value={stats.upcomingEvents} href="/admin/events" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card title="Overview Analytics" action={<span className="text-xs text-muted">Last 7 Days</span>}>
            {activity.labels.length > 1 ? (
              <LineChart labels={activity.labels} series={series} />
            ) : (
              <EmptyState message={loaded ? "No activity data." : "Loading..."} />
            )}
          </Card>

          <Card title="Recent Alumni Contributions" action={<ViewAll href="/admin/contributions" />}>
            {recentContributions.length === 0 ? (
              <EmptyState message="No contributions have been recorded yet." />
            ) : (
              <Table head={["Alumnus", "Type", "Details", "Date"]}>
                {recentContributions.map((c) => (
                  <tr key={c.id}>
                    <td className="px-3 py-3">
                      <Link href="/admin/contributions" className="flex items-center gap-3 font-medium text-primary hover:underline">
                        <Avatar name={c.donor} size="h-8 w-8" />
                        {c.donor}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-text">{c.type}</td>
                    <td className="px-3 py-3 text-text">{c.details}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">{fmtDate(c.date)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Quick Stats">
            <div className="divide-y divide-gray-100">
              <QuickStat icon={UserCheck} label="Pending Alumni Approvals" value={stats.pendingAlumni} href="/admin/users" />
              <QuickStat icon={ShieldCheck} label="Pending Staff Approvals" value={stats.pendingStaff} href="/admin/staff-verification" />
              <QuickStat icon={Send} label="Pending Mentorship Requests" value={stats.pendingMentorship} href="/admin/reports" />
              <QuickStat icon={FileText} label="Applications Received" value={stats.applications} href="/admin/opportunities" />
              <QuickStat icon={Bell} label="Unread Notifications" value={stats.unreadNotifications} href="/admin/notifications" />
            </div>
          </Card>

          <Card title="Upcoming Events" action={<ViewAll href="/admin/events" />}>
            {upcomingEventList.length === 0 ? (
              <EmptyState message="No upcoming events." />
            ) : (
              <ul className="divide-y divide-gray-100">
                {upcomingEventList.map((e) => {
                  const d = new Date(e.dateTime);
                  return (
                    <li key={e.id} className="flex items-center gap-4 py-3">
                      <p className="w-14 shrink-0 text-xs font-bold uppercase text-accent">
                        {d.toLocaleDateString("en-GB", { month: "short" })} {d.getDate()}
                      </p>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-sidebar">{e.title}</p>
                        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                          {e.venue && (
                            <span className="flex items-center gap-1"><MapPin size={12} /> {e.venue}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" })}
                          </span>
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}