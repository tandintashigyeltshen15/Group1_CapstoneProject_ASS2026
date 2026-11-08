"use client";

import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { useStore, update, formatDateTime } from "@/lib/store";
import { PageHeader, Card, Badge, EmptyState, btnOutline } from "@/components/ui";

export default function StaffNotificationsPage() {
  const [items] = useStore("staffNotifications");
  const unread = items.filter((n) => !n.isRead).length;
  const sorted = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const markRead = (id) => update("staffNotifications", (l) => l.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  const markAll = () => update("staffNotifications", (l) => l.map((n) => ({ ...n, isRead: true })));
  const remove = (id) => update("staffNotifications", (l) => l.filter((n) => n.id !== id));

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
        {sorted.length === 0 ? (
          <EmptyState message="No notifications yet." />
        ) : (
          <ul className="divide-y divide-gray-100">
            {sorted.map((n) => (
              <li key={n.id} className={`flex items-start gap-3 py-3 ${n.isRead ? "" : "bg-blue-50/40"}`}>
                <Bell size={18} className={`mt-0.5 shrink-0 ${n.isRead ? "text-muted" : "text-primary"}`} />
                <div className="flex-1">
                  <p className={`text-sm ${n.isRead ? "text-text" : "font-medium text-sidebar"}`}>{n.message}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                    <Badge>{n.type}</Badge> {formatDateTime(n.createdAt)}
                  </p>
                </div>
                {!n.isRead && (
                  <button onClick={() => markRead(n.id)} className="text-xs font-medium text-primary hover:underline">Mark as read</button>
                )}
                <button onClick={() => remove(n.id)} aria-label="Delete notification" className="text-muted hover:text-danger">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}