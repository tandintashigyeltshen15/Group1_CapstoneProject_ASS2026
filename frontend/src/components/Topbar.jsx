"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Bell, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import Avatar from "@/components/Avatar";

// Which endpoint returns the logged-in user's photo, per role
// (administrators have no photo)
const PROFILE_ENDPOINT = {
  Student: "/student/profile",
  Staff: "/staff/me",
  Alumni: "/alumni/me",
};

// How often the bell checks for new notifications (milliseconds)
const REFRESH_MS = 30000;

// Works whether the API returns a plain list or an object that holds the list
function countUnread(data) {
  if (data && typeof data.unreadCount === "number") return data.unreadCount;
  if (data && typeof data.unread === "number") return data.unread;

  const list = Array.isArray(data) ? data : data?.notifications || data?.items || data?.data || [];
  if (!Array.isArray(list)) return 0;
  return list.filter((n) => !(n.isRead ?? n.IsRead ?? n.read ?? false)).length;
}

export default function Topbar({
  role,
  notificationsHref = "/notifications",
  searchHref = "/alumni-hub/directory",
  showSearch = true,
  searchPlaceholder = "Search alumni by name, skills, company...",
  fallbackName = "",
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [user, setUser] = useState({ name: fallbackName, role: role || "Student", photoUrl: "" });
  const [unread, setUnread] = useState(0);

  // The count comes from the server, so it always matches the Notifications page
  const loadUnread = useCallback(() => {
    api("/notifications")
      .then((d) => setUnread(countUnread(d)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadUnread();
    const timer = setInterval(loadUnread, REFRESH_MS);
    // A page can announce a change with: window.dispatchEvent(new Event("notifications-changed"))
    window.addEventListener("notifications-changed", loadUnread);
    return () => {
      clearInterval(timer);
      window.removeEventListener("notifications-changed", loadUnread);
    };
  }, [loadUnread]);

  useEffect(() => {
    let cancelled = false;
    let effectiveRole = role || "Student";

    // 1. Show what is saved in the browser straight away
    try {
      const stored = JSON.parse(localStorage.getItem("user"));
      if (stored) {
        effectiveRole = role || stored.role || "Student";
        setUser({
          name: stored.name || fallbackName,
          role: effectiveRole,
          photoUrl: stored.photoUrl || "",
        });
      }
    } catch {}

    // 2. Then ask the server for the real, current name and photo
    const endpoint = PROFILE_ENDPOINT[effectiveRole];
    if (endpoint) {
      api(endpoint)
        .then((d) => {
          if (cancelled) return;
          // Student and staff return name/photoUrl; alumni nests them under user
          const name = d.name || d.user?.Name;
          const photo = d.photoUrl ?? d.user?.ProfilePhoto ?? "";
          setUser((u) => ({ ...u, name: name || u.name, photoUrl: photo || "" }));
        })
        .catch(() => {});
    }

    // 3. Update immediately when a photo is uploaded or removed on a profile page
    const onPhoto = (e) => setUser((u) => ({ ...u, photoUrl: e.detail || "" }));
    window.addEventListener("profile-photo-changed", onPhoto);

    return () => {
      cancelled = true;
      window.removeEventListener("profile-photo-changed", onPhoto);
    };
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
        <form onSubmit={search} className="relative max-w-xl flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg bg-gray-100 py-2.5 pl-9 pr-3 text-sm text-text outline-none focus:ring-2 focus:ring-primary/30"
          />
        </form>
      )}

      <div className="ml-auto flex items-center gap-5">
        <Link href={notificationsHref} className="relative text-text hover:text-primary">
          <Bell size={22} />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-3 border-l border-gray-200 pl-5">
          <Avatar name={user.name} photoUrl={user.photoUrl} size="h-10 w-10" text="text-sm" />
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