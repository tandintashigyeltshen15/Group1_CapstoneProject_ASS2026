"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { PageHeader, Card, Badge, EmptyState, Notice, inputCls } from "@/components/ui";
import { Avatar, Tabs, Table, SearchBox, btnSm, btnSmDanger } from "@/components/AdminUI";

const ROLES = ["Student", "Alumni", "Staff", "Administrator"];
const ROLE_LABEL = { Student: "Students", Alumni: "Alumni", Staff: "Staff", Administrator: "Admins" };
const tones = { Active: "green", Pending: "orange", Suspended: "red", Rejected: "red" };

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-";

// the login token holds the id of whoever is signed in
function myUserId() {
  try {
    const t = localStorage.getItem("token");
    const payload = JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.id;
  } catch {
    return null;
  }
}

function UsersContent({ initialQuery }) {
  const [users, setUsers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [meId] = useState(() => (typeof window === "undefined" ? null : myUserId()));
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState(initialQuery);
  const [flash, setFlash] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = () =>
    api("/admin/users")
      .then((d) => {
        setUsers(d);
        setLoaded(true);
      })
      .catch((err) => {
        setFlash({ tone: "red", text: err.message });
        setLoaded(true);
      });

  useEffect(() => {
    load();
  }, []);

  async function setUserStatus(user, next, text) {
    setBusyId(user.id);
    setFlash(null);
    try {
      await api(`/admin/users/${user.id}/status`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      setFlash({ tone: "green", text });
      await load();
    } catch (err) {
      setFlash({ tone: "red", text: err.message });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(user) {
    if (!window.confirm(`Remove ${user.name} from the portal? This cannot be undone.`)) return;
    setBusyId(user.id);
    setFlash(null);
    try {
      await api(`/admin/users/${user.id}`, { method: "DELETE" });
      setFlash({ tone: "green", text: `${user.name} was removed.` });
      await load();
    } catch (err) {
      setFlash({ tone: "red", text: err.message });
    } finally {
      setBusyId(null);
    }
  }

  const q = query.trim().toLowerCase();
  const matches = users.filter(
    (u) =>
      (status === "all" || u.status === status) &&
      (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  );
  const shown = matches.filter((u) => role === "all" || u.role === role);

  return (
    <div>
      <PageHeader title="User Management" subtitle="See who is on the portal and manage their access." />
      {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs
          value={role}
          onChange={setRole}
          tabs={[
            { key: "all", label: "All", count: matches.length },
            ...ROLES.map((r) => ({
              key: r,
              label: ROLE_LABEL[r],
              count: matches.filter((u) => u.role === r).length,
            })),
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
            <option>Rejected</option>
          </select>
        </div>

        <Table
          head={["User", "Role", "Details", "Joined", "Status", "Actions"]}
          empty={shown.length === 0 && <EmptyState message={loaded ? "No users match your filters." : "Loading..."} />}
        >
          {shown.map((u) => {
            const isMe = u.id === meId;
            const busy = busyId === u.id;
            return (
              <tr key={u.id}>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} />
                    <div>
                      <p className="font-medium text-sidebar">
                        {u.name}
                        {isMe && <span className="ml-1 text-xs text-muted">(you)</span>}
                      </p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-text">{u.role}</td>
                <td className="px-3 py-3 text-text">{u.detail}</td>
                <td className="whitespace-nowrap px-3 py-3 text-muted">{fmtDate(u.joined)}</td>
                <td className="px-3 py-3"><Badge tone={tones[u.status] || "gray"}>{u.status}</Badge></td>
                <td className="px-3 py-3">
                  {isMe ? (
                    <span className="text-xs text-muted">-</span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {u.status === "Pending" && u.role === "Staff" && (
                        <Link href="/admin/staff-verification" className={btnSm}>Review</Link>
                      )}
                      {u.status === "Pending" && u.role === "Alumni" && (
                        <span className="text-xs text-muted">Awaiting staff review</span>
                      )}
                      {u.status === "Active" && (
                        <button type="button" disabled={busy} className={btnSm} onClick={() => setUserStatus(u, "Suspended", `${u.name} was suspended and can no longer log in.`)}>
                          Suspend
                        </button>
                      )}
                      {u.status === "Suspended" && (
                        <button type="button" disabled={busy} className={btnSm} onClick={() => setUserStatus(u, "Active", `${u.name} was reactivated.`)}>
                          Reactivate
                        </button>
                      )}
                      {u.role !== "Administrator" && (
                        <button type="button" disabled={busy} className={btnSmDanger} onClick={() => remove(u)}>
                          Remove
                        </button>
                      )}
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