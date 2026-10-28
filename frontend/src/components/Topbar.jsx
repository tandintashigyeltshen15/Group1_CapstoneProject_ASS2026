"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Bell, ChevronDown } from "lucide-react";

const initials = (name) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export default function Topbar({
  role,
  notificationsHref = "/notifications",
  searchHref = "/alumni-hub/directory",
  showSearch = true,
  searchPlaceholder = "Search alumni by name, skills, company...",
  unreadCount = 0,
  fallbackName = "",
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [user, setUser] = useState({ name: fallbackName, role: role || "Student" });
  const unread = unreadCount; // pass the count from the layout (later: /api/notifications)

  // The login page will save { name, role } as "user" in localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user"));
      if (stored) {
        setUser({
          name: stored.name || fallbackName,
          role: role || stored.role || "Student",
        });
      }
    } catch {}
  }, [role, fallbackName]);

  const search = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`${searchHref}?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-8">
      {showSearch && (
<<<<<<< HEAD
      <form onSubmit={search} className="relative max-w-xl flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg bg-gray-100 py-2.5 pl-9 pr-3 text-sm text-text outline-none focus:ring-2 focus:ring-primary/30"
        />
      </form>
=======
        <form onSubmit={search} className="relative max-w-xl flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg bg-gray-100 py-2.5 pl-9 pr-3 text-sm text-text outline-none focus:ring-2 focus:ring-primary/30"
          />
        </form>
>>>>>>> e3a1797cd311d79310ff82dc0d35a70642cd61ae
      )}

      <div className="ml-auto flex items-center gap-5">
        <Link href={notificationsHref} className="relative text-text hover:text-primary">
          <Bell size={22} />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
              {unread}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-3 border-l border-gray-200 pl-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar text-sm font-semibold text-white">
            {user.name ? initials(user.name) : "?"}
          </div>
          <div className="leading-tight">
            {user.name && <p className="text-sm font-medium text-sidebar">{user.name}</p>}
            <p className="text-xs text-muted">{user.role}</p>
          </div>
          <ChevronDown size={16} className="text-muted" />
        </div>
      </div>
    </header>
  );
}