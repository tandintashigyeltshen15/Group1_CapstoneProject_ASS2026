"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Mail, Briefcase, MapPin, GraduationCap, Pencil } from "lucide-react";
import { useStore, update } from "@/lib/store";
import { PageHeader, Card, Badge, Field, Toggle, EmptyState, Notice, inputCls, btnPrimary, btnOutline } from "@/components/ui";

const unique = (arr) => [...new Set(arr.filter(Boolean))].sort();

function Directory({ initialSearch }) {
  const [alumni] = useStore("alumniDirectory");
  const [query, setQuery] = useState(initialSearch);
  const [programme, setProgramme] = useState("All");
  const [year, setYear] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const programmes = unique(alumni.map((a) => a.programme));
  const years = unique(alumni.map((a) => String(a.graduationYear))).reverse();
  const q = query.trim().toLowerCase();
  const shown = alumni.filter(
    (a) =>
      (programme === "All" || a.programme === programme) &&
      (year === "All" || String(a.graduationYear) === year) &&
      (!q || [a.name, a.jobTitle, a.company, a.expertise, a.location].some((v) => (v ?? "").toLowerCase().includes(q)))
  );

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function startEdit(a) {
    setEditingId(a.id);
    setForm({ ...a, graduationYear: String(a.graduationYear) });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(null);
    setError("");
  }

  function save(e) {
    e.preventDefault();
    const y = Number(form.graduationYear);
    if (!form.name.trim() || !form.email.trim()) return setError("Name and email are required.");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Enter a valid email address.");
    if (!Number.isInteger(y) || y < 1980 || y > new Date().getFullYear()) return setError("Enter a valid graduation year.");
    update("alumniDirectory", (list) =>
      list.map((a) => (a.id === editingId ? { ...form, graduationYear: y, name: form.name.trim(), email: form.email.trim() } : a))
    );
    setMessage(`${form.name.trim()}'s record was updated.`);
    cancelEdit();
  }

  return (
    <div>
      <PageHeader
        title="Alumni Directory"
        subtitle="Search and view alumni academic and professional information, and correct records when needed."
      />
      {message && <Notice>{message}</Notice>}

      {form && (
        <Card title={`Edit ${form.name || "alumni record"}`} icon={Pencil} className="mb-6">
          <form onSubmit={save} noValidate className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {error && <div className="md:col-span-2"><Notice tone="red">{error}</Notice></div>}
            <Field label="Full name" required><input className={inputCls} value={form.name} onChange={set("name")} /></Field>
            <Field label="Email" required><input type="email" className={inputCls} value={form.email} onChange={set("email")} /></Field>
            <Field label="Programme"><input className={inputCls} value={form.programme} onChange={set("programme")} /></Field>
            <Field label="Graduation year"><input type="number" className={inputCls} value={form.graduationYear} onChange={set("graduationYear")} /></Field>
            <Field label="Job title"><input className={inputCls} value={form.jobTitle} onChange={set("jobTitle")} /></Field>
            <Field label="Company"><input className={inputCls} value={form.company} onChange={set("company")} /></Field>
            <Field label="Location"><input className={inputCls} value={form.location} onChange={set("location")} /></Field>
            <Field label="Area of expertise"><input className={inputCls} value={form.expertise} onChange={set("expertise")} /></Field>
            <div className="md:col-span-2">
              <Field label="Bio"><textarea rows={2} className={inputCls} value={form.bio} onChange={set("bio")} /></Field>
            </div>
            <div className="md:col-span-2">
              <Toggle checked={form.isMentor} onChange={(v) => setForm({ ...form, isMentor: v })} label="Available as a mentor" />
            </div>
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" className={btnPrimary}>Save changes</button>
              <button type="button" onClick={cancelEdit} className={btnOutline}>Cancel</button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            aria-label="Search alumni"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, job, company, expertise or location"
            className={inputCls + " !pl-9"}
          />
        </div>
        <select aria-label="Filter by programme" className={inputCls + " md:!w-auto"} value={programme} onChange={(e) => setProgramme(e.target.value)}>
          <option value="All">All programmes</option>
          {programmes.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select aria-label="Filter by graduation year" className={inputCls + " md:!w-auto"} value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="All">All years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <p className="mb-4 text-sm text-muted">Showing {shown.length} of {alumni.length} alumni</p>

      {shown.length === 0 ? (
        <Card><EmptyState message="No alumni match your search." /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {shown.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-sidebar">{a.name}</h3>
                  <p className="flex items-center gap-1 text-sm text-muted">
                    <GraduationCap size={14} /> {a.programme}, class of {a.graduationYear}
                  </p>
                </div>
                {a.isMentor && <Badge tone="green">Mentor</Badge>}
              </div>
              <div className="mt-3 space-y-1 text-sm text-text">
                {(a.jobTitle || a.company) && (
                  <p className="flex items-center gap-2">
                    <Briefcase size={14} className="text-muted" />
                    {[a.jobTitle, a.company].filter(Boolean).join(" at ")}
                  </p>
                )}
                {a.location && <p className="flex items-center gap-2"><MapPin size={14} className="text-muted" /> {a.location}</p>}
                <p className="flex items-center gap-2"><Mail size={14} className="text-muted" /> {a.email}</p>
                {a.expertise && <p className="text-xs text-muted">Expertise: {a.expertise}</p>}
                {a.bio && <p className="text-xs text-muted">{a.bio}</p>}
              </div>
              <button onClick={() => startEdit(a)} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                <Pencil size={14} /> Edit record
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// The top-bar search sends staff here as /staff/alumni?search=...
// Keying on the search text re-starts the page with that text filled in.
function SearchAwareDirectory() {
  const search = useSearchParams().get("search") ?? "";
  return <Directory key={search} initialSearch={search} />;
}

export default function StaffAlumniPage() {
  return (
    <Suspense fallback={null}>
      <SearchAwareDirectory />
    </Suspense>
  );
}