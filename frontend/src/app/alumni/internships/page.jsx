"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Plus, Briefcase, Calendar, Clock, Trash2, Users } from "lucide-react";
import { PageHeader, Card, Badge, Field, EmptyState, Notice, inputCls, btnPrimary, btnOutline } from "@/components/ui";

const empty = { title: "", organization: "", description: "", deadline: "", startDate: "", duration: "", eligibility: "" };
const tones = { Open: "green", Filled: "gray" };

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// API shape -> page shape
const mapOpp = (o) => ({
  id: o.OpportunityID,
  title: o.Title,
  organization: o.Organization,
  description: o.Description,
  eligibility: o.EligibilityRequirements || "",
  deadline: o.Deadline,
  startDate: o.StartDate,
  duration: o.Duration || "",
  status: o.Status,
  applicants: o._count?.application ?? 0,
});

export default function InternshipsPage() {
  const [opps, setOpps] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    api("/alumni/me/opportunities")
      .then((d) => {
        setOpps(d.map(mapOpp));
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
    const today = new Date().toISOString().slice(0, 10);
    if (!form.title.trim() || !form.description.trim() || !form.organization.trim()) {
      return setError("Title, organisation and description are required.");
    }
    if (form.deadline && form.deadline < today) return setError("The deadline cannot be in the past.");
    if (form.startDate && form.deadline && form.startDate < form.deadline) {
      return setError("The start date should be after the application deadline.");
    }

    // empty optional fields are left out of the request
    const body = {
      Title: form.title.trim(),
      Organization: form.organization.trim(),
      OpportunityType: "Internship",
      Description: form.description.trim(),
    };
    if (form.deadline) body.Deadline = new Date(`${form.deadline}T23:59:00`).toISOString();
    if (form.startDate) body.StartDate = form.startDate;
    if (form.duration.trim()) body.Duration = form.duration.trim();
    if (form.eligibility.trim()) body.EligibilityRequirements = form.eligibility.trim();

    const ok = await run(
      () => api("/alumni/me/opportunities", { method: "POST", body: JSON.stringify(body) }),
      `"${form.title.trim()}" is now posted. Students can see it under Internships.`
    );
    if (ok) {
      setForm(empty);
      setShowForm(false);
    }
  }

  const setStatus = (o, Status) =>
    run(
      () => api(`/alumni/me/opportunities/${o.id}`, { method: "PATCH", body: JSON.stringify({ Status }) }),
      Status === "Filled" ? `"${o.title}" is marked as filled.` : `"${o.title}" is open again.`
    );

  const remove = (o) => {
    if (!window.confirm(`Delete "${o.title}"?`)) return;
    return run(() => api(`/alumni/me/opportunities/${o.id}`, { method: "DELETE" }), `"${o.title}" was deleted.`);
  };

  return (
    <div>
      <PageHeader
        title="Internship Postings"
        subtitle="Post internships for CST students and track applicants."
        action={
          <button onClick={() => setShowForm(!showForm)} className={btnPrimary}>
            <Plus size={16} /> {showForm ? "Close form" : "Post internship"}
          </button>
        }
      />
      {message && <Notice>{message}</Notice>}
      {error && !showForm && <Notice tone="red">{error}</Notice>}

      {showForm && (
        <Card title="New internship" icon={Briefcase} className="mb-6">
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {error && <div className="md:col-span-2"><Notice tone="red">{error}</Notice></div>}
            <Field label="Title" required><input className={inputCls} value={form.title} onChange={set("title")} maxLength={150} /></Field>
            <Field label="Organisation" required><input className={inputCls} value={form.organization} onChange={set("organization")} maxLength={100} /></Field>
            <Field label="Application deadline"><input type="date" className={inputCls} value={form.deadline} onChange={set("deadline")} /></Field>
            <Field label="Start date"><input type="date" className={inputCls} value={form.startDate} onChange={set("startDate")} /></Field>
            <Field label="Duration"><input className={inputCls} placeholder="e.g. 3 months" value={form.duration} onChange={set("duration")} maxLength={50} /></Field>
            <div />
            <div className="md:col-span-2">
              <Field label="Description" required><textarea rows={3} className={inputCls} value={form.description} onChange={set("description")} /></Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Eligibility requirements"><textarea rows={2} className={inputCls} value={form.eligibility} onChange={set("eligibility")} /></Field>
            </div>
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" disabled={busy} className={btnPrimary}>{busy ? "Posting..." : "Post internship"}</button>
              <button type="button" onClick={() => { setShowForm(false); setError(""); }} className={btnOutline}>Cancel</button>
            </div>
          </form>
        </Card>
      )}

      {opps.length === 0 ? (
        <Card><EmptyState message={loaded ? "You haven't posted any internships yet." : "Loading..."} /></Card>
      ) : (
        <div className="space-y-4">
          {opps.map((o) => (
            <Card key={o.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-sidebar">{o.title}</h3>
                  <p className="text-sm text-muted">{o.organization}</p>
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
                <Link href="/alumni/applications" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                  <Users size={14} /> {o.applicants} applicant{o.applicants === 1 ? "" : "s"}
                </Link>
                {o.status === "Open" ? (
                  <button onClick={() => setStatus(o, "Filled")} disabled={busy} className="font-medium text-warning hover:underline disabled:opacity-60">
                    Mark as filled
                  </button>
                ) : (
                  <button onClick={() => setStatus(o, "Open")} disabled={busy} className="font-medium text-success hover:underline disabled:opacity-60">
                    Reopen
                  </button>
                )}
                <button onClick={() => remove(o)} disabled={busy} className="inline-flex items-center gap-1 text-danger hover:underline disabled:opacity-60">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}