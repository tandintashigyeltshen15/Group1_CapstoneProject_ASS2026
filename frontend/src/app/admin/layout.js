"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useStore } from "@/lib/store";

export default function AdminLayout({ children }) {
  const [notifications] = useStore("adminNotifications");
  const [profile] = useStore("adminProfile");
  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="Admin" />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          role="Administrator"
          notificationsHref="/admin/notifications"
          searchHref="/admin/users"
          searchPlaceholder="Search users by name or email..."
          unreadCount={unread}
          fallbackName={profile.name}
        />

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
