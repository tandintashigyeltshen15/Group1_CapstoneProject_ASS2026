"use client";

import Link from "next/link";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { useStore } from "@/lib/store";
import { nu } from "@/components/AdminUI";

function Tile({ label, value, caption, href }) {
  return (
    <Link href={href} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold text-sidebar">{value}</p>
      <p className="text-xs text-muted">{caption}</p>
    </Link>
  );
}

/* rows: [label, number]; format turns the number into text */
function Breakdown({ rows, format = (n) => n, color = "bg-primary" }) {
  const total = rows.reduce((sum, [, n]) => sum + n, 0);
  if (total === 0) return <EmptyState message="Nothing to show yet." />;
  return (
    <ul className="space-y-3">
      {rows.map(([label, n]) => (
        <li key={label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-sidebar">{label}</span>
            <span className="font-medium text-sidebar">{format(n)}</span>
          </div>
          <div className="h-2 rounded bg-gray-100">
            <div className={`h-2 rounded ${color}`} style={{ width: `${Math.round((n / total) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AdminReportsPage() {
  const [users] = useStore("adminUsers");
  const [contributions] = useStore("adminContributions");
  const [opportunities] = useStore("adminOpportunities");
  const [events] = useStore("adminEvents");
  const [stats] = useStore("adminStats");

  const verified = contributions.filter((c) => c.status === "Verified");
  const verifiedValue = verified.reduce((s, c) => s + c.value, 0);
  const pendingTotal =
    users.filter((u) => u.status === "Pending").length +
    contributions.filter((c) => c.status === "Pending").length +
    opportunities.filter((o) => o.status === "Pending").length +
    events.filter((e) => e.status === "Pending").length;
  const upcoming = events.filter((e) => e.status === "Approved" && new Date(e.dateTime) >= new Date()).length;

  const types = ["Financial Support", "Equipment & Resources", "Scholarship", "Infrastructure", "Other"];

  return (
    <div>
      <PageHeader title="Reports" subtitle="A quick view of portal activity." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Tile label="Registered users" value={users.length} caption="Accounts in the portal" href="/admin/users" />
        <Tile label="Verified contributions" value={nu(verifiedValue)} caption={`${verified.length} verified contributions`} href="/admin/contributions" />
        <Tile label="Open opportunities" value={opportunities.filter((o) => o.status === "Approved").length} caption="Approved jobs and internships" href="/admin/opportunities" />
        <Tile label="Upcoming events" value={upcoming} caption="Approved and still to happen" href="/admin/events" />
        <Tile label="Waiting for approval" value={pendingTotal} caption="Users, contributions, postings and events" href="/admin/dashboard" />
        <Tile label="Reported content" value={stats.reportedContent} caption="Flagged by portal users" href="/admin/notifications" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Verified contributions by type">
          <Breakdown
            rows={types.map((t) => [t, verified.filter((c) => c.type === t).reduce((s, c) => s + c.value, 0)])}
            format={nu}
            color="bg-success"
          />
        </Card>
        <Card title="Users by role">
          <Breakdown rows={["Student", "Alumni", "Staff", "Administrator"].map((r) => [r, users.filter((u) => u.role === r).length])} />
        </Card>
        <Card title="Opportunities by status">
          <Breakdown rows={["Approved", "Pending", "Rejected", "Closed"].map((s) => [s, opportunities.filter((o) => o.status === s).length])} color="bg-accent" />
        </Card>
        <Card title="Events by status">
          <Breakdown rows={["Approved", "Pending", "Rejected", "Cancelled"].map((s) => [s, events.filter((e) => e.status === s).length])} color="bg-warning" />
        </Card>
      </div>
    </div>
  );
}
