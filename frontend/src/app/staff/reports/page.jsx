"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";

const APP_COLUMNS = [
  ["Submitted", "Submitted"],
  ["UnderReview", "Under review"],
  ["Shortlisted", "Shortlisted"],
  ["Accepted", "Accepted"],
  ["Rejected", "Rejected"],
];
const oppTones = { Open: "green", Closed: "gray", Draft: "orange", Cancelled: "red" };

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
  const [mentorship] = useStore("mentorship");
  const [applications] = useStore("applications");
  const [opportunities] = useStore("opportunities");
  const [events] = useStore("events");
  const [verification] = useStore("verificationRequests");
  const [alumni] = useStore("alumniDirectory");

  const now = new Date();
  const activeMentorship = mentorship.filter((m) => m.status === "Pending").length;
  const openOpps = opportunities.filter((o) => o.status === "Open").length;
  const upcoming = events.filter((e) => e.status === "Published" && new Date(e.dateTime) >= now).length;
  const pendingVerification = verification.filter((v) => v.status === "Pending").length;

  const mentorshipRows = ["Pending", "Accepted", "Declined", "Cancelled"].map((s) => [s, mentorship.filter((m) => m.status === s).length]);
  const eventRows = [
    ["Upcoming", events.filter((e) => e.status !== "Cancelled" && e.status !== "Completed" && new Date(e.dateTime) >= now).length],
    ["Completed", events.filter((e) => e.status === "Completed" || (e.status === "Published" && new Date(e.dateTime) < now)).length],
    ["Cancelled", events.filter((e) => e.status === "Cancelled").length],
  ];

  return (
    <div>
      <PageHeader title="Reports" subtitle="A quick view of portal activity." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Tile label="Active mentorship requests" value={activeMentorship} caption="Waiting for an alumni response" href="/staff/reports" />
        <Tile label="Applications received" value={applications.length} caption="Across all postings" href="/staff/opportunities" />
        <Tile label="Open postings" value={openOpps} caption="Accepting applications" href="/staff/opportunities" />
        <Tile label="Upcoming events" value={upcoming} caption="Published" href="/staff/events" />
        <Tile label="Awaiting verification" value={pendingVerification} caption="Alumni applications" href="/staff/verification" />
        <Tile label="Verified alumni" value={alumni.length} caption="In the directory" href="/staff/alumni" />
      </div>

      <Card title="Applications per posting" className="mb-6">
        {opportunities.length === 0 ? (
          <EmptyState message="No postings yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="pb-2 font-medium">Posting</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Total</th>
                  {APP_COLUMNS.map(([, label]) => <th key={label} className="pb-2 font-medium">{label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {opportunities.map((o) => {
                  const apps = applications.filter((a) => a.opportunityId === o.id);
                  return (
                    <tr key={o.id}>
                      <td className="py-3 font-medium text-sidebar">{o.title}</td>
                      <td className="py-3"><Badge tone={oppTones[o.status]}>{o.status}</Badge></td>
                      <td className="py-3 font-semibold text-sidebar">{apps.length}</td>
                      {APP_COLUMNS.map(([key, label]) => (
                        <td key={label} className="py-3 text-text">{apps.filter((a) => a.applicationStatus === key).length}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Mentorship requests by status"><Breakdown rows={mentorshipRows} /></Card>
        <Card title="Events by status"><Breakdown rows={eventRows} /></Card>
      </div>
    </div>
  );
}
