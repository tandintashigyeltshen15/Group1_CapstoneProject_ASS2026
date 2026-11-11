"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Card, Badge, EmptyState, Notice, Field, inputCls, btnPrimary, btnOutline } from "@/components/ui";
import { Modal, Tabs, Table, btnSm, btnSmDanger } from "@/components/AdminUI";

const EMPTY = { title: "", organization: "", deadline: "", duration: "", description: "", eligibility: "" };
const tones = { Open: "green", Filled: "gray" };

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-";

export default function AdminOpportunitiesPage() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState("");
  const [flash, setFlash] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api("/admin-opportunities")
      .then((d) => {
        setItems(d);
        setLoaded(true);
      })
      .catch((err) => {
        setFlash({ tone: "red", text: err.message });
        setLoaded(true);
      });

  useEffect(() => {
    load();
  }, []);

  const byStatus = items.filter((o) => status === "all" || o.status === status);
  const shown = byStatus.filter((o) => type === "all" || o.type === type);
  const types = [...new Set(items.map((o) => o.type))];

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

  const setStatusOf = (o, next) =>
    run(
      () => api(`/admin-opportunities/${o.id}/status`, { method: "PATCH", body: JSON.stringify({ status: next }) }),
      next === "Filled" ? `"${o.title}" was marked as filled.` : `"${o.title}" was reopened.`
    );

  const remove = (o) => {
    if (!window.confirm(`Delete "${o.title}"?`)) return;
    return run(() => api(`/admin-opportunities/${o.id}`, { method: "DELETE" }), `"${o.title}" was deleted.`);
  };

  async function save(e) {
    e.preventDefault();
    setFormError("");
    setBusy(true);
    try {
      await api("/admin-opportunities", {
        method: "POST",
        body: JSON.stringify({ ...form, type: "Internship" }),
      });
      setFlash({ tone: "green", text: `"${form.title}" was posted. Students can see it under Internships.` });
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
        title="Opportunity Management"
        subtitle="See every posting, mark them filled, remove incorrect ones, or post your own."
        action={
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setFormError("");
              setForm(EMPTY);
            }}
          >
            <Plus size={16} /> Post Opportunity
          </button>
        }
      />
      {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}

      <div className="mb-4">
        <Tabs
          value={type}
          onChange={setType}
          tabs={[
            { key: "all", label: "All", count: byStatus.length },
            ...types.map((t) => ({ key: t, label: `${t}s`, count: byStatus.filter((o) => o.type === t).length })),
          ]}
        />
      </div>

      <Card>
        <div className="mb-4">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputCls} !w-auto`} aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option>Open</option>
            <option>Filled</option>
          </select>
        </div>

        <Table
          head={["Title", "Type", "Organisation", "Posted By", "Deadline", "Applicants", "Status", "Actions"]}
          empty={shown.length === 0 && <EmptyState message={loaded ? "No opportunities match your filters." : "Loading..."} />}
        >
          {shown.map((o) => (
            <tr key={o.id}>
              <td className="px-3 py-3">
                <p className="font-medium text-sidebar">{o.title}</p>
                {o.duration && <p className="text-xs text-muted">{o.duration}</p>}
              </td>
              <td className="px-3 py-3 text-text">{o.type}</td>
              <td className="px-3 py-3 text-text">{o.organization}</td>
              <td className="px-3 py-3 text-text">{o.postedBy}</td>
              <td className="whitespace-nowrap px-3 py-3 text-muted">{fmtDate(o.deadline)}</td>
              <td className="px-3 py-3 text-text">{o.applications.length}</td>
              <td className="px-3 py-3"><Badge tone={tones[o.status] || "gray"}>{o.status}</Badge></td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap gap-2">
                  {o.status === "Open" ? (
                    <button type="button" disabled={busy} className={btnSm} onClick={() => setStatusOf(o, "Filled")}>Mark filled</button>
                  ) : (
                    <button type="button" disabled={busy} className={btnSm} onClick={() => setStatusOf(o, "Open")}>Reopen</button>
                  )}
                  <button type="button" disabled={busy} className={btnSmDanger} onClick={() => remove(o)}>Delete</button>
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
              <button type="submit" form="opp-form" disabled={busy} className={`${btnPrimary} disabled:opacity-60`}>
                {busy ? "Posting..." : "Post"}
              </button>
            </>
          }
        >
          <form id="opp-form" onSubmit={save} className="space-y-4">
            <Field label="Title" required><input className={inputCls} value={form.title} onChange={set("title")} maxLength={150} required /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Organisation" required><input className={inputCls} value={form.organization} onChange={set("organization")} maxLength={100} required /></Field>
              <Field label="Deadline" required><input type="date" className={inputCls} value={form.deadline} onChange={set("deadline")} required /></Field>
            </div>
            <Field label="Duration"><input className={inputCls} placeholder="e.g. 3 months" value={form.duration} onChange={set("duration")} maxLength={50} /></Field>
            <Field label="Description" required><textarea rows={3} className={inputCls} value={form.description} onChange={set("description")} required /></Field>
            <Field label="Eligibility requirements"><textarea rows={2} className={inputCls} value={form.eligibility} onChange={set("eligibility")} /></Field>
            {formError && <p className="text-sm text-danger">{formError}</p>}
          </form>
        </Modal>
      )}
    </div>
  );
}