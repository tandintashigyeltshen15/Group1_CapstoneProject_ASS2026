"use client";

import { useState } from "react";
import { Heart, Users, CalendarDays, Megaphone, TrendingUp, Clock, Check, X } from "lucide-react";

/* ------------------------------------------------------------------
   DATA (temporary): empty for now. Later, fetch from the backend.
   Staff and alumni will create initiatives from their own page.

   initiatives: {
     id, title, description,
     type: "Volunteering" | "Resources" | "Mentoring" | "Other",
     startsAt: "2026-10-01", endsAt: "2026-10-31",
     goal: 75,            // people needed (optional)
     participants: 47,    // how many have already joined
     postedBy: "CST Alumni Association"
   }
   recent: { id, name, label: "Alumni · Class of 2021", joinedAt: "2026-10-12" }
     (only people who agreed to be shown publicly)
------------------------------------------------------------------- */
const initiatives = [];
const recent = [];

const tabs = ["All Initiatives", "Ongoing", "Completed", "My Contributions"];
const DAY = 86400000;

const isOpen = (i) => new Date(i.endsAt).getTime() + DAY > Date.now();
const fmt = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const initials = (name) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

/* ----------------------------- pieces ----------------------------- */
function StatusPill({ open }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium text-white ${
        open ? "bg-primary" : "bg-muted"
      }`}
    >
      {open ? "Ongoing" : "Completed"}
    </span>
  );
}

function ProgressBar({ value, goal, done }) {
  if (!goal) return null;
  const pct = Math.min(100, Math.round((value / goal) * 100));
  return (
    <div className="mt-3 flex items-center gap-3">
      <div className="h-2 flex-1 rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full ${done ? "bg-muted" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-28 text-right text-xs font-medium text-text">{pct}% joined</span>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-sidebar">{title}</h3>
          <button onClick={onClose}>
            <X size={18} className="text-muted" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ImpactCell({ icon: Icon, value, label, tone }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-gray-100 bg-gray-50 py-5">
      <Icon size={20} className={tone} />
      <p className="text-2xl font-bold text-sidebar">{value}</p>
      <p className="text-center text-xs text-muted">{label}</p>
    </div>
  );
}

/* ------------------------------- page ------------------------------ */
export default function ContributionsPage() {
  const [tab, setTab] = useState("All Initiatives");
  const [sort, setSort] = useState("latest");
  const [joinedIds, setJoinedIds] = useState([]);
  const [selected, setSelected] = useState(null);

  const joined = (id) => joinedIds.includes(id);
  const count = (i) => (i.participants || 0) + (joined(i.id) ? 1 : 0);

  const toggleJoin = (id) => {
    // TODO (backend phase): POST / DELETE /api/initiatives/:id/join
    setJoinedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const list = initiatives
    .filter((i) => {
      if (tab === "Ongoing") return isOpen(i);
      if (tab === "Completed") return !isOpen(i);
      if (tab === "My Contributions") return joined(i.id);
      return true;
    })
    .sort((a, b) =>
      sort === "latest"
        ? new Date(b.startsAt) - new Date(a.startsAt)
        : new Date(a.endsAt) - new Date(b.endsAt)
    );

  const mine = initiatives.filter((i) => joined(i.id));
  const mineCompleted = mine.filter((i) => !isOpen(i)).length;

  const emptyMessage =
    tab === "My Contributions"
      ? "You haven't joined any initiatives yet."
      : initiatives.length === 0
      ? "No initiatives yet. Staff and alumni will post them here."
      : "Nothing here yet.";

  const sel = selected && initiatives.find((i) => i.id === selected);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
          <Heart size={30} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-sidebar">Contributions</h1>
          <p className="text-sm text-muted">
            Give back with your time, skills and resources. Build a stronger CST community together.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-3">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${
              tab === t ? "bg-primary text-white" : "bg-blue-50 text-text hover:bg-blue-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]">
        {/* Initiatives */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-sidebar">
                <Megaphone size={20} className="text-primary" /> Contribution Initiatives
              </h2>
              <p className="mt-1 text-sm text-muted">
                Join initiatives posted by staff and alumni to uplift the CST community.
              </p>
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-text outline-none focus:border-primary"
            >
              <option value="latest">Latest First</option>
              <option value="ending">Ending Soon</option>
            </select>
          </div>

          {list.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">{emptyMessage}</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {list.map((i) => {
                const open = isOpen(i);
                return (
                  <div key={i.id} className="flex flex-wrap items-center gap-5 py-5">
                    <div className="relative flex h-32 w-44 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-sidebar to-primary text-white/80">
                      <Heart size={36} />
                      <span className="absolute left-2 top-2">
                        <StatusPill open={open} />
                      </span>
                    </div>

                    <div className="min-w-56 flex-1">
                      <h3 className="font-semibold text-sidebar">{i.title}</h3>
                      {i.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted">{i.description}</p>
                      )}
                      <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-text">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={14} className="text-muted" />
                          {open ? "Ends" : "Ended"}: {fmt(i.endsAt)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users size={14} className="text-muted" /> {count(i)} joined
                        </span>
                        {i.type && (
                          <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs text-primary">
                            {i.type}
                          </span>
                        )}
                      </p>
                      <ProgressBar value={count(i)} goal={i.goal} done={!open} />
                    </div>

                    <button
                      onClick={() => setSelected(i.id)}
                      className={`rounded-lg px-5 py-2 text-sm font-medium ${
                        open
                          ? "bg-primary text-white hover:bg-blue-700"
                          : "border border-primary text-primary hover:bg-blue-50"
                      }`}
                    >
                      View Details
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-sidebar">
              <TrendingUp size={20} className="text-primary" /> Your Contribution Impact
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <ImpactCell icon={Heart} value={mine.length} label="Initiatives Joined" tone="text-primary" />
              <ImpactCell icon={Clock} value={mine.length - mineCompleted} label="Ongoing" tone="text-warning" />
              <ImpactCell icon={Check} value={mineCompleted} label="Completed" tone="text-success" />
              <ImpactCell
                icon={Users}
                value={initiatives.filter(isOpen).length}
                label="Open Initiatives"
                tone="text-accent"
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-sidebar">
              <Users size={18} className="text-primary" /> Recent Contributors
            </h2>
            {recent.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No contributors yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recent.slice(0, 3).map((r) => (
                  <li key={r.id} className="flex items-center gap-3 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-primary">
                      {initials(r.name)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-sidebar">{r.name}</p>
                      <p className="text-xs text-muted">{r.label}</p>
                    </div>
                    <span className="text-xs text-muted">{fmt(r.joinedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex h-36 flex-col items-center justify-center rounded-xl bg-linear-to-br from-sidebar to-primary p-6 text-center text-white">
            <p className="text-lg italic">&ldquo;Together, we give back. Together, we grow.&rdquo;</p>
            <p className="mt-1 text-xs text-white/80">– CST Alumni Community</p>
          </div>
        </div>
      </div>

      {/* Details modal */}
      {sel && (
        <Modal title={sel.title} onClose={() => setSelected(null)}>
          <div className="mb-3 flex items-center gap-3">
            <StatusPill open={isOpen(sel)} />
            {sel.type && (
              <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs text-primary">{sel.type}</span>
            )}
          </div>
          {sel.description && (
            <p className="mb-4 whitespace-pre-line text-sm text-text">{sel.description}</p>
          )}
          <div className="mb-2 space-y-1 text-sm text-text">
            {sel.startsAt && (
              <p>
                <span className="text-muted">Starts: </span>
                {fmt(sel.startsAt)}
              </p>
            )}
            <p>
              <span className="text-muted">{isOpen(sel) ? "Ends: " : "Ended: "}</span>
              {fmt(sel.endsAt)}
            </p>
            {sel.postedBy && (
              <p>
                <span className="text-muted">Organised by: </span>
                {sel.postedBy}
              </p>
            )}
            <p>
              <span className="text-muted">Joined: </span>
              {count(sel)}
              {sel.goal ? ` of ${sel.goal} needed` : ""}
            </p>
          </div>
          <ProgressBar value={count(sel)} goal={sel.goal} done={!isOpen(sel)} />

          <div className="mt-5">
            {!isOpen(sel) ? (
              <p className="text-sm font-medium text-muted">This initiative has ended.</p>
            ) : joined(sel.id) ? (
              <div className="flex items-center gap-3">
                <span className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-success py-2.5 text-sm font-medium text-success">
                  <Check size={16} /> You have joined
                </span>
                <button
                  onClick={() => toggleJoin(sel.id)}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-muted hover:text-danger"
                >
                  Leave
                </button>
              </div>
            ) : (
              <button
                onClick={() => toggleJoin(sel.id)}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Join this initiative
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}