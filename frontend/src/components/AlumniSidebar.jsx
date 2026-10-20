
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  BookOpen,
  User,
  Briefcase,
  CalendarDays,
  ClipboardList,
  Settings,
  Bell,
  IdCard,
  LogOut,
  FileText,
} from "lucide-react";

const alumniNavItems = [
  { label: "Dashboard", href: "/alumni/dashboard", icon: Home },
  { label: "Mentorship", href: "/alumni/mentorship", icon: User },
  { label: "Internships", href: "/alumni/internships", icon: Briefcase },
  { label: "Events", href: "/alumni/events", icon: CalendarDays },
  {
    label: "My Applications",
    href: "/alumni/applications",
    icon: ClipboardList,
  },
  {
    label: "Contributions",
    href: "/alumni/contributions",
    icon: FileText,
  },
  { label: "Settings", href: "/alumni/settings", icon: Settings },
  { label: "Notifications", href: "/alumni/notifications", icon: Bell },
  { label: "My Profile", href: "/alumni/profile", icon: IdCard },
];

export default function AlumniSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <aside className="bg-sidebar text-white w-64 h-screen shrink-0 flex flex-col px-4 py-6">
      <div className="flex items-center gap-3 px-2 mb-8">
        <Image
          src="/cst-logo.png"
          alt="CST logo"
          width={96}
          height={96}
          className="h-24 w-24 shrink-0"
          priority
        />

        <span className="font-serif text-lg font-bold leading-tight tracking-wide">
          CST
          <br />
          ALUMNI
          <br />
          PORTAL
        </span>
      </div>

      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
        {alumniNavItems.map(({ label, href, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-white/15 pt-4">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-danger transition-colors hover:bg-white/10"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
