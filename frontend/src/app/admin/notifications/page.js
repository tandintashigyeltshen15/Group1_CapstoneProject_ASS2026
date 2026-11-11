"use client";

import { useEffect, useState } from "react";
import { Bell, HandHeart, UserCheck, CalendarDays, Briefcase } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Card, EmptyState, btnOutline } from "@/components/ui";

const fmtDateTime = (d) =>
  new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

// the database keeps the kind of notification as free text, so the icon comes from keywords
const iconFor = (title = "") => {
  const t = title.toLowerCase();
  if (t.includes("contribution")) return HandHeart;
  if (t.includes("application") || t.includes("opportunit") || t.includes("internship")) return Briefcase;
  if (t.includes("event")) return CalendarDays;
  if (t.includes("alumni") || t.includes("verification") || t.includes("account")) return UserCheck;
  return Bell;
};

export default function AdminNotificationsPage() {
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

  // update the screen first, then the server (reload if it fails)
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
        subtitle={unread ? `You have ${unread} unread notification${unread > 1 ? "s" : ""}.` : "You are all caught up."}
        action={
          <button type="button" className={btnOutline} disabled={!unread} onClick={markAll}>
            Mark all as read
          </button>
        }
      />

      <Card>
        {items.length === 0 ? (
          <EmptyState message={loaded ? "No notifications." : "Loading..."} />
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((n) => {
              const Icon = iconFor(n.title);
              return (
                <li key={n.id} className={`flex items-center gap-4 px-2 py-4 ${n.isRead ? "" : "bg-blue-50/50"}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm text-sidebar ${n.isRead ? "" : "font-semibold"}`}>{n.message}</p>
                    <p className="text-xs text-muted">{n.title} • {fmtDateTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => markRead(n.id)}>
                      Mark as read
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}