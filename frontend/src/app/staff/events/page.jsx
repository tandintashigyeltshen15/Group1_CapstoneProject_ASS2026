"use client";

import { useState } from "react";
import { Plus, CalendarDays, MapPin, Clock, Trash2, Pencil } from "lucide-react";
import { useStore, update, nextId, addStaffNotification, formatDateTime } from "@/lib/store";
import { PageHeader, Card, Badge, Field, EmptyState, Notice, inputCls, btnPrimary, btnOutline } from "@/components/ui";

const empty = { title: "", description: "", dateTime: "", duration: "", venue: "" };
const FILTERS = ["All", "Upcoming", "Completed", "Cancelled"];

const isPast = (e) => e.status === "Completed" || new Date(e.dateTime) < new Date();
const stateOf = (e) => (e.status === "Cancelled" ? "Cancelled" : isPast(e) ? "Completed" : "Upcoming");
const tones = { Upcoming: "blue", Completed: "gray", Cancelled: "red" };

export default function StaffEventsPage() {
  const [events] = useStore("events");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("All");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === "All" ? events.length : events.filter((e) => stateOf(e) === f).length;
    return acc;
  }, {});
  const shown = (filter === "All" ? events : events.filter((e) => stateOf(e) === filter))
    .slice()
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

  function openCreate() {
    setEditingId(null);
    setForm(empty);
    setError("");
    setShowForm(true);
  }

  function openEdit(ev) {
    setEditingId(ev.id);
    setForm({ title: ev.title, description: ev.description ?? "", dateTime: ev.dateTime, duration: ev.duration ?? "", venue: ev.venue ?? "" });
    setError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(empty);
    setError("");
  }

  function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.venue.trim()) return setError("Title and venue are required.");
    if (!form.dateTime) return setError("Please choose a date and time.");

    if (editingId) {
      update("events", (list) => list.map((x) => (x.id === editingId ? { ...x, ...form } : x)));
      setMessage(`"${form.title}" was updated.`);
    } else {
      if (new Date(form.dateTime) < new Date()) return setError("The event date cannot be in the past.");
      update("events", (list) => [{ ...form, id: nextId(list), status: "Published" }, ...list]);
      addStaffNotification("Event", `"${form.title}" has been scheduled.`);
      setMessage(`"${form.title}" is now published.`);
    }
    closeForm();
  }

  const setStatus = (ev, status, text) => {
    update("events", (list) => list.map((x) => (x.id === ev.id ? { ...x, status } : x)));
    setMessage(`"${ev.title}" ${text}.`);
  };

  const remove = (ev) => {
    update("events", (list) => list.filter((x) => x.id !== ev.id));
    update("registrations", (list) => list.filter((r) => r.eventId !== ev.id));
    if (editingId === ev.id) closeForm();
    setMessage(`"${ev.title}" was deleted.`);
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

      {showForm && (
        <Card title={editingId ? "Edit event" : "New event"} icon={CalendarDays} className="mb-6">
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {error && <div className="md:col-span-2"><Notice tone="red">{error}</Notice></div>}
            <Field label="Title" required><input className={inputCls} value={form.title} onChange={set("title")} /></Field>
            <Field label="Venue" required><input className={inputCls} value={form.venue} onChange={set("venue")} /></Field>
            <Field label="Date and time" required><input type="datetime-local" className={inputCls} value={form.dateTime} onChange={set("dateTime")} /></Field>
            <Field label="Duration"><input className={inputCls} placeholder="e.g. 2 hours" value={form.duration} onChange={set("duration")} /></Field>
            <div className="md:col-span-2">
              <Field label="Description"><textarea rows={3} className={inputCls} value={form.description} onChange={set("description")} /></Field>
            </div>
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" className={btnPrimary}>{editingId ? "Save changes" : "Publish event"}</button>
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
        <Card><EmptyState message="No events in this category." /></Card>
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
                  <p className="flex items-center gap-1"><CalendarDays size={12} /> {formatDateTime(e.dateTime)}</p>
                  {e.duration && <p className="flex items-center gap-1"><Clock size={12} /> {e.duration}</p>}
                  <p className="flex items-center gap-1"><MapPin size={12} /> {e.venue}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                  <button onClick={() => openEdit(e)} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                    <Pencil size={14} /> Edit
                  </button>
                  {state === "Upcoming" && (
                    <button onClick={() => setStatus(e, "Cancelled", "was cancelled")} className="font-medium text-warning hover:underline">Cancel event</button>
                  )}
                  {state === "Cancelled" && (
                    <button onClick={() => setStatus(e, "Published", "was restored")} className="font-medium text-success hover:underline">Restore</button>
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