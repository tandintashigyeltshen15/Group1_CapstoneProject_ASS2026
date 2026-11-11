"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Briefcase, GraduationCap, Loader2, BookOpen, Users } from "lucide-react";

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

async function loadAlumni() {
  let token = null;
  try {
    token = localStorage.getItem("token");
  } catch {}
  const res = await fetch(`${API_ROOT}/api/alumni-hub`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || "Could not load alumni.");
  return json.alumni || [];
}

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

function AlumniCard({ a, compact }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#14264f] text-sm font-semibold text-white">
          {initials(a.name)}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900">{a.name}</h3>
          <p className="truncate text-sm text-slate-500">
            {a.programme} · Class of {a.graduationYear}
          </p>
        </div>
      </div>

      {(a.jobTitle || a.company) && (
        <p className="flex items-start gap-2 text-sm text-slate-700">
          <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <span>{[a.jobTitle, a.company].filter(Boolean).join(" at ")}</span>
        </p>
      )}

      {!compact && a.expertise && (
        <p className="text-sm text-slate-600">
          <span className="font-medium text-slate-700">Expertise: </span>
          {a.expertise}
        </p>
      )}
      {!compact && a.bio && <p className="line-clamp-3 text-sm text-slate-600">{a.bio}</p>}

      {a.isMentor && (
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
            Open to mentoring
          </span>
          <Link href="/mentorship" className="text-sm font-medium text-blue-700 hover:underline">
            Mentorship
          </Link>
        </div>
      )}
    </div>
  );
}

const selectCls =
  "rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";

export default function AlumniBrowser({ mode = "directory" }) {
  const isYearbook = mode === "yearbook";

  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [year, setYear] = useState("");
  const [programme, setProgramme] = useState("");
  const [mentorsOnly, setMentorsOnly] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    loadAlumni()
      .then(setAlumni)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // yearbook links can pass ?year=2025
    const y = new URLSearchParams(window.location.search).get("year");
    if (y) setYear(y);
  }, []);

  const years = useMemo(
    () => [...new Set(alumni.map((a) => a.graduationYear))].filter(Boolean).sort((a, b) => b - a),
    [alumni]
  );
  const programmes = useMemo(
    () => [...new Set(alumni.map((a) => a.programme))].filter(Boolean).sort(),
    [alumni]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return alumni.filter((a) => {
      if (year && String(a.graduationYear) !== String(year)) return false;
      if (programme && a.programme !== programme) return false;
      if (mentorsOnly && !a.isMentor) return false;
      if (!term) return true;
      return [a.name, a.company, a.jobTitle, a.expertise, a.programme]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [alumni, q, year, programme, mentorsOnly]);

  const byYear = useMemo(() => {
    const map = new Map();
    filtered.forEach((a) => {
      if (!map.has(a.graduationYear)) map.set(a.graduationYear, []);
      map.get(a.graduationYear).push(a);
    });
    return [...map.entries()].sort((x, y) => y[0] - x[0]);
  }, [filtered]);

  const reset = () => {
    setQ("");
    setYear("");
    setProgramme("");
    setMentorsOnly(false);
  };

  const Icon = isYearbook ? BookOpen : Users;

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-[#14264f]">
          <Icon className="h-7 w-7 text-blue-600" />
          {isYearbook ? "Yearbook" : "Alumni Directory"}
        </h1>
        <p className="mt-1 text-slate-600">
          {isYearbook
            ? "Browse registered alumni by graduation year and programme."
            : "Search and connect with registered CST alumni."}
        </p>
      </div>

      {isYearbook && years.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setYear("")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              !year ? "bg-blue-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
            }`}
          >
            All years
          </button>
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setYear(String(y))}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                String(year) === String(y)
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, company, job title or expertise..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {!isYearbook && (
          <select value={year} onChange={(e) => setYear(e.target.value)} className={selectCls}>
            <option value="">Graduation year</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        )}

        <select value={programme} onChange={(e) => setProgramme(e.target.value)} className={selectCls}>
          <option value="">All programmes</option>
          {programmes.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {!isYearbook && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={mentorsOnly}
              onChange={(e) => setMentorsOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Mentors only
          </label>
        )}

        <button onClick={reset} className="text-sm font-medium text-blue-700 hover:underline">
          Reset
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading alumni...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}{" "}
          <button onClick={load} className="font-medium underline">
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          <GraduationCap className="mx-auto mb-2 h-6 w-6" />
          {alumni.length === 0
            ? "No registered alumni are listed yet."
            : "No alumni match your search. Try a different filter."}
        </div>
      ) : isYearbook ? (
        <div className="space-y-8">
          {byYear.map(([y, list]) => (
            <section key={y}>
              <h2 className="mb-3 flex items-baseline gap-3 text-xl font-semibold text-[#14264f]">
                Class of {y}
                <span className="text-sm font-normal text-slate-500">
                  {list.length} alumni
                </span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {list.map((a) => (
                  <AlumniCard key={a.id} a={a} compact />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">
            {filtered.length} alumni
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((a) => (
              <AlumniCard key={a.id} a={a} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}