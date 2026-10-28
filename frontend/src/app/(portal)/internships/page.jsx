"use client";

import { useState } from "react";
import {
  Briefcase,
  Search,
  Filter,
  Laptop,
  Cog,
  Clock,
  CalendarDays,
  MapPin,
  Bookmark,
  BookmarkCheck,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------
   DATA (temporary): empty for now. Later, fetch from the backend.

   internships: { id, title, company, location, workType: "On-site",
                  category: "Software & IT" | "Engineering" | "Business",
                  description, eligibility, deadline: "2026-10-30",
                  postedAt: "2026-10-05" }
   applications: { id, internshipId, appliedAt,
                   status: "APPLIED" | "UNDER_REVIEW" | "SHORTLISTED"
                           | "ACCEPTED" | "NOT_SELECTED" }
------------------------------------------------------------------- */
const internships = [
  { id: 1, title: "Software Engineering Intern", company: "DrukTech Solutions",
    location: "Thimphu", workType: "Hybrid", category: "Software & IT",
    description: "Work with our web team on real projects.",
    eligibility: "Final-year Software Engineering students.",
    deadline: "2026-11-30", postedAt: "2026-10-05" },
];
const tabs = ["All Opportunities", "Saved", "My Applications"];

const filters = [
  { label: "All", icon: null },
  { label: "Software & IT", icon: Laptop },
  { label: "Engineering", icon: Cog },
  { label: "Business", icon: Briefcase },
  { label: "Deadline soon", icon: Clock },
];

const statusConfig = {
  APPLIED: { label: "Applied", style: "bg-blue-100 text-primary" },
  UNDER_REVIEW: { label: "Under Review", style: "bg-orange-100 text-warning" },
  SHORTLISTED: { label: "Shortlisted", style: "bg-purple-100 text-accent" },
  ACCEPTED: { label: "Accepted", style: "bg-green-100 text-success" },
  NOT_SELECTED: { label: "Not Selected", style: "bg-red-100 text-danger" },
};

const DAY = 86400000;

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const initials = (name) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const isClosed = (i) => new Date(i.deadline).getTime() < Date.now() - DAY;
const isSoon = (i) => !isClosed(i) && new Date(i.deadline).getTime() - Date.now() <= 7 * DAY;

/* ----------------------------- pieces ----------------------------- */
function StatusBadge({ status }) {
  const { label, style } = statusConfig[status];
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${style}`}>{label}</span>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white py-12 text-center text-sm text-muted shadow-sm">
      {message}
    </div>
  );
}

function InternshipCard({ item, saved, applied, onSave, onOpen }) {
  return (
    <div className="flex flex-wrap items-center gap-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-lg font-bold text-primary">
        {initials(item.company)}
      </div>

      <div className="min-w-48 flex-1">
        <h3 className="font-semibold text-sidebar">{item.title}</h3>
        <p className="text-sm text-primary">{item.company}</p>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted">
          <MapPin size={14} /> {item.location} · {item.workType}
        </p>
      </div>

      <div className="border-l border-gray-200 pl-5 text-sm text-text">
        <p className="flex items-center gap-2">
          <CalendarDays size={14} className="text-muted" /> Posted: {formatDate(item.postedAt)}
        </p>
        <button
          onClick={() => onSave(item.id)}
          className="mt-2 flex items-center gap-2 text-muted hover:text-primary"
        >
          {saved ? (
            <BookmarkCheck size={14} className="text-primary" />
          ) : (
            <Bookmark size={14} />
          )}
          {saved ? "Saved" : "Save"}
        </button>
      </div>

      <button
        onClick={() => onOpen(item)}
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        {applied ? "View Details" : "Apply Now"}
      </button>
    </div>
  );
}

/* ------------------------------- page ------------------------------ */
export default function InternshipsPage() {
  const [tab, setTab] = useState("All Opportunities");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [savedIds, setSavedIds] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selected, setSelected] = useState(null);

  const toggleSave = (id) =>
    setSavedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const applicationFor = (id) => applications.find((a) => a.internshipId === id);

  const apply = (internship) => {
    // TODO (backend phase): POST /api/applications
    // For now it is only stored locally so the UI can be tested.
    setApplications([
      {
        id: Date.now(),
        internshipId: internship.id,
        status: "APPLIED",
        appliedAt: new Date().toISOString(),
      },
      ...applications,
    ]);
  };

  const matches = (i) =>
    `${i.title} ${i.company} ${i.description ?? ""}`.toLowerCase().includes(search.toLowerCase()) &&
    (filter === "All" ||
      (filter === "Deadline soon" ? isSoon(i) : i.category === filter));

  const allList = internships.filter(matches);
  const savedList = internships.filter((i) => savedIds.includes(i.id) && matches(i));

  const renderList = (list, emptyMessage) =>
    list.length === 0 ? (
      <EmptyState message={emptyMessage} />
    ) : (
      <div className="space-y-4">
        {list.map((i) => (
          <InternshipCard
            key={i.id}
            item={i}
            saved={savedIds.includes(i.id)}
            applied={!!applicationFor(i.id)}
            onSave={toggleSave}
            onOpen={setSelected}
          />
        ))}
      </div>
    );

  const appliedClosed = selected ? isClosed(selected) : false;
  const selectedApplication = selected ? applicationFor(selected.id) : null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
          <Briefcase size={36} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-sidebar">Internships</h1>
          <p className="text-muted">
            Discover and apply for internships shared by our alumni and partners.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-8 border-b border-gray-200">
        {tabs.map((t) => {
          const count =
            t === "Saved" ? ` (${savedIds.length})` : t === "My Applications" ? ` (${applications.length})` : "";
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-text hover:text-primary"
              }`}
            >
              {t}
              {count}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_16rem]">
        {/* Main column */}
        <div>
          {tab !== "My Applications" && (
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by job title, company or keyword..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-text outline-none focus:border-primary"
              />
            </div>
          )}

          {tab === "All Opportunities" &&
            renderList(
              allList,
              internships.length === 0
                ? "No internships posted yet."
                : "No internships match your search."
            )}

          {tab === "Saved" &&
            renderList(savedList, "You haven't saved any internships yet.")}

          {tab === "My Applications" &&
            (applications.length === 0 ? (
              <EmptyState message="You haven't applied to any internships yet." />
            ) : (
              <div className="space-y-4">
                {applications.map((a) => {
                  const item = internships.find((i) => i.id === a.internshipId);
                  if (!item) return null;
                  return (
                    <div
                      key={a.id}
                      className="flex flex-wrap items-center gap-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-50 font-bold text-primary">
                        {initials(item.company)}
                      </div>
                      <div className="min-w-48 flex-1">
                        <h3 className="font-semibold text-sidebar">{item.title}</h3>
                        <p className="text-sm text-primary">{item.company}</p>
                        <p className="text-xs text-muted">Applied on {formatDate(a.appliedAt)}</p>
                      </div>
                      <StatusBadge status={a.status} />
                      <button
                        onClick={() => setSelected(item)}
                        className="rounded-lg border border-primary px-4 py-1.5 text-sm font-medium text-primary hover:bg-blue-50"
                      >
                        View Details
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
        </div>

        {/* Filter sidebar */}
        {tab !== "My Applications" && (
          <aside className="h-fit rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-sidebar">
              <Filter size={18} /> Filter by
            </h2>
            <div className="space-y-2">
              {filters.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => setFilter(label)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    filter === label
                      ? "border-blue-100 bg-blue-100 text-primary"
                      : "border-gray-200 text-text hover:bg-gray-50"
                  }`}
                >
                  {Icon && <Icon size={16} />}
                  {label}
                </button>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* Details modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-sidebar">{selected.title}</h3>
                <p className="text-sm text-primary">{selected.company}</p>
              </div>
              <button onClick={() => setSelected(null)}>
                <X size={18} className="text-muted" />
              </button>
            </div>

            <div className="mb-4 space-y-1 text-sm text-text">
              <p className="flex items-center gap-2">
                <MapPin size={14} className="text-muted" /> {selected.location} · {selected.workType}
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays size={14} className="text-muted" /> Posted {formatDate(selected.postedAt)}
              </p>
              <p className="flex items-center gap-2">
                <Clock size={14} className="text-muted" /> Apply by{" "}
                <span className="font-semibold text-danger">{formatDate(selected.deadline)}</span>
              </p>
            </div>

            {selected.description && (
              <div className="mb-4">
                <h4 className="mb-1 text-sm font-semibold text-sidebar">Description</h4>
                <p className="whitespace-pre-line text-sm text-text">{selected.description}</p>
              </div>
            )}

            {selected.eligibility && (
              <div className="mb-5">
                <h4 className="mb-1 text-sm font-semibold text-sidebar">Eligibility</h4>
                <p className="whitespace-pre-line text-sm text-text">{selected.eligibility}</p>
              </div>
            )}

            {selectedApplication ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted">Your application:</span>
                <StatusBadge status={selectedApplication.status} />
              </div>
            ) : appliedClosed ? (
              <p className="text-sm font-medium text-danger">Applications are closed.</p>
            ) : (
              <button
                onClick={() => apply(selected)}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Apply Now
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}