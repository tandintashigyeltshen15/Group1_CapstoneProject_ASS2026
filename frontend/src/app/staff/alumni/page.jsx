"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Search, Mail, Briefcase, GraduationCap, Pencil } from "lucide-react";
import { PageHeader, Card, Badge, Field, Toggle, EmptyState, Notice, inputCls, btnPrimary, btnOutline } from "@/components/ui";

const unique = (arr) => [...new Set(arr.filter(Boolean))].sort();

function Directory({ initialSearch }) {
  const [alumni, setAlumni] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState(initialSearch);
  const [programme, setProgramme] = useState("All");
  const [year, setYear] = useState("All");
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () =>
    api("/staff/alumni")
      .then((d) => {
        setAlumni(d.alumni);
        setProgrammes(d.programmes);
        setLoaded(true);
      })
      .catch((err) => {
        setError(err.message);
        setLoaded(true);
      });

  useEffect(() => {
    load();
  }, []);

  const programmeNames = unique(alumni.map((a) => a.programme));
  const years = unique(alumni.map((a) => String(a.graduationYear))).reverse();
  const q = query.trim().toLowerCase();
  const shown = alumni.filter(
    (a) =>
      (programme === "All" || a.programme === programme) &&
      (year === "All" || String(a.graduationYear) === year) &&
      (!q || [a.name, a.jobTitle, a.company, a.expertise].some((v) => (v ?? "").toLowerCase().includes(q)))
  );

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function startEdit(a) {
    setForm({
      id: a.id,
      name: a.name,
      programmeId: String(a.programmeId),
      graduationYear: String(a.graduationYear),
      expertise: a.expertise,
      bio: a.bio,
      isMentor: a.isMentor,
    });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setForm(null);
    setError("");
  }

  async function save(e) {
    e.preventDefault();
    const y = Number(form.graduationYear);
    if (!form.name.trim()) return setError("Name is required.");
    if (!Number.isInteger(y) || y < 1980 || y > new Date().getFullYear()) {
      return setError("Enter a valid graduation year.");
    }
    setError("");
    setSaving(true);
    try {
      await api(`/staff/alumni/${form.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          programmeId: Number(form.programmeId),
          graduationYear: y,
          expertise: form.expertise,
          bio: form.bio,
          isMentor: form.isMentor,
        }),
      });
      setMessage(`${form.name.trim()}'s record was updated.`);
      setForm(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Alumni Directory"
        subtitle="Search and view alumni academic and professional information, and correct records when needed."
      />
      {message && <Notice>{message}</Notice>}
      {error && !form && <Notice tone="red">{error}</Notice>}

      {form && (
        <Card title={`Edit ${form.name || "alumni record"}`} icon={Pencil} className="mb-6">
          <form onSubmit={save} noValidate className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {error && <div className="md:col-span-2"><Notice tone="red">{error}</Notice></div>}
            <Field label="Full name" required><input className={inputCls} value={form.name} onChange={set("name")} maxLength={50} /></Field>
            <Field label="Programme">
              <select className={inputCls} value={form.programmeId} onChange={set("programmeId")}>
                {programmes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Graduation year"><input type="number" className={inputCls} value={form.graduationYear} onChange={set("graduationYear")} /></Field>
            <Field label="Area of expertise"><input className={inputCls} value={form.expertise} onChange={set("expertise")} maxLength={255} /></Field>
            <div className="md:col-span-2">
              <Field label="Professional background"><textarea rows={2} className={inputCls} value={form.bio} onChange={set("bio")} /></Field>
            </div>
            <div className="md:col-span-2">
              <Toggle checked={form.isMentor} onChange={(v) => setForm({ ...form, isMentor: v })} label="Available as a mentor" />
            </div>
            <p className="text-xs text-muted md:col-span-2">
              Email and job history belong to the alumnus and can only be changed by them.
            </p>
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" disabled={saving} className={btnPrimary}>{saving ? "Saving..." : "Save changes"}</button>
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
            placeholder="Search by name, job, company or expertise"
            className={inputCls + " !pl-9"}
          />
        </div>
        <select aria-label="Filter by programme" className={inputCls + " md:!w-auto"} value={programme} onChange={(e) => setProgramme(e.target.value)}>
          <option value="All">All programmes</option>
          {programmeNames.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select aria-label="Filter by graduation year" className={inputCls + " md:!w-auto"} value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="All">All years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <p className="mb-4 text-sm text-muted">Showing {shown.length} of {alumni.length} alumni</p>

      {shown.length === 0 ? (
        <Card>
          <EmptyState
            message={!loaded ? "Loading..." : alumni.length === 0 ? "No verified alumni yet." : "No alumni match your search."}
          />
        </Card>
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
                <div className="flex gap-2">
                  {!a.isPublic && <Badge tone="gray">Private</Badge>}
                  {a.isMentor && <Badge tone="green">Mentor</Badge>}
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm text-text">
                {(a.jobTitle || a.company) && (
                  <p className="flex items-center gap-2">
                    <Briefcase size={14} className="text-muted" />
                    {[a.jobTitle, a.company].filter(Boolean).join(" at ")}
                  </p>
                )}
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