"use client";

import { useState } from "react";
import { CalendarDays, Clock, MapPin, Search, Users, UserRound } from "lucide-react";

/* ------------------------------------------------------------------
   DATA (temporary): empty for now. Later, fetch from the backend.
   Staff will create these from their own page.

   events: { id, title, description, location,
             categories: ["Career Guidance", "Alumni Talk"],
             startsAt: "2026-11-20T10:00:00", endsAt: "2026-11-20T12:00:00",
             organizer, expectedParticipants }
------------------------------------------------------------------- */
const events = [
  { id: 1, title: "CST Alumni Career Talk", description: "Hear from alumni working in tech.",
    location: "Seminar Hall, CST", categories: ["Career Guidance", "Alumni Talk"],
    startsAt: "2026-11-20T10:00:00", endsAt: "2026-11-20T12:00:00",
    organizer: "CST Alumni Association", expectedParticipants: "200+ students" },
  { id: 2, title: "Community Service Drive", description: "Volunteer day in Thimphu.",
    location: "Thimphu", categories: ["Community Service"],
    startsAt: "2026-10-15T09:00:00", endsAt: "2026-11-05T17:00:00" },
  { id: 3, title: "Alumni Panel Discussion", description: "Paths beyond CST.",
    location: "Multipurpose Hall, CST", categories: ["Panel Discussion"],
    startsAt: "2026-10-01T15:00:00", endsAt: "2026-10-01T17:00:00" },
];

const tabs = ["All Events", "Upcoming", "Ongoing", "Past Events"];

/* ----------------------------- helpers ----------------------------- */
// Status is worked out from the dates, so staff never set it by hand
const getStatus = (e) => {
  const now = Date.now();
  if (now < new Date(e.startsAt).getTime()) return "Upcoming";
  if (now <= new Date(e.endsAt).getTime()) return "Ongoing";
  return "Past";
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

const dateText = (e) =>
  sameDay(e.startsAt, e.endsAt)
    ? fmtDate(e.startsAt)
    : `${fmtDate(e.startsAt)} – ${fmtDate(e.endsAt)}`;
const timeText = (e) =>
  sameDay(e.startsAt, e.endsAt) ? `${fmtTime(e.startsAt)} – ${fmtTime(e.endsAt)}` : null;

const statusStyle = {
  Upcoming: "bg-primary text-white",
  Ongoing: "bg-success text-white",
  Past: "bg-muted text-white",
};
const rank = { Upcoming: 0, Ongoing: 1, Past: 2 };

/* ----------------------------- pieces ----------------------------- */
function StatusPill({ status }) {
  return (
    <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${statusStyle[status]}`}>
      {status}
    </span>
  );
}

function Tags({ list }) {
  if (!list?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {list.map((t) => (
        <span key={t} className="rounded-full bg-blue-50 px-3 py-0.5 text-xs text-primary">
          {t}
        </span>
      ))}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white py-12 text-center text-sm text-muted shadow-sm">
      {message}
    </div>
  );
}

function EventCard({ event, status, active, registered, onSelect, onRegister }) {
  return (
    <div
      onClick={() => onSelect(event.id)}
      className={`flex cursor-pointer flex-wrap items-center gap-5 rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        active ? "border-primary" : "border-gray-200"
      }`}
    >
      <div className="relative flex h-28 w-40 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-sidebar to-primary text-white/80">
        <CalendarDays size={36} />
        <span className="absolute left-2 top-2">
          <StatusPill status={status} />
        </span>
      </div>

      <div className="min-w-48 flex-1">
        <h3 className="font-semibold text-sidebar">{event.title}</h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 text-sm text-text">
          <span className="flex items-center gap-1">
            <CalendarDays size={14} className="text-muted" /> {dateText(event)}
          </span>
          {timeText(event) && (
            <span className="flex items-center gap-1">
              <Clock size={14} className="text-muted" /> {timeText(event)}
            </span>
          )}
        </p>
        <p className="mt-1 flex items-center gap-1 text-sm text-text">
          <MapPin size={14} className="text-muted" /> {event.location}
        </p>
        <Tags list={event.categories} />
      </div>

      {status === "Upcoming" && !registered ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRegister(event.id);
          }}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Register Now
        </button>
      ) : (
        <span
          className={`rounded-lg border px-5 py-2 text-sm font-medium ${
            registered ? "border-success text-success" : "border-primary text-primary"
          }`}
        >
          {registered ? "Registered" : "View Details"}
        </span>
      )}
    </div>
  );
}

/* ------------------------------- page ------------------------------ */
export default function EventsPage() {
  const [tab, setTab] = useState("All Events");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [registeredIds, setRegisteredIds] = useState([]);

  const register = (id) => {
    // TODO (backend phase): POST /api/events/:id/register
    // For now it is only stored locally so the UI can be tested.
    setRegisteredIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const withStatus = events
    .map((e) => ({ ...e, status: getStatus(e) }))
    .sort((a, b) =>
      a.status !== b.status
        ? rank[a.status] - rank[b.status]
        : a.status === "Past"
        ? new Date(b.startsAt) - new Date(a.startsAt)
        : new Date(a.startsAt) - new Date(b.startsAt)
    );

  const count = (s) => withStatus.filter((e) => e.status === s).length;
  const categories = [...new Set(events.flatMap((e) => e.categories ?? []))].sort();

  const tabStatus = { Upcoming: "Upcoming", Ongoing: "Ongoing", "Past Events": "Past" }[tab];
  const list = withStatus.filter(
    (e) =>
      (!tabStatus || e.status === tabStatus) &&
      (!category || e.categories?.includes(category)) &&
      `${e.title} ${e.location} ${(e.categories ?? []).join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const selected = list.find((e) => e.id === selectedId) ?? list[0];
  const glance = withStatus.filter((e) => e.status === "Upcoming").slice(0, 3);

  const tabLabel = (t) => {
    if (t === "All Events") return `${t} (${withStatus.length})`;
    if (t === "Upcoming") return `${t} (${count("Upcoming")})`;
    if (t === "Ongoing") return `${t} (${count("Ongoing")})`;
    return `${t} (${count("Past")})`;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
          <CalendarDays size={30} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-sidebar">Events</h1>
          <p className="text-sm text-muted">
            Stay connected with CST through workshops, seminars, and community events.
          </p>
        </div>
      </div>

      {/* Tabs + search + category */}
      <div className="mb-6 flex flex-wrap items-center gap-4 border-b border-gray-200">
        <div className="flex gap-8">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-text hover:text-primary"
              }`}
            >
              {tabLabel(t)}
            </button>
          ))}
        </div>

        <div className="ml-auto mb-2 flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              className="w-56 rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-text outline-none focus:border-primary"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-text outline-none focus:border-primary"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_24rem]">
        {/* Event list */}
        <div className="space-y-4">
          {list.length === 0 ? (
            <EmptyState
              message={events.length === 0 ? "No events yet." : "No events match your filters."}
            />
          ) : (
            list.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                status={e.status}
                active={selected?.id === e.id}
                registered={registeredIds.includes(e.id)}
                onSelect={setSelectedId}
                onRegister={register}
              />
            ))
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {selected ? (
              <>
                <div className="relative flex h-40 items-end bg-linear-to-br from-sidebar to-primary p-5">
                  <span className="absolute left-4 top-4">
                    <StatusPill status={selected.status} />
                  </span>
                  <h2 className="text-xl font-bold text-white">{selected.title}</h2>
                </div>
                <div className="space-y-2 p-5 text-sm text-text">
                  <p className="flex items-center gap-3">
                    <CalendarDays size={16} className="text-muted" /> {dateText(selected)}
                  </p>
                  {timeText(selected) && (
                    <p className="flex items-center gap-3">
                      <Clock size={16} className="text-muted" /> {timeText(selected)}
                    </p>
                  )}
                  <p className="flex items-center gap-3">
                    <MapPin size={16} className="text-muted" /> {selected.location}
                  </p>

                  {selected.description && (
                    <div className="border-t border-gray-100 pt-3">
                      <h3 className="mb-1 font-semibold text-sidebar">About the Event</h3>
                      <p className="whitespace-pre-line text-muted">{selected.description}</p>
                    </div>
                  )}

                  {(selected.organizer || selected.expectedParticipants) && (
                    <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3">
                      {selected.organizer && (
                        <div className="flex items-start gap-2">
                          <UserRound size={18} className="mt-0.5 text-muted" />
                          <div>
                            <p className="text-xs text-muted">Organized by</p>
                            <p>{selected.organizer}</p>
                          </div>
                        </div>
                      )}
                      {selected.expectedParticipants && (
                        <div className="flex items-start gap-2">
                          <Users size={18} className="mt-0.5 text-muted" />
                          <div>
                            <p className="text-xs text-muted">Expected Participants</p>
                            <p>{selected.expectedParticipants}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selected.status === "Upcoming" &&
                    (registeredIds.includes(selected.id) ? (
                      <p className="mt-2 rounded-lg border border-success py-2.5 text-center font-medium text-success">
                        You are registered
                      </p>
                    ) : (
                      <button
                        onClick={() => register(selected.id)}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-medium text-white hover:bg-blue-700"
                      >
                        <CalendarDays size={16} /> Register Now
                      </button>
                    ))}
                </div>
              </>
            ) : (
              <p className="py-12 text-center text-sm text-muted">
                Event details will show here.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-sidebar">
              <CalendarDays size={18} className="text-primary" /> Upcoming Events at a Glance
            </h2>
            {glance.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">No upcoming events.</p>
            ) : (
              <ul className="space-y-3">
                {glance.map((e) => {
                  const d = new Date(e.startsAt);
                  return (
                    <li
                      key={e.id}
                      onClick={() => setSelectedId(e.id)}
                      className="flex cursor-pointer items-center gap-4 rounded-lg bg-gray-50 p-3"
                    >
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-white shadow-sm">
                        <span className="text-[10px] font-semibold uppercase text-primary">
                          {d.toLocaleDateString("en-GB", { month: "short" })}
                        </span>
                        <span className="text-xl font-bold text-sidebar">{d.getDate()}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-sidebar">{e.title}</p>
                        {timeText(e) && <p className="text-xs text-muted">{timeText(e)}</p>}
                      </div>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-primary">
                        {registeredIds.includes(e.id) ? "Registered" : "Register Soon"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}