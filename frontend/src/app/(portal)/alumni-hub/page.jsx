"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  UserRound,
  BookOpen,
  Users,
  Briefcase,
  ArrowRight,
  ChevronRight,
  Link2,
  FileText,
} from "lucide-react";

/* ------------------------------------------------------------------
   DATA (temporary): empty for now. Later, fetch from the backend.

   alumni:      { id, name, programme, graduationYear, jobTitle, company,
                  location, expertise, isMentor, bio }
   internships: { id, title, company, deadline: "2026-09-30", type: "Internship" }
------------------------------------------------------------------- */
const alumni = [
  { id: 1, name: "Test Alumni", programme: "Software Engineering", graduationYear: 2024,
    jobTitle: "Developer", company: "ABC Tech", location: "Thimphu", expertise: "Web Development",
    isMentor: true, bio: "Happy to guide students." },
];
const internships = [];

const unique = (arr) => [...new Set(arr.filter(Boolean))].sort();
const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const initials = (name) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

/* ----------------------------- pieces ----------------------------- */
function Panel({ icon: Icon, title, subtitle, href, linkLabel = "View All", children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sidebar">
            <Icon size={20} className="text-primary" />
            <h2 className="font-semibold">{title}</h2>
          </div>
          {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {linkLabel} <ArrowRight size={14} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }) {
  return <p className="py-6 text-center text-sm text-muted">{message}</p>;
}

function Avatar({ name }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-primary">
      {initials(name)}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, text, href, linkLabel, iconStyle }) {
  return (
    <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${iconStyle}`}
      >
        <Icon size={26} />
      </div>
      <div>
        <h3 className="font-semibold text-sidebar">{title}</h3>
        <p className="mb-2 text-sm text-muted">{text}</p>
        <Link
          href={href}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {linkLabel} <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function QuickLink({ icon: Icon, label, href }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-blue-50/50 px-4 py-3 text-sm font-medium text-sidebar transition-colors hover:bg-blue-50"
    >
      <Icon size={18} className="text-primary" />
      {label}
    </Link>
  );
}

const selectStyle =
  "rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-text outline-none focus:border-primary";

/* ------------------------------- page ------------------------------ */
export default function AlumniHubPage() {
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [programme, setProgramme] = useState("");
  const [location, setLocation] = useState("");

  const filtered = alumni.filter(
    (a) =>
      (!search || a.name.toLowerCase().includes(search.toLowerCase())) &&
      (!year || String(a.graduationYear) === year) &&
      (!programme || a.programme === programme) &&
      (!location || a.location === location)
  );

  const reset = () => {
    setSearch("");
    setYear("");
    setProgramme("");
    setLocation("");
  };

  // Yearbook cards: group alumni by graduation year (newest first)
  const yearbooks = Object.entries(
    alumni.reduce((acc, a) => {
      if (a.graduationYear) acc[a.graduationYear] = (acc[a.graduationYear] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[0] - a[0])
    .slice(0, 5);

  const mentors = alumni.filter((a) => a.isMentor).slice(0, 3);

  return (
    <div>
      <h1 className="text-3xl font-bold text-sidebar">Alumni Hub</h1>
      <p className="mb-6 text-muted">Connect, learn and grow with the CST community.</p>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alumni by name..."
            className={`${selectStyle} w-full pl-9`}
          />
        </div>
        <select value={year} onChange={(e) => setYear(e.target.value)} className={selectStyle}>
          <option value="">Graduation Year</option>
          {unique(alumni.map((a) => a.graduationYear)).reverse().map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={programme} onChange={(e) => setProgramme(e.target.value)} className={selectStyle}>
          <option value="">Programme</option>
          {unique(alumni.map((a) => a.programme)).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select value={location} onChange={(e) => setLocation(e.target.value)} className={selectStyle}>
          <option value="">Location</option>
          {unique(alumni.map((a) => a.location)).map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <button onClick={reset} className="text-sm font-medium text-primary hover:underline">
          Reset
        </button>
      </div>

      {/* Feature cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FeatureCard
          icon={UserRound}
          title="Alumni Directory"
          text="Search and connect with CST alumni."
          href="/alumni-hub/directory"
          linkLabel="Explore Directory"
          iconStyle="bg-blue-100 text-primary"
        />
        <FeatureCard
          icon={BookOpen}
          title="Yearbook"
          text="Browse alumni by graduation year and programme."
          href="/alumni-hub/yearbook"
          linkLabel="View Yearbook"
          iconStyle="bg-purple-100 text-accent"
        />
        <FeatureCard
          icon={Users}
          title="Mentorship"
          text="Find mentors or request guidance."
          href="/mentorship"
          linkLabel="View Mentorship"
          iconStyle="bg-green-100 text-success"
        />
        <FeatureCard
          icon={Briefcase}
          title="Internships"
          text="Discover internship opportunities."
          href="/internships"
          linkLabel="View Internships"
          iconStyle="bg-orange-100 text-warning"
        />
      </div>

      {/* Yearbook */}
      <div className="mb-6">
        <Panel
          icon={BookOpen}
          title="Yearbook"
          subtitle="Explore alumni by graduation year."
          href="/alumni-hub/yearbook"
          linkLabel="View All Yearbooks"
        >
          {yearbooks.length === 0 ? (
            <EmptyState message="No yearbooks yet. They appear once alumni are approved." />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
              {yearbooks.map(([y, count]) => (
                <Link
                  key={y}
                  href={`/alumni-hub/yearbook/${y}`}
                  className="overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-md"
                >
                  <div className="bg-sidebar p-4 text-white">
                    <p className="text-xl font-bold">{y}</p>
                    <p className="text-sm text-white/80">{count} Alumni</p>
                  </div>
                  <p className="flex items-center justify-center gap-1 py-2 text-xs font-medium text-primary">
                    View Yearbook <ArrowRight size={12} />
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Featured alumni + mentorship highlights */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel icon={UserRound} title="Featured Alumni" href="/alumni-hub/directory">
          {filtered.length === 0 ? (
            <EmptyState
              message={
                alumni.length === 0
                  ? "No alumni registered yet."
                  : "No alumni match your filters."
              }
            />
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.slice(0, 4).map((a) => (
                <li key={a.id} className="flex items-center gap-4 py-3">
                  <Avatar name={a.name} />
                  <div className="flex-1">
                    <p className="font-medium text-sidebar">{a.name}</p>
                    <p className="text-xs text-muted">
                      {a.programme} | {a.graduationYear}
                    </p>
                    {a.jobTitle && (
                      <p className="text-xs text-muted">
                        {a.jobTitle}
                        {a.company ? ` at ${a.company}` : ""}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-muted" />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel icon={Users} title="Mentorship Highlights" href="/mentorship">
          {mentors.length === 0 ? (
            <EmptyState message="No mentors available yet." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {mentors.map((m) => (
                <li key={m.id} className="flex items-center gap-4 py-3">
                  <Avatar name={m.name} />
                  <div className="flex-1">
                    <p className="font-medium text-sidebar">{m.name}</p>
                    <p className="text-xs text-muted">Alumni, {m.graduationYear}</p>
                    {m.bio && <p className="text-xs text-text">{m.bio}</p>}
                  </div>
                  {m.expertise && (
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] text-primary">
                      {m.expertise}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Latest internships + quick links */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel icon={Briefcase} title="Latest Internships" href="/internships">
          {internships.length === 0 ? (
            <EmptyState message="No internships posted yet." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {internships.slice(0, 4).map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
                    <Briefcase size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-sidebar">{i.title}</p>
                    <p className="text-xs text-muted">{i.company}</p>
                  </div>
                  <span className="text-xs text-muted">{formatDate(i.deadline)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel icon={Link2} title="Quick Links">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <QuickLink icon={UserRound} label="Browse Alumni" href="/alumni-hub/directory" />
            <QuickLink icon={BookOpen} label="Yearbook" href="/alumni-hub/yearbook" />
            <QuickLink icon={Users} label="Find Mentors" href="/mentorship" />
            <QuickLink icon={FileText} label="My Applications" href="/applications" />
          </div>
        </Panel>
      </div>
    </div>
  );
}