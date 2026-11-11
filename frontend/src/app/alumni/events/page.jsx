"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { CalendarDays, MapPin, Clock, CheckCircle2, Users } from "lucide-react";
import { PageHeader, Card, Badge, EmptyState, Notice, btnPrimary, btnOutline } from "@/components/ui";

const fmtDateTime = (d) =>
  new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

// API shape -> page shape
const mapEvent = (e) => ({
  id: e.EventID,
  title: e.Title,
  description: e.Description || "",
  dateTime: e.DateTime,
  duration: e.Duration || "",
  venue: e.Venue || "",
  status: e.Status,
  registrations: e._count?.event_registration ?? 0,
  postedBy: e.user?.Name || "",
});

const isPast = (e) => new Date(e.dateTime) < new Date();

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [registeredIds, setRegisteredIds] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () =>
    Promise.all([api("/events"), api("/events/registrations/mine")])
      .then(([evs, regs]) => {
        setEvents(evs.map(mapEvent));
        setRegisteredIds(regs.map((r) => r.event.EventID));
        setLoaded(true);
      })
      .catch((err) => {
        setError(err.message);
        setLoaded(true);
      });

  useEffect(() => {
    load();
  }, []);

  async function run(ev, action, successText) {
    setError("");
    setMessage("");
    setBusyId(ev.id);
    try {
      await action();
      setMessage(successText);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const register = (ev) =>
    run(ev, () => api(`/events/${ev.id}/register`, { method: "POST" }), `You are registered for ${ev.title}.`);

  const cancel = (ev) =>
    run(ev, () => api(`/events/${ev.id}/register`, { method: "DELETE" }), `Registration cancelled for ${ev.title}.`);

  // upcoming first (soonest at the top), then past events (most recent at the top)
  const sorted = [...events].sort((a, b) => {
    const pa = isPast(a);
    const pb = isPast(b);
    if (pa !== pb) return pa ? 1 : -1;
    return pa ? new Date(b.dateTime) - new Date(a.dateTime) : new Date(a.dateTime) - new Date(b.dateTime);
  });

  return (
    <div>
      <PageHeader title="Events" subtitle="Browse upcoming CST events and register." />
      {message && <Notice>{message}</Notice>}
      {error && <Notice tone="red">{error}</Notice>}

      {sorted.length === 0 ? (
        <Card><EmptyState message={loaded ? "No events available." : "Loading..."} /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sorted.map((e) => {
            const registered = registeredIds.includes(e.id);
            const past = isPast(e);
            const closed = past || e.status === "Cancelled";
            const busy = busyId === e.id;
            return (
              <Card key={e.id}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-sidebar">{e.title}</h3>
                  {e.status === "Cancelled" ? <Badge tone="red">Cancelled</Badge>
                    : past ? <Badge>Completed</Badge>
                    : registered ? <Badge tone="green">Registered</Badge>
                    : <Badge tone="blue">Open</Badge>}
                </div>
                {e.description && <p className="mt-2 text-sm text-text">{e.description}</p>}
                <div className="mt-3 space-y-1 text-xs text-muted">
                  <p className="flex items-center gap-1"><CalendarDays size={12} /> {fmtDateTime(e.dateTime)}</p>
                  {e.duration && <p className="flex items-center gap-1"><Clock size={12} /> {e.duration}</p>}
                  {e.venue && <p className="flex items-center gap-1"><MapPin size={12} /> {e.venue}</p>}
                  <p className="flex items-center gap-1">
                    <Users size={12} /> {e.registrations} registered
                    {e.postedBy && ` · posted by ${e.postedBy}`}
                  </p>
                </div>
                <div className="mt-4">
                  {closed ? (
                    <button disabled className={btnOutline + " opacity-50"}>Registration closed</button>
                  ) : registered ? (
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
                        <CheckCircle2 size={16} /> Registered
                      </span>
                      <button onClick={() => cancel(e)} disabled={busy} className="text-sm text-danger hover:underline disabled:opacity-60">
                        {busy ? "Cancelling..." : "Cancel registration"}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => register(e)} disabled={busy} className={btnPrimary + " disabled:opacity-60"}>
                      {busy ? "Registering..." : "Register"}
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}