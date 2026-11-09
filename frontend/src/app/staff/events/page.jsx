"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Plus, CalendarDays, MapPin, Clock, Trash2, Pencil, Users } from "lucide-react";
import { PageHeader, Card, Badge, Field, EmptyState, Notice, inputCls, btnPrimary, btnOutline } from "@/components/ui";

const empty = { title: "", description: "", dateTime: "", duration: "", venue: "" };
const FILTERS = ["All", "Upcoming", "Completed", "Cancelled"];
const tones = { Upcoming: "blue", Completed: "gray", Cancelled: "red" };

const p2 = (n) => String(n).padStart(2, "0");
// ISO from the API -> value for <input type="datetime-local">
const toInput = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
};
const fmtDateTime = (d) =>
  new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

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

const stateOf = (e) =>
  e.status === "Cancelled" ? "Cancelled" : new Date(e.dateTime) < new Date() ? "Completed" : "Upcoming";

export default function StaffEventsPage() {
  const [events, setEvents] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("All");
  const [busy, setBusy] = useState(false);

  const load = () =>
    api("/events")
      .then((d) => {
        setEvents(d.map(mapEvent));
        setLoaded(true);
      })
      .catch((err) => {
        setError(err.message);
        setLoaded(true);
      });

  useEffect(() => {
    load();
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === "All" ? events.length : events.filter((e) => stateOf(e) === f).length;
    return acc;
  }, {});
  const shown = (filter === "All" ? events : events.filter((e) => stateOf(e) === filter))
    .slice()
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

  async function run(action, successText) {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await action();
      setMessage(successText);
      await load();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(empty);
    setError("");
    setShowForm(true);
  }

  function openEdit(ev) {
    setEditingId(ev.id);
    setForm({
      title: ev.title,
      description: ev.description,
      dateTime: toInput(ev.dateTime),
      duration: ev.duration,
      venue: ev.venue,
    });
    setError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(empty);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.venue.trim()) return setError("Title and venue are required.");
    if (!form.dateTime) return setError("Please choose a date and time.");

    const body = JSON.stringify({
      Title: form.title.trim(),
      Description: form.description.trim(),
      DateTime: new Date(form.dateTime).toISOString(),
      Duration: form.duration.trim(),
      Venue: form.venue.trim(),
    });
    const ok = await run(
      () => api(editingId ? `/events/${editingId}` : "/events", { method: editingId ? "PUT" : "POST", body }),
      editingId ? `"${form.title.trim()}" was updated.` : `"${form.title.trim()}" is now published.`
    );
    if (ok) closeForm();
  }

  const setStatus = (ev, Status, text) =>
    run(
      () => api(`/events/${ev.id}`, { method: "PATCH", body: JSON.stringify({ Status }) }),
      `"${ev.title}" ${text}.`
    );

  const remove = (ev) => {
    if (!window.confirm(`Delete "${ev.title}"? Its registrations will be removed too.`)) return;
    if (editingId === ev.id) closeForm();
    return run(() => api(`/events/${ev.id}`, { method: "DELETE" }), `"${ev.title}" was deleted.`);
  };

  return (
    <div>
      <PageHeader
        title="Events"
        subtitle="Create and manage events for students and alumni."
        action={
          <button onClick={showForm ? closeForm : openCreate} className={btnPrimary}>
            <Plus size={16} /> {showForm ? "Close form" : "Create event"}
          </button>
        }
      />
      {message && <Notice>{message}</Notice>}
      {error && <Notice tone="red">{error}</Notice>}

      {showForm && (
        <Card title={editingId ? "Edit event" : "New event"} icon={CalendarDays} className="mb-6">
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Title" required><input className={inputCls} value={form.title} onChange={set("title")} maxLength={200} /></Field>
            <Field label="Venue" required><input className={inputCls} value={form.venue} onChange={set("venue")} maxLength={200} /></Field>
            <Field label="Date and time" required><input type="datetime-local" className={inputCls} value={form.dateTime} onChange={set("dateTime")} /></Field>
            <Field label="Duration"><input className={inputCls} placeholder="e.g. 2 hours" value={form.duration} onChange={set("duration")} maxLength={50} /></Field>
            <div className="md:col-span-2">
              <Field label="Description"><textarea rows={3} className={inputCls} value={form.description} onChange={set("description")} /></Field>
            </div>
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" disabled={busy} className={btnPrimary}>
                {busy ? "Saving..." : editingId ? "Save changes" : "Publish event"}
              </button>
              <button type="button" onClick={closeForm} className={btnOutline}>Cancel</button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f ? "bg-primary text-white" : "border border-gray-300 bg-white text-sidebar hover:bg-gray-50"
            }`}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card><EmptyState message={loaded ? "No events in this category." : "Loading..."} /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {shown.map((e) => {
            const state = stateOf(e);
            return (
              <Card key={e.id}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-sidebar">{e.title}</h3>
                  <Badge tone={tones[state]}>{state}</Badge>
                </div>
                {e.description && <p className="mt-2 text-sm text-text">{e.description}</p>}
                <div className="mt-3 space-y-1 text-xs text-muted">
                  <p className="flex items-center gap-1"><CalendarDays size={12} /> {fmtDateTime(e.dateTime)}</p>
                  {e.duration && <p className="flex items-center gap-1"><Clock size={12} /> {e.duration}</p>}
                  {e.venue && <p className="flex items-center gap-1"><MapPin size={12} /> {e.venue}</p>}
                  <p className="flex items-center gap-1">
                    <Users size={12} /> {e.registrations} registered · posted by {e.postedBy}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                  <button onClick={() => openEdit(e)} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                    <Pencil size={14} /> Edit
                  </button>
                  {state === "Upcoming" && (
                    <button onClick={() => setStatus(e, "Cancelled", "was cancelled")} className="font-medium text-warning hover:underline">
                      Cancel event
                    </button>
                  )}
                  {state === "Cancelled" && (
                    <button onClick={() => setStatus(e, "Published", "was restored")} className="font-medium text-success hover:underline">
                      Restore
                    </button>
                  )}
                  <button onClick={() => remove(e)} className="inline-flex items-center gap-1 text-danger hover:underline">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}