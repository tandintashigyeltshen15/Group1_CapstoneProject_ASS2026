"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader, Card, Badge, EmptyState, Notice, Field, inputCls, btnPrimary, btnOutline } from "@/components/ui";
import { useStore, update, nextId, formatDateTime } from "@/lib/store";
import { Modal, Tabs, Table, statusTone, btnSm, btnSmDanger, btnSmSuccess } from "@/components/AdminUI";

const EMPTY = { title: "", organizer: "Alumni Relations", venue: "", dateTime: "", expected: "" };

export default function AdminEventsPage() {
  const [events] = useStore("adminEvents");
  const [tab, setTab] = useState("all");
  const [form, setForm] = useState(null);
  const [flash, setFlash] = useState(null);

  const count = (s) => events.filter((e) => e.status === s).length;
  const shown = (tab === "all" ? events : events.filter((e) => e.status === tab))
    .slice()
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

  const setStatusOf = (e, next, text) => {
    update("adminEvents", (list) => list.map((x) => (x.id === e.id ? { ...x, status: next } : x)));
    setFlash({ tone: next === "Approved" ? "green" : "red", text });
  };

  const remove = (e) => {
    if (!window.confirm(`Delete "${e.title}"?`)) return;
    update("adminEvents", (list) => list.filter((x) => x.id !== e.id));
    setFlash({ tone: "red", text: `"${e.title}" was deleted.` });
  };

  const save = (e) => {
    e.preventDefault();
    update("adminEvents", (list) => [
      { id: nextId(list), ...form, expected: Number(form.expected) || 0, status: "Approved" },
      ...list,
    ]);
    setFlash({ tone: "green", text: `"${form.title}" was created and published.` });
    setForm(null);
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <PageHeader
        title="Events Management"
        subtitle="Approve events submitted by alumni and staff, or create your own."
        action={<button type="button" className={btnPrimary} onClick={() => setForm(EMPTY)}><Plus size={16} /> Create Event</button>}
      />
      {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}

      <div className="mb-4">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "all", label: "All", count: events.length },
            { key: "Pending", label: "Pending", count: count("Pending") },
            { key: "Approved", label: "Approved", count: count("Approved") },
            { key: "Rejected", label: "Rejected", count: count("Rejected") },
          ]}
        />
      </div>

      <Card>
        <Table
          head={["Event", "Organizer", "Venue", "Date & Time", "Expected", "Status", "Actions"]}
          empty={shown.length === 0 && <EmptyState message="No events in this view." />}
        >
          {shown.map((e) => (
            <tr key={e.id}>
              <td className="px-3 py-3 font-medium text-sidebar">{e.title}</td>
              <td className="px-3 py-3 text-text">{e.organizer}</td>
              <td className="px-3 py-3 text-text">{e.venue}</td>
              <td className="whitespace-nowrap px-3 py-3 text-text">{formatDateTime(e.dateTime)}</td>
              <td className="px-3 py-3 text-text">{e.expected || "-"}</td>
              <td className="px-3 py-3"><Badge tone={statusTone[e.status]}>{e.status}</Badge></td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap gap-2">
                  {e.status === "Pending" && (
                    <>
                      <button type="button" className={btnSmSuccess} onClick={() => setStatusOf(e, "Approved", `"${e.title}" was approved.`)}>Approve</button>
                      <button type="button" className={btnSmDanger} onClick={() => setStatusOf(e, "Rejected", `"${e.title}" was rejected.`)}>Reject</button>
                    </>
                  )}
                  {e.status === "Approved" && (
                    <button type="button" className={btnSm} onClick={() => setStatusOf(e, "Cancelled", `"${e.title}" was cancelled.`)}>Cancel event</button>
                  )}
                  <button type="button" className={btnSmDanger} onClick={() => remove(e)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {form && (
        <Modal
          title="Create Event"
          onClose={() => setForm(null)}
          footer={
            <>
              <button type="button" className={btnOutline} onClick={() => setForm(null)}>Cancel</button>
              <button type="submit" form="event-form" className={btnPrimary}>Create</button>
            </>
          }
        >
          <form id="event-form" onSubmit={save} className="space-y-4">
            <Field label="Title" required><input className={inputCls} value={form.title} onChange={set("title")} required /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date & time" required><input type="datetime-local" className={inputCls} value={form.dateTime} onChange={set("dateTime")} required /></Field>
              <Field label="Expected attendees"><input type="number" min="0" className={inputCls} value={form.expected} onChange={set("expected")} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Venue" required><input className={inputCls} value={form.venue} onChange={set("venue")} required /></Field>
              <Field label="Organizer" required><input className={inputCls} value={form.organizer} onChange={set("organizer")} required /></Field>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
