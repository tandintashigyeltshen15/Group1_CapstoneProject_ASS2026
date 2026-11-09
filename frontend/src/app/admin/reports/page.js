"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { Table } from "@/components/AdminUI";

function Tile({ label, value, caption, href }) {
  return (
    <Link href={href} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold text-sidebar">{value}</p>
      <p className="text-xs text-muted">{caption}</p>
    </Link>
  );
}

/* rows: [label, number] */
function Breakdown({ rows, color = "bg-primary" }) {
  const total = rows.reduce((sum, [, n]) => sum + n, 0);
  if (total === 0) return <EmptyState message="Nothing to show yet." />;
  return (
    <ul className="space-y-3">
      {rows.map(([label, n]) => (
        <li key={label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-sidebar">{label}</span>
            <span className="font-medium text-sidebar">{n}</span>
          </div>
          <div className="h-2 rounded bg-gray-100">
            <div className={`h-2 rounded ${color}`} style={{ width: `${Math.round((n / total) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const sum = (list) => list.reduce((s, r) => s + r.count, 0);

// Adds up counts that share a label, e.g. two opportunity types with the same status
const groupBy = (list, key) => {
  const totals = {};
  for (const r of list) totals[r[key]] = (totals[r[key]] || 0) + r.count;
  return Object.entries(totals);
};

const emptyReport = {
  usersByRole: [],
  contributionsByType: [],
  opportunitiesByStatus: [],
  eventsByStatus: [],
  activeMentorshipRequests: 0,
  mentorshipByStatus: [],
  applicationsByStatus: [],
  applicationsByOpportunity: [],
};

export default function AdminReportsPage() {
  const [report, setReport] = useState(emptyReport);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/admin/reports")
      .then((d) => {
        setReport(d);
        setLoaded(true);
      })
      .catch((err) => {
        setError(err.message);
        setLoaded(true);
      });
  }, []);

  const openInternships = report.opportunitiesByStatus
    .filter((o) => o.type === "Internship" && o.status === "Open")
    .reduce((s, o) => s + o.count, 0);
  const publishedEvents =
    report.eventsByStatus.find((e) => e.status === "Published")?.count || 0;

  return (
    <div>
      <PageHeader title="Reports" subtitle="A quick view of portal activity." />

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Tile
          label="Registered users"
          value={sum(report.usersByRole.map((r) => ({ count: r.count })))}
          caption="Accounts in the portal"
          href="/admin/users"
        />
        <Tile
          label="Active mentorship requests"
          value={report.activeMentorshipRequests}
          caption="Waiting for an alumnus to answer"
          href="/admin/reports"
        />
        <Tile
          label="Applications received"
          value={sum(report.applicationsByStatus)}
          caption="Across all postings"
          href="/admin/opportunities"
        />
        <Tile
          label="Open internships"
          value={openInternships}
          caption="Accepting applications"
          href="/admin/opportunities"
        />
        <Tile
          label="Published events"
          value={publishedEvents}
          caption="Visible to students and alumni"
          href="/admin/events"
        />
        <Tile
          label="Alumni contributions"
          value={sum(report.contributionsByType)}
          caption="Records added by alumni"
          href="/admin/contributions"
        />
      </div>

      <div className="mb-6">
        <Card title="Applications received per posting">
          {report.applicationsByOpportunity.length === 0 ? (
            <EmptyState message={loaded ? "No opportunities posted yet." : "Loading..."} />
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table head={["Posting", "Organisation", "Type", "Status", "Applications"]}>
                {report.applicationsByOpportunity.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-3 font-medium text-sidebar">{p.title}</td>
                    <td className="px-3 py-3 text-text">{p.organization}</td>
                    <td className="px-3 py-3 text-text">{p.type}</td>
                    <td className="px-3 py-3 text-text">{p.status}</td>
                    <td className="px-3 py-3 font-bold text-sidebar">{p.applications}</td>
                  </tr>
                ))}
              </Table>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Users by role">
          <Breakdown rows={report.usersByRole.map((r) => [r.role, r.count])} />
        </Card>
        <Card title="Mentorship requests by status">
          <Breakdown
            rows={report.mentorshipByStatus.map((m) => [m.status, m.count])}
            color="bg-accent"
          />
        </Card>
        <Card title="Applications by status">
          <Breakdown
            rows={report.applicationsByStatus.map((a) => [a.status, a.count])}
            color="bg-success"
          />
        </Card>
        <Card title="Opportunities by status">
          <Breakdown rows={groupBy(report.opportunitiesByStatus, "status")} color="bg-warning" />
        </Card>
        <Card title="Events by status">
          <Breakdown rows={report.eventsByStatus.map((e) => [e.status, e.count])} />
        </Card>
        <Card title="Alumni contributions by type">
          <Breakdown
            rows={report.contributionsByType.map((c) => [c.type, c.count])}
            color="bg-success"
          />
        </Card>
      </div>
    </div>
  );
}