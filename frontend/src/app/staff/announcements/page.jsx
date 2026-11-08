"use client";

import { useState } from "react";
import { Megaphone, Trash2 } from "lucide-react";
import { useStore, update, nextId, addNotification, formatDateTime } from "@/lib/store";
import { PageHeader, Card, Badge, Field, EmptyState, Notice, inputCls, btnPrimary } from "@/components/ui";

const AUDIENCES = ["Everyone", "Students", "Alumni"];
const tones = { Everyone: "blue", Students: "orange", Alumni: "green" };
const empty = { title: "", message: "", audience: "Everyone" };

export default function StaffAnnouncementsPage() {
  const [items] = useStore("announcements");
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const sorted = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  function publish(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return setError("Title and message are required.");
    update("announcements", (list) => [
      { id: nextId(list), title: form.title.trim(), message: form.message.trim(), audience: form.audience, createdAt: new Date().toISOString() },
      ...list,
    ]);
    // System-driven notification for alumni (students have their own notification list)
    if (form.audience !== "Students") addNotification("Announcement", form.title.trim());
    setMessage(`"${form.title.trim()}" was published to ${form.audience.toLowerCase()}.`);
    setForm(empty);
    setError("");
  }

  const remove = (a) => {
    update("announcements", (list) => list.filter((x) => x.id !== a.id));
    setMessage(`"${a.title}" was removed.`);
  };

  return (
    <div>
      <PageHeader title="Announcements" subtitle="Publish portal-wide updates for students and alumni." />
      {message && <Notice>{message}</Notice>}

      <Card title="New announcement" icon={Megaphone} className="mb-6">
        <form onSubmit={publish} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {error && <div className="md:col-span-2"><Notice tone="red">{error}</Notice></div>}
          <Field label="Title" required><input className={inputCls} value={form.title} onChange={set("title")} /></Field>
          <Field label="Audience">
            <select className={inputCls} value={form.audience} onChange={set("audience")}>
              {AUDIENCES.map((a) => <option key={a}>{a}</option>)}
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Message" required><textarea rows={3} className={inputCls} value={form.message} onChange={set("message")} /></Field>
          </div>
          <div className="md:col-span-2">
            <button type="submit" className={btnPrimary}>Publish announcement</button>
          </div>
        </form>
      </Card>

      {sorted.length === 0 ? (
        <Card><EmptyState message="No announcements yet." /></Card>
      ) : (
        <div className="space-y-4">
          {sorted.map((a) => (
            <Card key={a.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-sidebar">{a.title}</h3>
                  <p className="text-xs text-muted">{formatDateTime(a.createdAt)}</p>
                </div>
                <Badge tone={tones[a.audience]}>{a.audience}</Badge>
              </div>
              <p className="mt-3 text-sm text-text">{a.message}</p>
              <button onClick={() => remove(a)} className="mt-3 inline-flex items-center gap-1 text-sm text-danger hover:underline">
                <Trash2 size={14} /> Remove
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}