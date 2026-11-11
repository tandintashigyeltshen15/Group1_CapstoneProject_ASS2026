"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Card, Badge, EmptyState, Notice, Field, inputCls, btnPrimary, btnOutline } from "@/components/ui";
import { Modal, Tabs, Table, btnSm, btnSmDanger } from "@/components/AdminUI";

const EMPTY = { id: null, title: "", venue: "", dateTime: "", duration: "", description: "" };
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
  organizer: e.user?.Name || "",
});

const stateOf = (e) =>
  e.status === "Cancelled" ? "Cancelled" : new Date(e.dateTime) < new Date() ? "Completed" : "Upcoming";

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("all");
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState("");
  const [flash, setFlash] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api("/events")
      .then((d) => {
        setEvents(d.map(mapEvent));
        setLoaded(true);
      })
      .catch((err) => {
        setFlash({ tone: "red", text: err.message });
        setLoaded(true);
      });

  useEffect(() => {
    load();
  }, []);

  const count = (s) => events.filter((e) => stateOf(e) === s).length;
  const shown = (tab === "all" ? events : events.filter((e) => stateOf(e) === tab))
    .slice()
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

  async function run(action, successText) {
    setBusy(true);
    setFlash(null);
    try {
      await action();
      setFlash({ tone: "green", text: successText });
      await load();
      return true;
    } catch (err) {
      setFlash({ tone: "red", text: err.message });
      return false;
    } finally {
      setBusy(false);
    }
  }

  const setStatusOf = (e, Status, text) =>
    run(() => api(`/events/${e.id}`, { method: "PATCH", body: JSON.stringify({ Status }) }), text);

  const remove = (e) => {
    if (!window.confirm(`Delete "${e.title}"? Its registrations will be removed too.`)) return;
    return run(() => api(`/events/${e.id}`, { method: "DELETE" }), `"${e.title}" was deleted.`);
  };

  const openEdit = (e) => {
    setFormError("");
    setForm({
      id: e.id,
      title: e.title,
      venue: e.venue,
      dateTime: toInput(e.dateTime),
      duration: e.duration,
      description: e.description,
    });
  };

  async function save(ev) {
    ev.preventDefault();
    setFormError("");

    const body = {
      Title: form.title.trim(),
      Venue: form.venue.trim(),
      DateTime: new Date(form.dateTime).toISOString(),
    };
    if (form.duration.trim()) body.Duration = form.duration.trim();
    if (form.description.trim()) body.Description = form.description.trim();

    setBusy(true);
    try {
      await api(form.id ? `/events/${form.id}` : "/events", {
        method: form.id ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      setFlash({
        tone: "green",
        text: form.id ? `"${body.Title}" was updated.` : `"${body.Title}" was created and published.`,
      });
      setForm(null);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <PageHeader
        title="Events Management"
        subtitle="See every event, correct or cancel them, or create your own."
        action={
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setFormError("");
              setForm(EMPTY);
            }}
          >
            <Plus size={16} /> Create Event
          </button>
        }
      />
      {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}

      <div className="mb-4">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "all", label: "All", count: events.length },
            { key: "Upcoming", label: "Upcoming", count: count("Upcoming") },
            { key: "Completed", label: "Completed", count: count("Completed") },
            { key: "Cancelled", label: "Cancelled", count: count("Cancelled") },
          ]}
        />
      </div>

      <Card>
        <Table
          head={["Event", "Organizer", "Venue", "Date & Time", "Registered", "Status", "Actions"]}
          empty={shown.length === 0 && <EmptyState message={loaded ? "No events in this view." : "Loading..."} />}
        >
          {shown.map((e) => {
            const state = stateOf(e);
            return (
              <tr key={e.id}>
                <td className="px-3 py-3 font-medium text-sidebar">{e.title}</td>
                <td className="px-3 py-3 text-text">{e.organizer}</td>
                <td className="px-3 py-3 text-text">{e.venue || "-"}</td>
                <td className="whitespace-nowrap px-3 py-3 text-text">{fmtDateTime(e.dateTime)}</td>
                <td className="px-3 py-3 text-text">{e.registrations}</td>
                <td className="px-3 py-3"><Badge tone={tones[state]}>{state}</Badge></td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={busy} className={btnSm} onClick={() => openEdit(e)}>Edit</button>
                    {state === "Upcoming" && (
                      <button type="button" disabled={busy} className={btnSm} onClick={() => setStatusOf(e, "Cancelled", `"${e.title}" was cancelled.`)}>
                        Cancel event
                      </button>
                    )}
                    {state === "Cancelled" && (
                      <button type="button" disabled={busy} className={btnSm} onClick={() => setStatusOf(e, "Published", `"${e.title}" was restored.`)}>
                        Restore
                      </button>
                    )}
                    <button type="button" disabled={busy} className={btnSmDanger} onClick={() => remove(e)}>Delete</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>

      {form && (
        <Modal
          title={form.id ? "Edit Event" : "Create Event"}
          onClose={() => setForm(null)}
          footer={
            <>
              <button type="button" className={btnOutline} onClick={() => setForm(null)}>Cancel</button>
              <button type="submit" form="event-form" disabled={busy} className={`${btnPrimary} disabled:opacity-60`}>
                {busy ? "Saving..." : form.id ? "Save changes" : "Create"}
              </button>
            </>
          }
        >
          <form id="event-form" onSubmit={save} className="space-y-4">
            <Field label="Title" required><input className={inputCls} value={form.title} onChange={set("title")} maxLength={200} required /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date & time" required><input type="datetime-local" className={inputCls} value={form.dateTime} onChange={set("dateTime")} required /></Field>
              <Field label="Duration"><input className={inputCls} placeholder="e.g. 2 hours" value={form.duration} onChange={set("duration")} maxLength={50} /></Field>
            </div>
            <Field label="Venue" required><input className={inputCls} value={form.venue} onChange={set("venue")} maxLength={200} required /></Field>
            <Field label="Description"><textarea rows={3} className={inputCls} value={form.description} onChange={set("description")} /></Field>
            {formError && <p className="text-sm text-danger">{formError}</p>}
          </form>
        </Modal>
      )}
    </div>
  );
}