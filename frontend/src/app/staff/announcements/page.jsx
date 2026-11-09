"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Megaphone, Trash2 } from "lucide-react";
import { PageHeader, Card, Badge, Field, EmptyState, Notice, inputCls, btnPrimary } from "@/components/ui";

const AUDIENCES = ["Everyone", "Students", "Alumni"];
const tones = { Everyone: "blue", Students: "orange", Alumni: "green" };
const toApi = (a) => (a === "Everyone" ? "All" : a);
const toLabel = (a) => (a === "All" ? "Everyone" : a);
const empty = { title: "", message: "", audience: "Everyone" };

const fmtDateTime = (d) =>
  new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function StaffAnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const load = () =>
    api("/announcements")
      .then((d) => {
        setItems(d);
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

  async function publish(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return setError("Title and message are required.");
    setError("");
    setMessage("");
    setSending(true);
    try {
      const res = await api("/announcements", {
        method: "POST",
        body: JSON.stringify({ title: form.title, message: form.message, audience: toApi(form.audience) }),
      });
      setMessage(res.message);
      setForm(empty);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function remove(a) {
    if (!window.confirm(`Remove "${a.title}"? People who already got the notification keep it.`)) return;
    setError("");
    try {
      await api(`/announcements/${a.id}`, { method: "DELETE" });
      setMessage(`"${a.title}" was removed.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <PageHeader title="Announcements" subtitle="Publish portal-wide updates for students and alumni." />
      {message && <Notice>{message}</Notice>}
      {error && <Notice tone="red">{error}</Notice>}

      <Card title="New announcement" icon={Megaphone} className="mb-6">
        <form onSubmit={publish} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Title" required>
            <input className={inputCls} value={form.title} onChange={set("title")} maxLength={150} />
          </Field>
          <Field label="Audience">
            <select className={inputCls} value={form.audience} onChange={set("audience")}>
              {AUDIENCES.map((a) => <option key={a}>{a}</option>)}
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Message" required>
              <textarea rows={3} className={inputCls} value={form.message} onChange={set("message")} maxLength={2000} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={sending} className={btnPrimary}>
              {sending ? "Sending..." : "Publish announcement"}
            </button>
          </div>
        </form>
      </Card>

      {items.length === 0 ? (
        <Card><EmptyState message={loaded ? "No announcements yet." : "Loading..."} /></Card>
      ) : (
        <div className="space-y-4">
          {items.map((a) => (
            <Card key={a.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-sidebar">{a.title}</h3>
                  <p className="text-xs text-muted">{fmtDateTime(a.date)} · {a.postedBy}</p>
                </div>
                <Badge tone={tones[toLabel(a.audience)]}>{toLabel(a.audience)}</Badge>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-text">{a.message}</p>
              {a.mine && (
                <button onClick={() => remove(a)} className="mt-3 inline-flex items-center gap-1 text-sm text-danger hover:underline">
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}