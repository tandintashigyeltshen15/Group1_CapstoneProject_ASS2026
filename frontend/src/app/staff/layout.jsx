import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function StaffLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="Staff" />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar role="Staff" notificationsHref="/staff/notifications" searchHref="/staff/alumni" />

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}