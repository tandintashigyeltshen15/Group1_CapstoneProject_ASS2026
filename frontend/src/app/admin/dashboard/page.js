"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUp, ArrowRight, UserCheck, HandHeart, CalendarDays, Bell, Flag, Briefcase, MapPin, Clock,
} from "lucide-react";
import { useStore, formatDate } from "@/lib/store";
import { Card, Badge, EmptyState } from "@/components/ui";
import { Avatar, Table, nu, statusTone } from "@/components/AdminUI";

function ViewAll({ href }) {
  return (
    <Link href={href} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
      View All <ArrowRight size={14} />
    </Link>
  );
}

function Kpi({ label, value, growth, href }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <p className="text-sm font-medium text-sidebar">{label}</p>
      <p className="mt-1 text-2xl font-bold text-sidebar">{value}</p>
      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-success">
        <ArrowUp size={12} /> {growth}% this month
      </p>
    </Link>
  );
}

/* Line chart drawn with SVG so we do not need a chart library */
function LineChart({ labels, series }) {
  const [hover, setHover] = useState(null);
  const W = 640, H = 240, L = 36, R = 28, T = 12, B = 30;
  const max = Math.ceil(Math.max(...series.flatMap((s) => s.values)) / 20) * 20;
  const x = (i) => L + (i * (W - L - R)) / (labels.length - 1);
  const y = (v) => T + (1 - v / max) * (H - T - B);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));
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
  const [stats] = useStore("adminStats");
  const [analytics] = useStore("adminAnalytics");
  const [contributions] = useStore("adminContributions");
  const [users] = useStore("adminUsers");
  const [opportunities] = useStore("adminOpportunities");
  const [events] = useStore("adminEvents");
  const [notifications] = useStore("adminNotifications");

  const totalContributed = contributions
    .filter((c) => c.status === "Verified")
    .reduce((sum, c) => sum + c.value, 0);
  const internshipsPosted = opportunities.filter((o) => o.type === "Internship").length;

  const pendingAlumni = users.filter((u) => u.role === "Alumni" && u.status === "Pending").length;
  const pendingContributions = contributions.filter((c) => c.status === "Pending").length;
  const pendingOpps = opportunities.filter((o) => o.status === "Pending").length;
  const pendingEvents = events.filter((e) => e.status === "Pending").length;
  const unread = notifications.filter((n) => !n.isRead).length;

  const recent = [...contributions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const upcoming = events
    .filter((e) => e.status === "Approved" && new Date(e.dateTime) >= new Date())
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
    .slice(0, 4);

  return (
    <div>
      <h1 className="text-3xl font-bold text-sidebar">Admin Dashboard</h1>
      <p className="mb-6 text-muted">Welcome back! Here&apos;s what&apos;s happening on the CST Alumni Portal.</p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Total Alumni" value={stats.totalAlumni.toLocaleString("en-US")} growth={stats.growth.alumni} href="/admin/users" />
        <Kpi label="Active Mentors" value={stats.activeMentors} growth={stats.growth.mentors} href="/admin/users" />
        <Kpi label="Total Contributions" value={nu(totalContributed)} growth={stats.growth.contributions} href="/admin/contributions" />
        <Kpi label="Internships Posted" value={internshipsPosted} growth={stats.growth.internships} href="/admin/opportunities" />
        <Kpi label="Events Created" value={events.length} growth={stats.growth.events} href="/admin/events" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card title="Overview Analytics" action={<span className="text-xs text-muted">Last 7 Days</span>}>
            <LineChart labels={analytics.labels} series={analytics.series} />
          </Card>

          <Card title="Recent Contributions" action={<ViewAll href="/admin/contributions" />}>
            {recent.length === 0 ? (
              <EmptyState message="No contributions have been recorded yet." />
            ) : (
              <Table head={["Donor", "Type", "Details", "Date", "Status"]}>
                {recent.map((c) => (
                  <tr key={c.id}>
                    <td className="px-3 py-3">
                      <Link href="/admin/contributions" className="flex items-center gap-3 font-medium text-primary hover:underline">
                        <Avatar name={c.donor} size="h-8 w-8" />
                        {c.donor}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-text">{c.type}</td>
                    <td className="px-3 py-3 text-text">{c.details}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">{formatDate(c.date)}</td>
                    <td className="px-3 py-3"><Badge tone={statusTone[c.status]}>{c.status}</Badge></td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Quick Stats">
            <div className="divide-y divide-gray-100">
              <QuickStat icon={UserCheck} label="Pending Alumni Approvals" value={pendingAlumni} href="/admin/users" />
              <QuickStat icon={HandHeart} label="Pending Contribution Verifications" value={pendingContributions} href="/admin/contributions" />
              <QuickStat icon={Briefcase} label="Pending Opportunity Approvals" value={pendingOpps} href="/admin/opportunities" />
              <QuickStat icon={CalendarDays} label="Pending Event Approvals" value={pendingEvents} href="/admin/events" />
              <QuickStat icon={Bell} label="Unread Notifications" value={unread} href="/admin/notifications" />
              <QuickStat icon={Flag} label="Reported Content" value={stats.reportedContent} href="/admin/reports" />
            </div>
          </Card>

          <Card title="Upcoming Events" action={<ViewAll href="/admin/events" />}>
            {upcoming.length === 0 ? (
              <EmptyState message="No upcoming events." />
            ) : (
              <ul className="divide-y divide-gray-100">
                {upcoming.map((e) => {
                  const d = new Date(e.dateTime);
                  return (
                    <li key={e.id} className="flex items-center gap-4 py-3">
                      <p className="w-14 shrink-0 text-xs font-bold uppercase text-accent">
                        {d.toLocaleDateString("en-GB", { month: "short" })} {d.getDate()}
                      </p>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-sidebar">{e.title}</p>
                        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                          <span className="flex items-center gap-1"><MapPin size={12} /> {e.venue}</span>
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
