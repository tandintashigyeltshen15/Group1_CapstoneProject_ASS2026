"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Plus, Trash2, Pencil, Mail, MapPin, GraduationCap, BadgeCheck, Globe, Link2,
  BookOpen, Heart, Briefcase, ArrowRight,
} from "lucide-react";
import { useStore, update, nextId, formatDate, formatMonthYear, durationText, SEEDS } from "@/lib/store";
import { Card, Badge, Field, EmptyState, Notice, inputCls, btnPrimary, btnOutline } from "@/components/ui";

const PUB_TYPES = ["Journal Article", "Conference Paper", "Book Chapter", "Report", "Other"];
const range = (a, b) => [a && formatDate(a), b ? formatDate(b) : a ? "Present" : ""].filter(Boolean).join(" - ");

const SECTIONS = {
  publications: {
    tab: "Publications", empty: "No publications added yet.",
    fields: [
      { name: "title", label: "Title", required: true },
      { name: "publicationType", label: "Type", type: "select", options: PUB_TYPES, required: true },
      { name: "publicationDate", label: "Publication date", type: "date" },
    ],
    title: (i) => i.title, sub: (i) => i.publicationType, meta: (i) => formatDate(i.publicationDate),
  },
  projects: {
    tab: "Projects", empty: "No projects added yet.",
    fields: [
      { name: "title", label: "Title", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "startDate", label: "Start date", type: "date" },
      { name: "endDate", label: "End date", type: "date" },
      { name: "fundingAgency", label: "Funding agency" },
    ],
    title: (i) => i.title, sub: (i) => i.description, meta: (i) => [range(i.startDate, i.endDate), i.fundingAgency].filter(Boolean).join(" | "),
    validate: (f) => (f.startDate && f.endDate && f.endDate < f.startDate ? "End date cannot be before the start date." : ""),
  },
};

/* ------------------------- generic add/delete list ------------------------- */
function SectionManager({ storeKey }) {
  const cfg = SECTIONS[storeKey];
  const [items, setItems] = useStore(storeKey);
  const blank = Object.fromEntries(cfg.fields.map((f) => [f.name, f.type === "select" ? f.options[0] : ""]));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");

  function save(e) {
    e.preventDefault();
    const missing = cfg.fields.find((f) => f.required && !String(form[f.name]).trim());
    if (missing) return setError(`${missing.label} is required.`);
    const problem = cfg.validate?.(form);
    if (problem) return setError(problem);
    setItems((list) => [{ ...form, id: nextId(list) }, ...list]);
    setForm(blank); setError(""); setOpen(false);
  }

  return (
    <Card title={cfg.tab} action={<button onClick={() => setOpen(!open)} className={btnPrimary}><Plus size={16} /> {open ? "Close" : "Add"}</button>}>
      {open && (
        <form onSubmit={save} className="mb-5 grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-2">
          {error && <div className="md:col-span-2"><Notice tone="red">{error}</Notice></div>}
          {cfg.fields.map((f) => (
            <div key={f.name} className={f.type === "textarea" ? "md:col-span-2" : ""}>
              <Field label={f.label} required={f.required}>
                {f.type === "textarea" ? (
                  <textarea rows={3} className={inputCls} value={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                ) : f.type === "select" ? (
                  <select className={inputCls} value={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}>
                    {f.options.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={f.type || "text"} className={inputCls} value={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                )}
              </Field>
            </div>
          ))}
          <div className="flex gap-3 md:col-span-2">
            <button type="submit" className={btnPrimary}>Save</button>
            <button type="button" onClick={() => { setOpen(false); setError(""); }} className={btnOutline}>Cancel</button>
          </div>
        </form>
      )}
      {items.length === 0 ? (
        <EmptyState message={cfg.empty} />
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((i) => (
            <li key={i.id} className="flex items-start justify-between gap-4 py-3">
              <div>
                <p className="font-medium text-sidebar">{cfg.title(i)}</p>
                {cfg.sub(i) && <p className="text-sm text-text">{cfg.sub(i)}</p>}
                {cfg.meta(i) && <p className="text-xs text-muted">{cfg.meta(i)}</p>}
              </div>
              <button onClick={() => setItems((list) => list.filter((x) => x.id !== i.id))} aria-label="Delete entry" className="text-muted hover:text-danger">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ------------------------------ career timeline ------------------------------ */
const sortCareer = (list) =>
  [...list].sort((a, b) => (!a.endDate === !b.endDate ? b.startDate.localeCompare(a.startDate) : a.endDate ? 1 : -1));

function CareerSection() {
  const [career, setCareer] = useStore("career");
  const blank = { organization: "", position: "", startDate: "", endDate: "", isCurrent: false };
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function startAdd() { setEditingId(null); setForm(blank); setError(""); setOpen(true); }
  function startEdit(c) {
    setEditingId(c.id);
    setForm({ organization: c.organization, position: c.position, startDate: c.startDate, endDate: c.endDate || "", isCurrent: !c.endDate });
    setError(""); setOpen(true);
  }
  function save(e) {
    e.preventDefault();
    if (!form.organization.trim() || !form.position.trim() || !form.startDate) return setError("Organisation, position and start date are required.");
    if (!form.isCurrent && !form.endDate) return setError("Add an end date, or tick \"I currently work here\".");
    if (!form.isCurrent && form.endDate < form.startDate) return setError("End date cannot be before the start date.");
    const entry = {
      organization: form.organization.trim(), position: form.position.trim(),
      startDate: form.startDate, endDate: form.isCurrent ? "" : form.endDate,
    };
    setCareer((list) =>
      editingId ? list.map((c) => (c.id === editingId ? { ...c, ...entry } : c)) : [{ ...entry, id: nextId(list) }, ...list]
    );
    setOpen(false); setEditingId(null); setError("");
  }

  const sorted = sortCareer(career);

  return (
    <Card title="Career History" icon={Briefcase} action={<button onClick={open ? () => setOpen(false) : startAdd} className={btnPrimary}><Plus size={16} /> {open ? "Close" : "Add job"}</button>}>
      {open && (
        <form onSubmit={save} className="mb-6 grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-2">
          {error && <div className="md:col-span-2"><Notice tone="red">{error}</Notice></div>}
          <Field label="Organisation" required><input className={inputCls} value={form.organization} onChange={set("organization")} /></Field>
          <Field label="Position" required><input className={inputCls} value={form.position} onChange={set("position")} /></Field>
          <Field label="Start date" required><input type="date" className={inputCls} value={form.startDate} onChange={set("startDate")} /></Field>
          <Field label="End date">
            <input type="date" disabled={form.isCurrent} className={inputCls + " disabled:bg-gray-100"} value={form.isCurrent ? "" : form.endDate} onChange={set("endDate")} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-sidebar md:col-span-2">
            <input type="checkbox" checked={form.isCurrent} onChange={(e) => setForm({ ...form, isCurrent: e.target.checked, endDate: "" })} className="h-4 w-4 accent-primary" />
            I currently work here
          </label>
          <div className="flex gap-3 md:col-span-2">
            <button type="submit" className={btnPrimary}>{editingId ? "Save changes" : "Add job"}</button>
            <button type="button" onClick={() => { setOpen(false); setError(""); }} className={btnOutline}>Cancel</button>
          </div>
        </form>
      )}

      {sorted.length === 0 ? (
        <EmptyState message="No career history added yet." />
      ) : (
        <ol className="relative ml-3 border-l-2 border-gray-200">
          {sorted.map((c) => {
            const current = !c.endDate;
            return (
              <li key={c.id} className="relative mb-5 ml-6 last:mb-0">
                <span className={`absolute -left-[33px] top-4 h-4 w-4 rounded-full border-2 border-white ${current ? "bg-success" : "bg-gray-400"}`} />
                <div className={`rounded-lg border p-4 ${current ? "border-primary/40 bg-blue-50/50" : "border-gray-200 bg-white"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-sidebar">{c.position}</p>
                        {current && <Badge tone="green">Current</Badge>}
                      </div>
                      <p className="text-sm text-text">
                        {current ? "Currently working at " : "Worked at "}
                        <b className="text-sidebar">{c.organization}</b>
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => startEdit(c)} aria-label="Edit job" className="text-muted hover:text-primary"><Pencil size={16} /></button>
                      <button onClick={() => setCareer((list) => list.filter((x) => x.id !== c.id))} aria-label="Delete job" className="text-muted hover:text-danger"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {current
                      ? `Since ${formatMonthYear(c.startDate)} - Present`
                      : `${formatMonthYear(c.startDate)} - ${formatMonthYear(c.endDate)}`}
                    {" "}&middot; {durationText(c.startDate, c.endDate)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

/* --------------------------------- overview --------------------------------- */
function PreviewCard({ icon: Icon, title, onViewAll, href, children }) {
  return (
    <Card
      title={title}
      icon={Icon}
      action={
        href ? (
          <Link href={href} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">View All <ArrowRight size={14} /></Link>
        ) : (
          <button onClick={onViewAll} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">View All <ArrowRight size={14} /></button>
        )
      }
    >
      {children}
    </Card>
  );
}

function Overview({ profile, setTab }) {
  const [career] = useStore("career");
  const [publications] = useStore("publications");
  const [contributions] = useStore("contributions");
  const [mentorship] = useStore("mentorship");
  const sortedCareer = sortCareer(career);
  const links = [
    profile.linkedin && { icon: Link2, label: profile.linkedin },
    profile.github && { icon: Link2, label: profile.github },
    profile.website && { icon: Globe, label: profile.website },
  ].filter(Boolean);
  const stats = [
    [publications.length, "Publications"],
    [contributions.length, "Contributions"],
    [mentorship.filter((m) => m.status === "Accepted").length, "Mentorships"],
    [`${Math.max(0, new Date().getFullYear() - Number(profile.graduationYear))}+`, "Years since graduation"],
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6">
        <Card title="About Me"><p className="text-sm leading-relaxed text-text">{profile.professionalBackground || "Add a short introduction using Edit Profile."}</p>
          {profile.areaOfExpertise && <p className="mt-3 text-sm text-text"><b className="text-sidebar">Expertise:</b> {profile.areaOfExpertise}</p>}
        </Card>
        <Card title="Contact & Links">
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3 text-text"><Mail size={16} className="text-primary" /> {profile.email}</li>
            {links.map((l) => <li key={l.label} className="flex items-center gap-3 text-primary"><l.icon size={16} /> {l.label}</li>)}
          </ul>
        </Card>
        <Card title="Quick Stats">
          <div className="grid grid-cols-2 gap-4">
            {stats.map(([v, l]) => (
              <div key={l} className="text-center">
                <p className="text-xl font-bold text-sidebar">{v}</p>
                <p className="text-xs text-muted">{l}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-6 lg:col-span-2">
        <PreviewCard icon={BookOpen} title="My Publications" onViewAll={() => setTab("publications")}>
          {publications.length === 0 ? <EmptyState message="No publications added yet." /> : (
            <ul className="divide-y divide-gray-100">
              {publications.slice(0, 2).map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <p className="font-medium text-sidebar">{p.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted"><Badge tone="blue">{p.publicationType}</Badge>{formatDate(p.publicationDate)}</div>
                </li>
              ))}
            </ul>
          )}
        </PreviewCard>

        <PreviewCard icon={Heart} title="My Contributions" href="/alumni/contributions">
          {contributions.length === 0 ? <EmptyState message="No contributions yet." /> : (
            <ul className="divide-y divide-gray-100">
              {[...contributions].sort((a, b) => b.contributionDate.localeCompare(a.contributionDate)).slice(0, 3).map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium text-sidebar">{c.categoryType}</p>
                    <p className="text-xs text-muted">{c.description}</p>
                  </div>
                  <span className="text-xs text-muted">{formatDate(c.contributionDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </PreviewCard>

        <PreviewCard icon={Briefcase} title="My Career History" onViewAll={() => setTab("career")}>
          {sortedCareer.length === 0 ? <EmptyState message="No career history added yet." /> : (
            <ul className="divide-y divide-gray-100">
              {sortedCareer.slice(0, 3).map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium text-sidebar">{c.position} {!c.endDate && <Badge tone="green">Current</Badge>}</p>
                    <p className="text-xs text-muted">{c.organization}</p>
                  </div>
                  <span className="text-xs text-muted">{formatMonthYear(c.startDate)} - {c.endDate ? formatMonthYear(c.endDate) : "Present"}</span>
                </li>
              ))}
            </ul>
          )}
        </PreviewCard>
      </div>
    </div>
  );
}

/* ----------------------------------- page ----------------------------------- */
const TABS = [
  ["overview", "Overview"],
  ["publications", "Publications"],
  ["career", "Career History"],
  ["projects", "Projects"],
];

export default function ProfilePage() {
  const [stored] = useStore("profile");
  const profile = { ...SEEDS.profile, ...stored }; // fills any missing fields
  const [career] = useStore("career");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(profile);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("overview");

  const current = sortCareer(career).find((c) => !c.endDate);
  const initials = profile.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function startEdit() { setForm(profile); setEditing(true); setSaved(false); }
  function save(e) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Name is required.");
    const year = Number(form.graduationYear);
    if (!year || year < 1990 || year > new Date().getFullYear()) return setError("Enter a valid graduation year.");
    update("profile", () => ({ ...form, graduationYear: year }));
    setError(""); setEditing(false); setSaved(true);
  }

  return (
    <div>
      {saved && <Notice>Profile saved.</Notice>}

      {/* Hero */}
      <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex h-28 items-center justify-end bg-gradient-to-r from-sidebar to-primary px-8">
          <div className="hidden text-right text-white sm:block">
            <p className="font-serif text-lg italic">&ldquo;Once a CSTian, always a CSTian.&rdquo;</p>
            <p className="text-sm text-white/80">- CST Alumni</p>
          </div>
        </div>
        <div className="flex flex-wrap items-start gap-5 px-6 pb-6">
          <div className="-mt-12 flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-white bg-blue-100 text-3xl font-bold text-primary shadow">
            {initials}
          </div>
          <div className="flex-1 pt-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-sidebar">{profile.name}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-primary"><BadgeCheck size={14} /> Verified Alumni</span>
              {profile.isAvailableForMentorship && <Badge tone="green">Available for mentorship</Badge>}
              {!profile.isProfilePublic && <Badge>Private</Badge>}
            </div>
            <p className="mt-1 text-text">
              {current ? <>Currently working as <b className="text-sidebar">{current.position}</b> at <b className="text-sidebar">{current.organization}</b></> : "Add your current job in Career History"}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
              <span className="flex items-center gap-1"><Mail size={14} /> {profile.email}</span>
              {profile.location && <span className="flex items-center gap-1"><MapPin size={14} /> {profile.location}</span>}
              <span className="flex items-center gap-1"><GraduationCap size={14} /> {profile.programme}, Class of {profile.graduationYear}</span>
            </div>
          </div>
          <button onClick={startEdit} className={btnOutline + " mt-3"}><Pencil size={14} /> Edit Profile</button>
        </div>
      </div>

      {editing && (
        <Card title="Edit profile" className="mb-6">
          <form onSubmit={save} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {error && <div className="md:col-span-2"><Notice tone="red">{error}</Notice></div>}
            <Field label="Full name" required><input className={inputCls} value={form.name} onChange={set("name")} /></Field>
            <Field label="Email"><input className={inputCls} value={form.email} onChange={set("email")} /></Field>
            <Field label="Phone"><input className={inputCls} value={form.phone} onChange={set("phone")} /></Field>
            <Field label="Location"><input className={inputCls} value={form.location} onChange={set("location")} /></Field>
            <Field label="Programme"><input className={inputCls} value={form.programme} onChange={set("programme")} /></Field>
            <Field label="Graduation year" required><input type="number" className={inputCls} value={form.graduationYear} onChange={set("graduationYear")} /></Field>
            <Field label="Area of expertise"><input className={inputCls} value={form.areaOfExpertise} onChange={set("areaOfExpertise")} /></Field>
            <Field label="LinkedIn"><input className={inputCls} value={form.linkedin} onChange={set("linkedin")} /></Field>
            <Field label="GitHub"><input className={inputCls} value={form.github} onChange={set("github")} /></Field>
            <Field label="Personal website"><input className={inputCls} value={form.website} onChange={set("website")} /></Field>
            <div className="md:col-span-2">
              <Field label="About me"><textarea rows={3} className={inputCls} value={form.professionalBackground} onChange={set("professionalBackground")} /></Field>
            </div>
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" className={btnPrimary}>Save profile</button>
              <button type="button" onClick={() => { setEditing(false); setError(""); }} className={btnOutline}>Cancel</button>
            </div>
          </form>
        </Card>
      )}

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-1 border-b border-gray-200">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
              tab === key ? "border-primary text-primary" : "border-transparent text-muted hover:text-sidebar"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview profile={profile} setTab={setTab} />}
      {tab === "publications" && <SectionManager storeKey="publications" />}
      {tab === "career" && <CareerSection />}
      {tab === "projects" && <SectionManager storeKey="projects" />}
    </div>
  );
}

