"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader, Card, Badge, EmptyState, Notice, Field, inputCls, btnPrimary, btnOutline } from "@/components/ui";
import { useStore, update, nextId, formatDate } from "@/lib/store";
import { Modal, Tabs, Table, statusTone, btnSm, btnSmDanger, btnSmSuccess } from "@/components/AdminUI";

const EMPTY = { title: "", type: "Job", company: "", location: "", deadline: "", description: "" };

export default function AdminOpportunitiesPage() {
  const [items] = useStore("adminOpportunities");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [form, setForm] = useState(null);
  const [flash, setFlash] = useState(null);

  const byStatus = items.filter((o) => status === "all" || o.status === status);
  const shown = byStatus.filter((o) => type === "all" || o.type === type);

  const setStatusOf = (o, next, text) => {
    update("adminOpportunities", (list) => list.map((x) => (x.id === o.id ? { ...x, status: next } : x)));
    setFlash({ tone: next === "Rejected" ? "red" : "green", text });
  };

  const remove = (o) => {
    if (!window.confirm(`Delete "${o.title}"?`)) return;
    update("adminOpportunities", (list) => list.filter((x) => x.id !== o.id));
    setFlash({ tone: "red", text: `"${o.title}" was deleted.` });
  };

  const save = (e) => {
    e.preventDefault();
    update("adminOpportunities", (list) => [
      { id: nextId(list), ...form, postedBy: "Admin", status: "Approved" },
      ...list,
    ]);
    setFlash({ tone: "green", text: `"${form.title}" was posted.` });
    setForm(null);
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <PageHeader
        title="Opportunity Management"
        subtitle="Approve jobs and internships posted by alumni, or post your own."
        action={<button type="button" className={btnPrimary} onClick={() => setForm(EMPTY)}><Plus size={16} /> Post Opportunity</button>}
      />
      {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}

      <div className="mb-4">
        <Tabs
          value={type}
          onChange={setType}
          tabs={[
            { key: "all", label: "All", count: byStatus.length },
            { key: "Job", label: "Jobs", count: byStatus.filter((o) => o.type === "Job").length },
            { key: "Internship", label: "Internships", count: byStatus.filter((o) => o.type === "Internship").length },
          ]}
        />
      </div>

      <Card>
        <div className="mb-4">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputCls} !w-auto`} aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option>Approved</option>
            <option>Pending</option>
            <option>Rejected</option>
            <option>Closed</option>
          </select>
        </div>

        <Table
          head={["Title", "Type", "Company", "Posted By", "Deadline", "Status", "Actions"]}
          empty={shown.length === 0 && <EmptyState message="No opportunities match your filters." />}
        >
          {shown.map((o) => (
            <tr key={o.id}>
              <td className="px-3 py-3">
                <p className="font-medium text-sidebar">{o.title}</p>
                <p className="text-xs text-muted">{o.location}</p>
              </td>
              <td className="px-3 py-3 text-text">{o.type}</td>
              <td className="px-3 py-3 text-text">{o.company}</td>
              <td className="px-3 py-3 text-text">{o.postedBy}</td>
              <td className="whitespace-nowrap px-3 py-3 text-muted">{formatDate(o.deadline)}</td>
              <td className="px-3 py-3"><Badge tone={statusTone[o.status]}>{o.status}</Badge></td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap gap-2">
                  {o.status === "Pending" && (
                    <>
                      <button type="button" className={btnSmSuccess} onClick={() => setStatusOf(o, "Approved", `"${o.title}" was approved.`)}>Approve</button>
                      <button type="button" className={btnSmDanger} onClick={() => setStatusOf(o, "Rejected", `"${o.title}" was rejected.`)}>Reject</button>
                    </>
                  )}
                  {o.status === "Approved" && (
                    <button type="button" className={btnSm} onClick={() => setStatusOf(o, "Closed", `"${o.title}" was closed.`)}>Close</button>
                  )}
                  {o.status === "Closed" && (
                    <button type="button" className={btnSm} onClick={() => setStatusOf(o, "Approved", `"${o.title}" was reopened.`)}>Reopen</button>
                  )}
                  <button type="button" className={btnSmDanger} onClick={() => remove(o)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {form && (
        <Modal
          title="Post Opportunity"
          onClose={() => setForm(null)}
          footer={
            <>
              <button type="button" className={btnOutline} onClick={() => setForm(null)}>Cancel</button>
              <button type="submit" form="opp-form" className={btnPrimary}>Post</button>
            </>
          }
        >
          <form id="opp-form" onSubmit={save} className="space-y-4">
            <Field label="Title" required><input className={inputCls} value={form.title} onChange={set("title")} required /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type">
                <select className={inputCls} value={form.type} onChange={set("type")}>
                  <option>Job</option>
                  <option>Internship</option>
                </select>
              </Field>
              <Field label="Deadline" required><input type="date" className={inputCls} value={form.deadline} onChange={set("deadline")} required /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Company" required><input className={inputCls} value={form.company} onChange={set("company")} required /></Field>
              <Field label="Location" required><input className={inputCls} value={form.location} onChange={set("location")} required /></Field>
            </div>
            <Field label="Description"><textarea rows={3} className={inputCls} value={form.description} onChange={set("description")} /></Field>
          </form>
        </Modal>
      )}
    </div>
  );
}
