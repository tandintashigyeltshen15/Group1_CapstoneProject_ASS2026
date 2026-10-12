const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Alumni Hub", href: "/alumni-hub" },
  { label: "Mentorship", href: "/mentorship" },
  { label: "Messages", href: "/messages" },
  { label: "Jobs and Internships", href: "/jobs" },
  { label: "Events", href: "/events" },
  { label: "My Applications", href: "/applications" },
  { label: "Notifications", href: "/notifications" },
  { label: "My profile", href: "/profile" },
  { label: "Settings", href: "/settings" },
];

export default function Sidebar({ activePage = "" }) {
  return (
    <aside className="bg-sidebar text-white w-64 min-h-screen flex flex-col p-4">
      <div className="text-xl font-bold mb-8 px-2">CST ALUMNI PORTAL</div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`px-3 py-2 rounded-lg text-sm ${
              activePage === item.label
                ? "bg-primary text-white"
                : "text-gray-300 hover:bg-white/10"
            }`}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <a href="/logout" className="px-3 py-2 text-sm text-red-400 hover:bg-white/10 rounded-lg">
        Logout
      </a>
    </aside>
  );
}