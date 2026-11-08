"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, Card, Badge, EmptyState, Notice, inputCls } from "@/components/ui";
import { useStore, update, formatDate } from "@/lib/store";
import { Avatar, Tabs, Table, SearchBox, statusTone, btnSm, btnSmDanger, btnSmSuccess } from "@/components/AdminUI";

const ROLES = ["Student", "Alumni", "Staff", "Administrator"];

function UsersContent({ initialQuery }) {
  const [users] = useStore("adminUsers");
  const [me] = useStore("adminProfile");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState(initialQuery);
  const [flash, setFlash] = useState(null);

  const change = (user, patch, text) => {
    update("adminUsers", (list) => list.map((u) => (u.id === user.id ? { ...u, ...patch } : u)));
    setFlash({ tone: "green", text });
  };

  const remove = (user) => {
    if (!window.confirm(`Remove ${user.name} from the portal? This cannot be undone.`)) return;
    update("adminUsers", (list) => list.filter((u) => u.id !== user.id));
    setFlash({ tone: "red", text: `${user.name} was removed.` });
  };

  const q = query.trim().toLowerCase();
  const matches = users.filter(
    (u) =>
      (status === "all" || u.status === status) &&
      (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  );
  const shown = matches.filter((u) => role === "all" || u.role === role);

  return (
    <div>
      <PageHeader title="User Management" subtitle="Approve new accounts and manage who can use the portal." />
      {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs
          value={role}
          onChange={setRole}
          tabs={[
            { key: "all", label: "All", count: matches.length },
            ...ROLES.map((r) => ({ key: r, label: r === "Administrator" ? "Admins" : `${r}s`, count: matches.filter((u) => u.role === r).length })),
          ]}
        />
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <SearchBox value={query} onChange={setQuery} placeholder="Search by name or email..." />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputCls} !w-auto`} aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option>Active</option>
            <option>Pending</option>
            <option>Suspended</option>
          </select>
        </div>

        <Table
          head={["User", "Role", "Details", "Joined", "Status", "Actions"]}
          empty={shown.length === 0 && <EmptyState message="No users match your filters." />}
        >
          {shown.map((u) => {
            const isMe = u.email === me.email;
            return (
              <tr key={u.id}>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} />
                    <div>
                      <p className="font-medium text-sidebar">{u.name}{isMe && <span className="ml-1 text-xs text-muted">(you)</span>}</p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-text">{u.role}</td>
                <td className="px-3 py-3 text-text">{u.detail}</td>
                <td className="whitespace-nowrap px-3 py-3 text-muted">{formatDate(u.joined)}</td>
                <td className="px-3 py-3"><Badge tone={statusTone[u.status]}>{u.status}</Badge></td>
                <td className="px-3 py-3">
                  {isMe ? (
                    <span className="text-xs text-muted">-</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {u.status === "Pending" && (
                        <button type="button" className={btnSmSuccess} onClick={() => change(u, { status: "Active" }, `${u.name} was approved.`)}>Approve</button>
                      )}
                      {u.status === "Active" && (
                        <button type="button" className={btnSm} onClick={() => change(u, { status: "Suspended" }, `${u.name} was suspended.`)}>Suspend</button>
                      )}
                      {u.status === "Suspended" && (
                        <button type="button" className={btnSm} onClick={() => change(u, { status: "Active" }, `${u.name} was reactivated.`)}>Reactivate</button>
                      )}
                      <button type="button" className={btnSmDanger} onClick={() => remove(u)}>
                        {u.status === "Pending" ? "Reject" : "Remove"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
}

/* The top search bar sends people here as /admin/users?search=...
   The key makes the page start fresh whenever that search changes. */
function UsersWithSearch() {
  const search = useSearchParams().get("search") ?? "";
  return <UsersContent key={search} initialQuery={search} />;
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={null}>
      <UsersWithSearch />
    </Suspense>
  );
}
