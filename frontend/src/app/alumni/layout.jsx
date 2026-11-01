
import AlumniSidebar from "@/components/AlumniSidebar";
import Topbar from "@/components/Topbar";

export default function AlumniLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <AlumniSidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar role="Alumni" />

        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
