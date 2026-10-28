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
  Users,
  FileText,
  ShieldCheck,
  Heart,
  Megaphone,
  BarChart3,
  HandHeart,
} from "lucide-react";

const studentNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Alumni Hub", href: "/alumni-hub", icon: BookOpen },
  { label: "Mentorship", href: "/mentorship", icon: User },
  { label: "Internships", href: "/internships", icon: Briefcase },
  { label: "Contributions", href: "/contributions", icon: Heart },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "My Applications", href: "/applications", icon: ClipboardList },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "My Profile", href: "/profile", icon: IdCard },
];

const adminNavItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: Home },
  { label: "User Management", href: "/admin/users", icon: Users },
  { label: "Opportunity Management", href: "/admin/opportunities", icon: Briefcase },
  { label: "Events Management", href: "/admin/events", icon: CalendarDays },
  { label: "Contributions", href: "/admin/contributions", icon: HandHeart },
  { label: "Reports", href: "/admin/reports", icon: ClipboardList },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

const staffNavItems = [
  { label: "Dashboard", href: "/staff/dashboard", icon: Home },
  { label: "Alumni Verification", href: "/staff/verification", icon: ShieldCheck },
  { label: "Alumni Directory", href: "/staff/alumni", icon: BookOpen },
  { label: "Opportunities", href: "/staff/opportunities", icon: Briefcase },
  { label: "Events", href: "/staff/events", icon: CalendarDays },
  { label: "Announcements", href: "/staff/announcements", icon: Megaphone },
  { label: "Reports", href: "/staff/reports", icon: BarChart3 },
  { label: "Settings", href: "/staff/settings", icon: Settings },
  { label: "Notifications", href: "/staff/notifications", icon: Bell },
  { label: "My Profile", href: "/staff/profile", icon: IdCard },
];

export default function Sidebar({ role = "Student" }) {
  const pathname = usePathname();
  const router = useRouter();

  const roleKey = role.toLowerCase();
  const navItems =
    roleKey === "admin" || roleKey === "administrator"
      ? adminNavItems
      : roleKey === "staff"
      ? staffNavItems
      : studentNavItems;

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

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ label, href, icon: Icon }) => {
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