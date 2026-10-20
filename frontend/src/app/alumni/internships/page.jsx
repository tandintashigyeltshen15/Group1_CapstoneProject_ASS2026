"use client";

import { useState } from "react";
import { Plus, Briefcase, Calendar, Clock, Trash2 } from "lucide-react";
import { useStore, update, nextId, addNotification, formatDate } from "@/lib/store";
import { PageHeader, Card, Badge, Field, EmptyState, Notice, inputCls, btnPrimary, btnOutline } from "@/components/ui";

const empty = { title: "", organization: "", description: "", deadline: "", startDate: "", duration: "", eligibilityRequirements: "" };
const tones = { Open: "green", Closed: "gray", Draft: "orange", Cancelled: "red" };

export default function InternshipsPage() {
  const [opps] = useStore("opportunities");
  const [applications] = useStore("applications");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function submit(e) {
    e.preventDefault();
    const today = new Date().toISOString().slice(0, 10);
    if (!form.title.trim() || !form.description.trim() || !form.organization.trim()) {
      return setError("Title, organisation and description are required.");
    }
    if (form.deadline && form.deadline < today) return setError("The deadline cannot be in the past.");
    if (form.startDate && form.deadline && form.startDate < form.deadline) {
      return setError("The start date should be after the application deadline.");
    }
    update("opportunities", (list) => [{ ...form, id: nextId(list), status: "Open" }, ...list]);
    addNotification("Internship", `Your internship "${form.title}" has been posted.`);
    setMessage(`"${form.title}" is now posted.`);
    setForm(empty);
    setError("");
    setShowForm(false);
  }

  const setStatus = (id, status) =>
    update("opportunities", (list) => list.map((o) => (o.id === id ? { ...o, status } : o)));
  const remove = (o) => {
    update("opportunities", (list) => list.filter((x) => x.id !== o.id));
    update("applications", (list) => list.filter((a) => a.opportunityId !== o.id));
    setMessage(`"${o.title}" was deleted.`);
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

      {showForm && (
        <Card title="New internship" icon={Briefcase} className="mb-6">
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {error && <div className="md:col-span-2"><Notice tone="red">{error}</Notice></div>}
            <Field label="Title" required><input className={inputCls} value={form.title} onChange={set("title")} /></Field>
            <Field label="Organisation" required><input className={inputCls} value={form.organization} onChange={set("organization")} /></Field>
            <Field label="Application deadline"><input type="date" className={inputCls} value={form.deadline} onChange={set("deadline")} /></Field>
            <Field label="Start date"><input type="date" className={inputCls} value={form.startDate} onChange={set("startDate")} /></Field>
            <Field label="Duration"><input className={inputCls} placeholder="e.g. 3 months" value={form.duration} onChange={set("duration")} /></Field>
            <div />
            <div className="md:col-span-2">
              <Field label="Description" required><textarea rows={3} className={inputCls} value={form.description} onChange={set("description")} /></Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Eligibility requirements"><textarea rows={2} className={inputCls} value={form.eligibilityRequirements} onChange={set("eligibilityRequirements")} /></Field>
            </div>
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" className={btnPrimary}>Post internship</button>
              <button type="button" onClick={() => { setShowForm(false); setError(""); }} className={btnOutline}>Cancel</button>
            </div>
          </form>
        </Card>
      )}

      {opps.length === 0 ? (
        <Card><EmptyState message="You haven't posted any internships yet." /></Card>
      ) : (
        <div className="space-y-4">
          {opps.map((o) => {
            const count = applications.filter((a) => a.opportunityId === o.id).length;
            return (
              <Card key={o.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-sidebar">{o.title}</h3>
                    <p className="text-sm text-muted">{o.organization}</p>
                  </div>
                  <Badge tone={tones[o.status]}>{o.status}</Badge>
                </div>
                <p className="mt-3 text-sm text-text">{o.description}</p>
                {o.eligibilityRequirements && (
                  <p className="mt-2 text-xs text-muted"><b>Eligibility:</b> {o.eligibilityRequirements}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
                  {o.deadline && <span className="flex items-center gap-1"><Calendar size={12} /> Apply by {formatDate(o.deadline)}</span>}
                  {o.startDate && <span className="flex items-center gap-1"><Calendar size={12} /> Starts {formatDate(o.startDate)}</span>}
                  {o.duration && <span className="flex items-center gap-1"><Clock size={12} /> {o.duration}</span>}
                  <span>{count} applicant{count === 1 ? "" : "s"}</span>
                </div>
                <div className="mt-4 flex gap-3 text-sm">
                  {o.status === "Open" ? (
                    <button onClick={() => setStatus(o.id, "Closed")} className="font-medium text-warning hover:underline">Close applications</button>
                  ) : (
                    <button onClick={() => setStatus(o.id, "Open")} className="font-medium text-success hover:underline">Reopen</button>
                  )}
                  <button onClick={() => remove(o)} className="inline-flex items-center gap-1 text-danger hover:underline">
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
