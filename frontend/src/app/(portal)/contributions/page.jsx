"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Heart,
  Clock,
  Check,
  Users,
  Megaphone,
  TrendingUp,
  CalendarDays,
} from "lucide-react";

const tabs = ["All Initiatives", "Ongoing", "Completed"];

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const money = (n) => `Nu. ${Number(n).toLocaleString("en-IN")}`;

const initials = (name = "") =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

/* ----------------------------- pieces ----------------------------- */
function StatusBadge({ status }) {
  const done = status === "Completed";
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        done ? "bg-green-100 text-success" : "bg-orange-100 text-warning"
      }`}
    >
      {done ? "Completed" : "Ongoing"}
    </span>
  );
}

function EmptyState({ message }) {
  return <p className="py-12 text-center text-sm text-muted">{message}</p>;
}

function ImpactStat({ icon: Icon, value, label, iconStyle }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-gray-50 py-6">
      <Icon size={22} className={iconStyle} />
      <p className="mt-2 text-2xl font-bold text-sidebar">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

function InitiativeCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  const long = item.description.length > 180;
  const text =
    expanded || !long ? item.description : `${item.description.slice(0, 180)}...`;
  const percent = item.targetAmount
    ? Math.min(100, Math.round((item.receivedAmount / item.targetAmount) * 100))
    : null;

  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-sidebar">{item.title}</h3>
        <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-primary">
          {item.type}
        </span>
        <StatusBadge status={item.status} />
      </div>

      <p className="whitespace-pre-line text-sm text-text">{text}</p>
      {long && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      {/* Progress */}
      <div className="mt-4">
        {percent !== null && (
          <div className="mb-1 h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
          </div>
        )}
        <p className="text-sm text-text">
          <span className="font-semibold text-sidebar">{money(item.receivedAmount)}</span>
          {item.targetAmount ? ` raised of ${money(item.targetAmount)} (${percent}%)` : " raised"}
          {" · "}
          {item.contributors} {item.contributors === 1 ? "contribution" : "contributions"}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <span>Posted by {item.postedBy}</span>
        <span>{formatDate(item.createdAt)}</span>
        {item.deadline && (
          <span className="flex items-center gap-1">
            <CalendarDays size={12} /> Until {formatDate(item.deadline)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- page ------------------------------ */
export default function ContributionsPage() {
  const [data, setData] = useState({
    stats: { total: 0, ongoing: 0, completed: 0, contributors: 0 },
    initiatives: [],
    recentContributors: [],
  });
  const [tab, setTab] = useState("All Initiatives");
  const [sort, setSort] = useState("latest");

  useEffect(() => {
    api("/contributions")
      .then(setData)
      .catch((err) => console.warn(err.message));
  }, []);

  const filtered = data.initiatives.filter(
    (i) =>
      tab === "All Initiatives" ||
      (tab === "Ongoing" && i.status === "Open") ||
      (tab === "Completed" && i.status === "Completed")
  );

  const far = 8.64e15; // initiatives without a deadline go last
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sort === "deadline")
      return new Date(a.deadline || far) - new Date(b.deadline || far);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const { stats, recentContributors } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
          <Heart size={30} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-sidebar">Contributions</h1>
          <p className="text-muted">
            Give back with your time, skills and resources. Build a stronger CST community
            together.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-6 py-3 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-primary text-white"
                : "bg-blue-50 text-text hover:bg-blue-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Initiatives */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-sidebar">
              <Megaphone size={20} className="text-primary" /> Contribution Initiatives
            </h2>
            <p className="mt-1 text-sm text-muted">
              Funding needs posted by staff, and contributions pledged by alumni to uplift the
              CST community.
            </p>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-text outline-none focus:border-primary"
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
            <option value="deadline">Deadline Soon</option>
          </select>
        </div>

        {sorted.length === 0 ? (
          <EmptyState
            message={
              data.initiatives.length === 0
                ? "No initiatives yet. Staff will post them here."
                : "No initiatives in this tab."
            }
          />
        ) : (
          <div className="space-y-4">
            {sorted.map((i) => (
              <InitiativeCard key={i.id} item={i} />
            ))}
          </div>
        )}
      </div>

      {/* Impact */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-sidebar">
          <TrendingUp size={20} className="text-primary" /> Community Contribution Impact
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ImpactStat icon={Heart} value={stats.total} label="Total Initiatives" iconStyle="text-primary" />
          <ImpactStat icon={Clock} value={stats.ongoing} label="Ongoing" iconStyle="text-warning" />
          <ImpactStat icon={Check} value={stats.completed} label="Completed" iconStyle="text-success" />
          <ImpactStat icon={Users} value={stats.contributors} label="Alumni Contributors" iconStyle="text-accent" />
        </div>
      </div>

      {/* Recent contributors */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-sidebar">
          <Users size={20} className="text-primary" /> Recent Contributors
        </h2>
        {recentContributors.length === 0 ? (
          <EmptyState message="No contributors yet." />
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentContributors.map((c) => (
              <li key={c.id} className="flex items-center gap-4 py-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-primary">
                  {c.graduationYear ? initials(c.name) : "?"}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sidebar">{c.name}</p>
                  <p className="text-xs text-muted">
                    {c.graduationYear ? `Class of ${c.graduationYear} · ` : ""}
                    {c.initiative}
                  </p>
                </div>
                <div className="text-right text-xs text-muted">
                  {c.amount ? (
                    <p className="text-sm font-semibold text-sidebar">{money(c.amount)}</p>
                  ) : (
                    <p className="text-sm font-medium text-sidebar">In-kind</p>
                  )}
                  <p>{formatDate(c.date)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Banner */}
      <div className="rounded-xl bg-gradient-to-r from-sidebar to-primary px-6 py-12 text-center text-white">
        <p className="text-2xl font-medium italic">&ldquo;Together, we give back. Together, we grow.&rdquo;</p>
        <p className="mt-2 text-sm text-white/80">&ndash; CST Alumni Community</p>
      </div>
    </div>
  );
}