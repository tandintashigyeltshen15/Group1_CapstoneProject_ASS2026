"use client";

import { Bell, HandHeart, UserCheck, CalendarDays, Briefcase, Flag, Trash2 } from "lucide-react";
import { PageHeader, Card, EmptyState, btnOutline } from "@/components/ui";
import { useStore, formatDateTime } from "@/lib/store";

const ICONS = {
  Contribution: HandHeart,
  Alumni: UserCheck,
  Event: CalendarDays,
  Opportunity: Briefcase,
  Report: Flag,
};

export default function AdminNotificationsPage() {
  const [items, setItems] = useStore("adminNotifications");
  const unread = items.filter((n) => !n.isRead).length;
  const sorted = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unread ? `You have ${unread} unread notification${unread > 1 ? "s" : ""}.` : "You are all caught up."}
        action={
          <button type="button" className={btnOutline} disabled={!unread} onClick={() => setItems((l) => l.map((n) => ({ ...n, isRead: true })))}>
            Mark all as read
          </button>
        }
      />

      <Card>
        {sorted.length === 0 ? (
          <EmptyState message="No notifications." />
        ) : (
          <ul className="divide-y divide-gray-100">
            {sorted.map((n) => {
              const Icon = ICONS[n.type] || Bell;
              return (
                <li key={n.id} className={`flex items-center gap-4 px-2 py-4 ${n.isRead ? "" : "bg-blue-50/50"}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm text-sidebar ${n.isRead ? "" : "font-semibold"}`}>{n.message}</p>
                    <p className="text-xs text-muted">{n.type} • {formatDateTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => setItems((l) => l.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)))}>
                      Mark as read
                    </button>
                  )}
                  <button type="button" aria-label="Delete notification" className="rounded-lg p-2 text-muted hover:bg-gray-100 hover:text-danger" onClick={() => setItems((l) => l.filter((x) => x.id !== n.id))}>
                    <Trash2 size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
