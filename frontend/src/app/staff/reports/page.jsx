"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";

const APP_COLUMNS = ["Under Review", "Shortlisted", "Accepted", "Not Selected"];
const MENTORSHIP_STATUSES = ["Pending", "Accepted", "Declined"];
const oppTones = { Open: "green", Filled: "gray" };

const emptyReport = {
  stats: {
    activeMentorship: 0,
    applications: 0,
    openPostings: 0,
    upcomingEvents: 0,
    pendingVerification: 0,
    verifiedAlumni: 0,
  },
  postings: [],
  mentorshipByStatus: [],
  eventsByStatus: [],
};

function Tile({ label, value, caption, href }) {
  return (
    <Link href={href} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold text-sidebar">{value}</p>
      <p className="text-xs text-muted">{caption}</p>
    </Link>
  );
}

function Breakdown({ rows }) {
  const total = rows.reduce((sum, [, n]) => sum + n, 0);
  return (
    <ul className="space-y-3">
      {rows.map(([label, n]) => (
        <li key={label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-sidebar">{label}</span>
            <span className="font-medium text-sidebar">{n}</span>
          </div>
          <div className="h-2 rounded bg-gray-100">
            <div className="h-2 rounded bg-primary" style={{ width: `${total ? Math.round((n / total) * 100) : 0}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function StaffReportsPage() {
  const [report, setReport] = useState(emptyReport);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/staff/reports")
      .then((d) => {
        setReport(d);
        setLoaded(true);
      })
      .catch((err) => {
        setError(err.message);
        setLoaded(true);
      });
  }, []);

  const { stats, postings, mentorshipByStatus, eventsByStatus } = report;

  // Always show the usual statuses (even at 0), plus anything else the database holds
  const mentorshipRows = [
    ...MENTORSHIP_STATUSES.map((s) => [s, mentorshipByStatus.find((m) => m.status === s)?.count || 0]),
    ...mentorshipByStatus
      .filter((m) => !MENTORSHIP_STATUSES.includes(m.status))
      .map((m) => [m.status, m.count]),
  ];

  return (
    <div>
      <PageHeader title="Reports" subtitle="A quick view of portal activity." />
      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Tile label="Active mentorship requests" value={stats.activeMentorship} caption="Waiting for an alumni response" href="/staff/reports" />
        <Tile label="Applications received" value={stats.applications} caption="Across all postings" href="/staff/opportunities" />
        <Tile label="Open postings" value={stats.openPostings} caption="Accepting applications" href="/staff/opportunities" />
        <Tile label="Upcoming events" value={stats.upcomingEvents} caption="Published" href="/staff/events" />
        <Tile label="Awaiting verification" value={stats.pendingVerification} caption="Alumni applications" href="/staff/verification" />
        <Tile label="Verified alumni" value={stats.verifiedAlumni} caption="In the directory" href="/staff/alumni" />
      </div>

      <Card title="Applications per posting" className="mb-6">
        {postings.length === 0 ? (
          <EmptyState message={loaded ? "No postings yet." : "Loading..."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="pb-2 font-medium">Posting</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Total</th>
                  {APP_COLUMNS.map((label) => <th key={label} className="pb-2 font-medium">{label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {postings.map((o) => (
                  <tr key={o.id}>
                    <td className="py-3 font-medium text-sidebar">{o.title}</td>
                    <td className="py-3"><Badge tone={oppTones[o.status] || "gray"}>{o.status}</Badge></td>
                    <td className="py-3 font-semibold text-sidebar">{o.total}</td>
                    {APP_COLUMNS.map((label) => (
                      <td key={label} className="py-3 text-text">{o.byStatus[label] || 0}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Mentorship requests by status"><Breakdown rows={mentorshipRows} /></Card>
        <Card title="Events by status">
          <Breakdown rows={eventsByStatus.map((e) => [e.status, e.count])} />
        </Card>
      </div>
    </div>
  );
}