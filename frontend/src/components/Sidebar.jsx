"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Alumni Hub", href: "/alumni-hub", icon: BookOpen },
  { label: "Mentorship", href: "/mentorship", icon: User },
  { label: "Internships", href: "/internships", icon: Briefcase },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "My Applications", href: "/applications", icon: ClipboardList },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "My Profile", href: "/profile", icon: IdCard },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar text-white w-64 h-screen shrink-0 flex flex-col px-4 py-6">
      <div className="flex items-center gap-3 px-2 mb-8">
        <Image
          src="/cst-logo.png"
          alt="CST logo"
          width={72}
          height={72}
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
          const active = pathname === href || pathname.startsWith(href + "/");
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
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-danger transition-colors hover:bg-white/10"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}