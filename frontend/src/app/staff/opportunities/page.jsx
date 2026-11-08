"use client";

import { useState } from "react";
import { Plus, Briefcase, Calendar, Clock, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useStore, update, nextId, addStaffNotification, formatDate } from "@/lib/store";
import { PageHeader, Card, Badge, Field, EmptyState, Notice, inputCls, btnPrimary, btnOutline } from "@/components/ui";

const empty = { title: "", organization: "", type: "Internship", description: "", deadline: "", startDate: "", duration: "", eligibilityRequirements: "" };
const tones = { Open: "green", Closed: "gray", Draft: "orange", Cancelled: "red" };
const appTones = { Submitted: "blue", UnderReview: "orange", Shortlisted: "blue", Accepted: "green", Rejected: "red", Withdrawn: "gray" };
const appLabel = (s) => (s === "UnderReview" ? "Under review" : s);
const STATUSES = ["Submitted", "UnderReview", "Shortlisted", "Accepted", "Rejected"];
const FILTERS = ["All", "Open", "Closed"];

export default function StaffOpportunitiesPage() {
  const [opps] = useStore("opportunities");
  const [applications] = useStore("applications");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("All");
  const [expandedId, setExpandedId] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const appsFor = (id) => applications.filter((a) => a.opportunityId === id);
  const counts = { All: opps.length, Open: opps.filter((o) => o.status === "Open").length, Closed: opps.filter((o) => o.status === "Closed").length };
  const shown = filter === "All" ? opps : opps.filter((o) => o.status === filter);

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
    const { type, ...rest } = form;
    update("opportunities", (list) => [
      { ...rest, opportunityType: type, postedBy: "Staff", id: nextId(list), status: "Open" },
      ...list,
    ]);
    addStaffNotification("Internship", `"${form.title}" has been posted.`);
    setMessage(`"${form.title}" is now posted.`);
    setForm(empty);
    setError("");
    setShowForm(false);
  }

  const setStatus = (id, status) =>
    update("opportunities", (list) => list.map((o) => (o.id === id ? { ...o, status } : o)));

  const changeStatus = (a, status) => {
    update("applications", (list) => list.map((x) => (x.id === a.id ? { ...x, applicationStatus: status } : x)));
    setMessage(`${a.studentName}: ${appLabel(status)}.`);
  };

  const remove = (o) => {
    update("opportunities", (list) => list.filter((x) => x.id !== o.id));
    update("applications", (list) => list.filter((a) => a.opportunityId !== o.id));
    if (expandedId === o.id) setExpandedId(null);
    setMessage(`"${o.title}" was deleted.`);
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

      {showForm && (
        <Card title="New opportunity" icon={Briefcase} className="mb-6">
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {error && <div className="md:col-span-2"><Notice tone="red">{error}</Notice></div>}
            <Field label="Title" required><input className={inputCls} value={form.title} onChange={set("title")} /></Field>
            <Field label="Organisation" required><input className={inputCls} value={form.organization} onChange={set("organization")} /></Field>
            <Field label="Type">
              <select className={inputCls} value={form.type} onChange={set("type")}>
                <option>Internship</option>
                <option>Job</option>
              </select>
            </Field>
            <Field label="Duration"><input className={inputCls} placeholder="e.g. 3 months" value={form.duration} onChange={set("duration")} /></Field>
            <Field label="Application deadline"><input type="date" className={inputCls} value={form.deadline} onChange={set("deadline")} /></Field>
            <Field label="Start date"><input type="date" className={inputCls} value={form.startDate} onChange={set("startDate")} /></Field>
            <div className="md:col-span-2">
              <Field label="Description" required><textarea rows={3} className={inputCls} value={form.description} onChange={set("description")} /></Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Eligibility requirements"><textarea rows={2} className={inputCls} value={form.eligibilityRequirements} onChange={set("eligibilityRequirements")} /></Field>
            </div>
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" className={btnPrimary}>Post opportunity</button>
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
        <Card><EmptyState message="No opportunities in this category." /></Card>
      ) : (
        <div className="space-y-4">
          {shown.map((o) => {
            const apps = appsFor(o.id);
            const expanded = expandedId === o.id;
            return (
              <Card key={o.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-sidebar">{o.title}</h3>
                    <p className="text-sm text-muted">
                      {o.organization}
                      {o.opportunityType ? ` · ${o.opportunityType}` : ""}
                      {o.postedBy ? ` · Posted by ${o.postedBy}` : ""}
                    </p>
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
                    <button onClick={() => setStatus(o.id, "Closed")} className="font-medium text-warning hover:underline">Close applications</button>
                  ) : (
                    <button onClick={() => setStatus(o.id, "Open")} className="font-medium text-success hover:underline">Reopen</button>
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
                              <p className="text-xs text-muted">{a.studentId} · applied {formatDate(a.submissionDate)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge tone={appTones[a.applicationStatus]}>{appLabel(a.applicationStatus)}</Badge>
                              <select
                                aria-label={`Update status for ${a.studentName}`}
                                className={inputCls + " !w-auto"}
                                value={a.applicationStatus}
                                onChange={(e) => changeStatus(a, e.target.value)}
                              >
                                {STATUSES.map((st) => <option key={st} value={st}>{appLabel(st)}</option>)}
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