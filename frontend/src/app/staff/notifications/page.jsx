"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Bell, CheckCheck } from "lucide-react";
import { PageHeader, Card, Badge, EmptyState, btnOutline } from "@/components/ui";

const fmtDateTime = (d) =>
  new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function StaffNotificationsPage() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const load = () =>
    api("/notifications")
      .then((d) => {
        setItems(d);
        setLoaded(true);
      })
      .catch((err) => {
        console.warn(err.message);
        setLoaded(true);
      });

  useEffect(() => {
    load();
  }, []);

  const unread = items.filter((n) => !n.isRead).length;

  // Update the screen first, then the server (reload if it fails)
  const markRead = (id) => {
    setItems((l) => l.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    api(`/notifications/${id}/read`, { method: "PATCH" }).catch(load);
  };
  const markAll = () => {
    setItems((l) => l.map((n) => ({ ...n, isRead: true })));
    api("/notifications/read-all", { method: "PATCH" }).catch(load);
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unread ? `${unread} unread` : "You're all caught up."}
        action={
          <button onClick={markAll} disabled={!unread} className={btnOutline + " disabled:opacity-50"}>
            <CheckCheck size={16} /> Mark all as read
          </button>
        }
      />
      <Card>
        {items.length === 0 ? (
          <EmptyState message={loaded ? "No notifications yet." : "Loading..."} />
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((n) => (
              <li key={n.id} className={`flex items-start gap-3 py-3 ${n.isRead ? "" : "bg-blue-50/40"}`}>
                <Bell size={18} className={`mt-0.5 shrink-0 ${n.isRead ? "text-muted" : "text-primary"}`} />
                <div className="flex-1">
                  <p className={`text-sm ${n.isRead ? "text-text" : "font-medium text-sidebar"}`}>{n.message}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                    <Badge>{n.title}</Badge> {fmtDateTime(n.createdAt)}
                  </p>
                </div>
                {!n.isRead && (
                  <button onClick={() => markRead(n.id)} className="text-xs font-medium text-primary hover:underline">
                    Mark as read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}