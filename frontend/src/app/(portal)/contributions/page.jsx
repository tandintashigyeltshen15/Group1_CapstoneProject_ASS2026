"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Heart, Clock, Check, Users, Megaphone, TrendingUp, CalendarDays, Search, X,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const tabs = ["All", "Open", "Completed", "Closed"];

const STATUS_STYLE = {
  Open: "bg-green-100 text-success",
  Completed: "bg-blue-100 text-primary",
  Closed: "bg-gray-100 text-muted",
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-";

const money = (n) => `Nu. ${Number(n || 0).toLocaleString("en-IN")}`;

const emptyData = {
  stats: { totalRaised: 0, activeRequests: 0, completedRequests: 0, supporters: 0 },
  campaigns: [],
  recent: [],
};

/* ----------------------------- pieces ----------------------------- */
function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[status] || STATUS_STYLE.Closed}`}>
      {status}
    </span>
  );
}

function Progress({ value }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-success" style={{ width: `${value}%` }} />
    </div>
  );
}

function Stat({ icon: Icon, value, label, tone }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-gray-50 py-6">
      <Icon size={22} className={tone} />
      <p className="mt-2 text-2xl font-bold text-sidebar">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

function CampaignCard({ c, onOpen }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {c.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`${API}${c.imageUrl}`} alt="" className="h-36 w-full object-cover" />
      ) : (
        <div className="flex h-36 items-center justify-center bg-linear-to-br from-sidebar to-primary text-white/80">
          <Megaphone size={36} />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sidebar">{c.title}</h3>
          <StatusBadge status={c.displayStatus} />
        </div>
        <span className="mb-2 w-fit rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-primary">{c.category}</span>
        <p className="line-clamp-2 text-sm text-muted">{c.description}</p>

        <div className="mt-4">
          <Progress value={c.percent} />
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className="text-sidebar">{money(c.raised)} of {money(c.target)}</span>
            <span className="font-semibold text-success">{c.percent}%</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span className="flex items-center gap-1"><CalendarDays size={12} /> {fmtDate(c.deadline)}</span>
          <span className="flex items-center gap-1"><Users size={12} /> {c.contributors} contributor{c.contributors === 1 ? "" : "s"}</span>
        </div>

        <button
          onClick={() => onOpen(c)}
          className="mt-auto pt-4 text-left text-sm font-medium text-primary hover:underline"
        >
          View Details
        </button>
      </div>
    </div>
  );
}

/* ------------------------------- page ------------------------------ */
export default function ContributionsPage() {
  const [data, setData] = useState(emptyData);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("All");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api("/contributions")
      .then((d) =>
        setData({
          stats: d.stats ?? emptyData.stats,
          campaigns: d.campaigns ?? [],
          recent: d.recent ?? [],
        })
      )
      .catch((err) => setError(err.message))
      .finally(() => setLoaded(true));
  }, []);

  const { stats, campaigns, recent } = data;
  const categories = [...new Set(campaigns.map((c) => c.category))].sort();

  const q = search.trim().toLowerCase();
  const filtered = campaigns.filter(
    (c) =>
      (tab === "All" || c.displayStatus === tab) &&
      (category === "All" || c.category === category) &&
      (!q || c.title.toLowerCase().includes(q))
  );

  const countFor = (t) => (t === "All" ? campaigns.length : campaigns.filter((c) => c.displayStatus === t).length);

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
            See how CST staff and alumni are supporting the college and its students.
          </p>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-danger">{error}</p>}

      {/* Impact */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-sidebar">
          <TrendingUp size={20} className="text-primary" /> Community Contribution Impact
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Heart} value={money(stats.totalRaised)} label="Total Contributions" tone="text-primary" />
          <Stat icon={Clock} value={stats.activeRequests} label="Active Requests" tone="text-warning" />
          <Stat icon={Check} value={stats.completedRequests} label="Completed" tone="text-success" />
          <Stat icon={Users} value={stats.supporters} label="Supporters" tone="text-accent" />
        </div>
      </div>

      {/* Tabs + filters */}
      <div className="flex flex-wrap items-center gap-3">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
              tab === t ? "bg-primary text-white" : "bg-blue-50 text-text hover:bg-blue-100"
            }`}
          >
            {t} ({countFor(t)})
          </button>
        ))}
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search requests..."
              className="w-52 rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-text outline-none focus:border-primary"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-text outline-none focus:border-primary"
            aria-label="Filter by category"
          >
            <option value="All">All categories</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Campaigns */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-14 text-center text-sm text-muted shadow-sm">
          {!loaded
            ? "Loading..."
            : campaigns.length === 0
            ? "No contribution requests yet. They appear here once the administration publishes them."
            : "No requests match your filters."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <CampaignCard key={c.id} c={c} onOpen={setSelected} />
          ))}
        </div>
      )}

      {/* Recent contributions */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-sidebar">
          <Users size={20} className="text-primary" /> Recent Contributions
        </h2>
        {recent.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No verified contributions yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center gap-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
                  <Heart size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sidebar">{r.donor}</p>
                  <p className="truncate text-xs text-muted">{r.campaign}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-sidebar">{money(r.amount)}</p>
                  <p className="text-xs text-muted">{fmtDate(r.date)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Banner */}
      <div className="rounded-xl bg-linear-to-r from-sidebar to-primary px-6 py-12 text-center text-white">
        <p className="text-2xl font-medium italic">&ldquo;Together, we give back. Together, we grow.&rdquo;</p>
        <p className="mt-2 text-sm text-white/80">&ndash; CST Alumni Community</p>
      </div>

      {/* Details modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-sidebar">{selected.title}</h3>
                <p className="text-sm text-muted">{selected.category}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={selected.displayStatus} />
                <button onClick={() => setSelected(null)} aria-label="Close"><X size={18} className="text-muted" /></button>
              </div>
            </div>

            <Progress value={selected.percent} />
            <p className="mt-1.5 text-sm text-sidebar">
              {money(selected.raised)} raised of {money(selected.target)} ·{" "}
              <span className="font-semibold text-success">{selected.percent}%</span>
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted">Deadline</p>
                <p className="font-medium text-sidebar">{fmtDate(selected.deadline)}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Contributors</p>
                <p className="font-medium text-sidebar">{selected.contributors}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-1 text-xs text-muted">About this request</p>
              <p className="whitespace-pre-line text-sm text-text">{selected.description}</p>
            </div>

            <p className="mt-5 rounded-lg bg-blue-50 p-3 text-xs text-sidebar">
              Contributions to these requests are made by CST staff and alumni. Students can follow the progress here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}