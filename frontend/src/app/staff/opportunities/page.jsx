"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Plus, Briefcase, Calendar, Clock, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { PageHeader, Card, Badge, Field, EmptyState, Notice, inputCls, btnPrimary, btnOutline } from "@/components/ui";

const empty = { title: "", organization: "", type: "Internship", description: "", deadline: "", startDate: "", duration: "", eligibility: "" };
const tones = { Open: "green", Filled: "gray" };
const appTones = { "Under Review": "orange", Shortlisted: "blue", Accepted: "green", "Not Selected": "red" };
const STATUSES = ["Under Review", "Shortlisted", "Accepted", "Not Selected"];
const FILTERS = ["All", "Open", "Filled"];

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function StaffOpportunitiesPage() {
  const [opps, setOpps] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api("/staff/opportunities")
      .then((d) => {
        setOpps(d);
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
  const counts = {
    All: opps.length,
    Open: opps.filter((o) => o.status === "Open").length,
    Filled: opps.filter((o) => o.status === "Filled").length,
  };
  const shown = filter === "All" ? opps : opps.filter((o) => o.status === filter);

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

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.organization.trim()) {
      return setError("Title, organisation and description are required.");
    }
    const ok = await run(
      () => api("/staff/opportunities", { method: "POST", body: JSON.stringify(form) }),
      `"${form.title.trim()}" is now posted.`
    );
    if (ok) {
      setForm(empty);
      setShowForm(false);
    }
  }

  const setStatus = (o, status) =>
    run(
      () => api(`/staff/opportunities/${o.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
      `"${o.title}" is now ${status.toLowerCase()}.`
    );

  const changeStatus = (a, status) =>
    run(
      () => api(`/staff/opportunities/applications/${a.id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
      `${a.studentName}: ${status}. The student was notified.`
    );

  const remove = (o) => {
    if (!window.confirm(`Delete "${o.title}"?`)) return;
    if (expandedId === o.id) setExpandedId(null);
    return run(() => api(`/staff/opportunities/${o.id}`, { method: "DELETE" }), `"${o.title}" was deleted.`);
  };

  return (
    <div>
      <PageHeader
        title="Opportunities"
        subtitle="Post internships and jobs for CST students and track who has applied."
        action={
          <button onClick={() => setShowForm(!showForm)} className={btnPrimary}>
            <Plus size={16} /> {showForm ? "Close form" : "Post opportunity"}
          </button>
        }
      />
      {message && <Notice>{message}</Notice>}
      {error && <Notice tone="red">{error}</Notice>}

      {showForm && (
        <Card title="New opportunity" icon={Briefcase} className="mb-6">
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Title" required><input className={inputCls} value={form.title} onChange={set("title")} maxLength={150} /></Field>
            <Field label="Organisation" required><input className={inputCls} value={form.organization} onChange={set("organization")} maxLength={100} /></Field>
            <Field label="Type">
              <select className={inputCls} value={form.type} onChange={set("type")}>
                <option>Internship</option>
                <option>Job</option>
              </select>
            </Field>
            <Field label="Duration"><input className={inputCls} placeholder="e.g. 3 months" value={form.duration} onChange={set("duration")} maxLength={50} /></Field>
            <Field label="Application deadline"><input type="date" className={inputCls} value={form.deadline} onChange={set("deadline")} /></Field>
            <Field label="Start date"><input type="date" className={inputCls} value={form.startDate} onChange={set("startDate")} /></Field>
            <div className="md:col-span-2">
              <Field label="Description" required><textarea rows={3} className={inputCls} value={form.description} onChange={set("description")} /></Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Eligibility requirements"><textarea rows={2} className={inputCls} value={form.eligibility} onChange={set("eligibility")} /></Field>
            </div>
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" disabled={busy} className={btnPrimary}>{busy ? "Posting..." : "Post opportunity"}</button>
              <button type="button" onClick={() => { setShowForm(false); setError(""); }} className={btnOutline}>Cancel</button>
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
        <Card><EmptyState message={loaded ? "No opportunities in this category." : "Loading..."} /></Card>
      ) : (
        <div className="space-y-4">
          {shown.map((o) => {
            const apps = o.applications;
            const expanded = expandedId === o.id;
            return (
              <Card key={o.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-sidebar">{o.title}</h3>
                    <p className="text-sm text-muted">
                      {o.organization} · {o.type} · Posted by {o.postedBy}
                    </p>
                  </div>
                  <Badge tone={tones[o.status] || "gray"}>{o.status}</Badge>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm text-text">{o.description}</p>
                {o.eligibility && (
                  <p className="mt-2 text-xs text-muted"><b>Eligibility:</b> {o.eligibility}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
                  {o.deadline && <span className="flex items-center gap-1"><Calendar size={12} /> Apply by {fmtDate(o.deadline)}</span>}
                  {o.startDate && <span className="flex items-center gap-1"><Calendar size={12} /> Starts {fmtDate(o.startDate)}</span>}
                  {o.duration && <span className="flex items-center gap-1"><Clock size={12} /> {o.duration}</span>}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                  <button
                    onClick={() => setExpandedId(expanded ? null : o.id)}
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    {apps.length} applicant{apps.length === 1 ? "" : "s"}
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {o.status === "Open" ? (
                    <button onClick={() => setStatus(o, "Filled")} className="font-medium text-warning hover:underline">Mark as filled</button>
                  ) : (
                    <button onClick={() => setStatus(o, "Open")} className="font-medium text-success hover:underline">Reopen</button>
                  )}
                  <button onClick={() => remove(o)} className="inline-flex items-center gap-1 text-danger hover:underline">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>

                {expanded && (
                  <div className="mt-4 rounded-lg bg-gray-50 p-3">
                    {apps.length === 0 ? (
                      <p className="py-2 text-center text-sm text-muted">No applications yet.</p>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {apps.map((a) => (
                          <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                            <div>
                              <p className="text-sm font-medium text-sidebar">{a.studentName}</p>
                              <p className="text-xs text-muted">{a.studentId} · applied {fmtDate(a.appliedAt)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge tone={appTones[a.status] || "gray"}>{a.status}</Badge>
                              <select
                                aria-label={`Update status for ${a.studentName}`}
                                className={inputCls + " !w-auto"}
                                value={a.status}
                                onChange={(e) => changeStatus(a, e.target.value)}
                                disabled={busy}
                              >
                                {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                              </select>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}