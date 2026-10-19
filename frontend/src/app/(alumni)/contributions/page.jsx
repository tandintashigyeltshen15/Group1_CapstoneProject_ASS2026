"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, GraduationCap, Users, Heart, Gift, BookOpen, Briefcase, Star, Calendar } from "lucide-react";
import { useStore, update, nextId, addNotification, formatDate } from "@/lib/store";
import { PageHeader, Card, Field, EmptyState, Notice, inputCls, btnPrimary, btnOutline } from "@/components/ui";

const CATEGORIES = {
  "Financial Support": Heart,
  "Equipment Donation": Gift,
  "Guest Lecture": GraduationCap,
  "Mentoring": Users,
  "Curriculum Support": BookOpen,
  "Recruitment": Briefcase,
  "Other": Star,
};
const NAMES = Object.keys(CATEGORIES);
const blank = { categoryType: NAMES[0], description: "", contributionDate: "" };

export default function ContributionsPage() {
  const [items] = useStore("contributions");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("All");

  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...items].sort((a, b) => b.contributionDate.localeCompare(a.contributionDate));
  const shown = filter === "All" ? sorted : sorted.filter((c) => c.categoryType === filter);
  const thisYear = items.filter((c) => c.contributionDate.startsWith(String(new Date().getFullYear()))).length;
  const usedCategories = [...new Set(items.map((c) => c.categoryType))];

  function openAdd() { setEditingId(null); setForm(blank); setError(""); setShowForm(true); }
  function openEdit(c) {
    setEditingId(c.id);
    setForm({ categoryType: c.categoryType, description: c.description, contributionDate: c.contributionDate });
    setError(""); setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function close() { setShowForm(false); setEditingId(null); setError(""); }

  function save(e) {
    e.preventDefault();
    if (!form.contributionDate) return setError("Choose the date of the contribution.");
    if (form.contributionDate > today) return setError("The date cannot be in the future.");
    if (editingId) {
      update("contributions", (list) => list.map((c) => (c.id === editingId ? { ...c, ...form } : c)));
      setMessage("Contribution updated.");
    } else {
      update("contributions", (list) => [{ ...form, id: nextId(list) }, ...list]);
      addNotification("Contribution", `You added a contribution: ${form.categoryType}.`);
      setMessage("Contribution added.");
    }
    close();
  }

  function remove(c) {
    if (!window.confirm("Delete this contribution?")) return;
    update("contributions", (list) => list.filter((x) => x.id !== c.id));
    setMessage("Contribution deleted.");
  }

  return (
    <div>
      <PageHeader
        title="Contributions"
        subtitle="Ways you have given back to CST and its students."
        action={<button onClick={showForm ? close : openAdd} className={btnPrimary}><Plus size={16} /> {showForm ? "Close form" : "Add contribution"}</button>}
      />
      {message && <Notice>{message}</Notice>}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          ["Total contributions", items.length, "bg-blue-100 text-primary", Heart],
          ["This year", thisYear, "bg-green-100 text-success", Calendar],
          ["Categories", usedCategories.length, "bg-purple-100 text-accent", Star],
        ].map(([label, value, style, Icon]) => (
          <div key={label} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${style}`}><Icon size={26} /></div>
            <div>
              <p className="text-sm font-medium text-sidebar">{label}</p>
              <p className="text-2xl font-bold text-sidebar">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <Card title={editingId ? "Edit contribution" : "New contribution"} icon={Heart} className="mb-6">
          <form onSubmit={save} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {error && <div className="md:col-span-2"><Notice tone="red">{error}</Notice></div>}
            <Field label="Category" required>
              <select className={inputCls} value={form.categoryType} onChange={(e) => setForm({ ...form, categoryType: e.target.value })}>
                {NAMES.map((n) => <option key={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Date" required>
              <input type="date" max={today} className={inputCls} value={form.contributionDate} onChange={(e) => setForm({ ...form, contributionDate: e.target.value })} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Description">
                <textarea rows={3} className={inputCls} placeholder="What did you contribute and how did it help?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
            </div>
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" className={btnPrimary}>{editingId ? "Save changes" : "Add contribution"}</button>
              <button type="button" onClick={close} className={btnOutline}>Cancel</button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {["All", ...usedCategories].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f ? "bg-primary text-white" : "border border-gray-300 bg-white text-sidebar hover:bg-gray-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Card>
        {shown.length === 0 ? (
          <EmptyState message="No contributions yet. Use Add contribution to record your first one." />
        ) : (
          <ul className="divide-y divide-gray-100">
            {shown.map((c) => {
              const Icon = CATEGORIES[c.categoryType] || Star;
              return (
                <li key={c.id} className="flex items-start gap-4 py-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
                    <Icon size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sidebar">{c.categoryType}</p>
                    {c.description && <p className="text-sm text-text">{c.description}</p>}
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted"><Calendar size={12} /> {formatDate(c.contributionDate)}</p>
                  </div>
                  <button onClick={() => openEdit(c)} aria-label="Edit contribution" className="text-muted hover:text-primary"><Pencil size={16} /></button>
                  <button onClick={() => remove(c)} aria-label="Delete contribution" className="text-muted hover:text-danger"><Trash2 size={16} /></button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
