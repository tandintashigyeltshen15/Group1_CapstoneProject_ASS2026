"use client";

import PortfolioSection from "@/components/PortfolioSection";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AvatarUpload from "@/components/AvatarUpload";
import {
  Pencil,
  X,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  CalendarDays,
  User,
  BookOpen,
  Code as Code2,
  ExternalLink,
  FolderOpen,
  Star,
  IdCard,
  ArrowRight,
} from "lucide-react";

const DZONGKHAGS = [
  "Bumthang", "Chukha", "Dagana", "Gasa", "Haa", "Lhuentse", "Mongar", "Paro",
  "Pemagatshel", "Punakha", "Samdrup Jongkhar", "Samtse", "Sarpang", "Thimphu",
  "Trashigang", "Trashiyangtse", "Trongsa", "Tsirang", "Wangdue Phodrang", "Zhemgang",
];

const emptyProfile = {
  name: "",
  email: "",
  role: "Student",
  accountStatus: "",
  photoUrl: "",
  studentId: "",
  programme: "",
  joinYear: "",
  phone: "",
  dzongkhag: "",
  gewog: "",
  projects: "",
  technicalSkills: "",
  softSkills: "",
  completion: 0,
};

const inputStyle =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-text outline-none focus:border-primary";

/* ----------------------------- helpers ----------------------------- */
const initials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

// "React, Node.js" or one per line -> ["React", "Node.js"]
const splitList = (text = "") =>
  text
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

// Only allow http/https links (blocks things like javascript:)
const safeUrl = (value) => {
  if (!value?.trim()) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
};

// One project per line: "Alumni Portal - https://github.com/you/repo"
const URL_RE = /(https?:\/\/[^\s]+)/i;
const parseProject = (line) => {
  const match = line.match(URL_RE);
  const link = match ? safeUrl(match[1]) : "";
  const title = line.replace(URL_RE, "").replace(/[\s\-–—:|]+$/g, "").trim() || line.trim();
  return { title, link };
};

/* ----------------------------- pieces ----------------------------- */
function Panel({ icon: Icon, title, subtitle, action, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-sidebar">
            <Icon size={20} className="text-primary" /> {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const NotAdded = () => <span className="italic text-muted">Not added yet</span>;

function Row({ label, value }) {
  return (
    <div className="flex gap-3 py-1.5 text-sm">
      <span className="w-28 shrink-0 text-muted">{label}</span>
      <span className="text-text">{value || <NotAdded />}</span>
    </div>
  );
}

function Tags({ list }) {
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((t) => (
        <span key={t} className="rounded-full bg-blue-50 px-3 py-1 text-xs text-primary">
          {t}
        </span>
      ))}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-sidebar">{title}</h3>
          <button onClick={onClose}>
            <X size={18} className="text-muted" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-text">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function ProjectCard({ project }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex h-28 items-center justify-center bg-linear-to-br from-sidebar to-primary text-3xl font-bold text-white/80">
        {initials(project.title)}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-sidebar">{project.title}</h3>
        <div className="mt-auto pt-4">
          {project.link ? (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-primary py-2 text-sm font-medium text-primary hover:bg-blue-50"
            >
              View Project <ExternalLink size={14} />
            </a>
          ) : (
            <span className="block rounded-lg bg-gray-50 py-2 text-center text-sm text-muted">
              No link
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- page ------------------------------ */
export default function ProfilePage() {
  const [profile, setProfile] = useState(emptyProfile);
  const [tab, setTab] = useState("About");

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(emptyProfile);
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/student/profile")
      .then(setProfile)
      .catch((err) => console.warn(err.message));
  }, []);

  const technical = splitList(profile.technicalSkills);
  const soft = splitList(profile.softSkills);
  const projects = (profile.projects || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map(parseProject);

  const location = [profile.gewog, profile.dzongkhag].filter(Boolean).join(", ");
  const dzongkhagOptions =
    draft.dzongkhag && !DZONGKHAGS.includes(draft.dzongkhag)
      ? [draft.dzongkhag, ...DZONGKHAGS]
      : DZONGKHAGS;

  const openEdit = () => {
    setDraft(profile);
    setEditError("");
    setEditing(true);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setEditError("");
    setSaving(true);
    try {
      const updated = await api("/student/profile", {
        method: "PUT",
        body: JSON.stringify({
          phone: draft.phone,
          dzongkhag: draft.dzongkhag,
          gewog: draft.gewog,
          projects: draft.projects,
          technicalSkills: draft.technicalSkills,
          softSkills: draft.softSkills,
        }),
      });
      setProfile(updated);
      setEditing(false);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header card */}
      <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="h-32 bg-linear-to-r from-sidebar to-primary" />
        <div className="px-6 pb-6">
          <div className="-mt-14 flex flex-wrap items-start gap-6">
            <AvatarUpload
              name={profile.name}
              photoUrl={profile.photoUrl}
              onChange={(url) => setProfile({ ...profile, photoUrl: url })}
              className="border-4 border-white shadow"
            />

            {/* sm:pt-16 pushes the text below the banner */}
            <div className="min-w-64 flex-1 pt-2 sm:pt-16">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-sidebar">{profile.name || "Your name"}</h1>
                <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-primary">
                  {profile.role}
                </span>
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-text">
                <span className="flex items-center gap-1.5">
                  <GraduationCap size={15} className="text-primary" />
                  {profile.programme || <NotAdded />}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={15} className="text-primary" />
                  {profile.joinYear ? `Joined ${profile.joinYear}` : <NotAdded />}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={15} className="text-primary" />
                  {location || <NotAdded />}
                </span>
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-text">
                <span className="flex items-center gap-1.5">
                  <Mail size={15} className="text-primary" />
                  {profile.email || <NotAdded />}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone size={15} className="text-primary" />
                  {profile.phone || <NotAdded />}
                </span>
              </p>
            </div>

            <button
              onClick={openEdit}
              className="flex items-center gap-2 rounded-lg border border-primary bg-blue-50 px-4 py-2 text-sm font-medium text-primary hover:bg-blue-100 sm:mt-16"
            >
              <Pencil size={14} /> Edit Profile
            </button>
          </div>

          <div className="mt-5 max-w-md">
            <div className="mb-1 flex justify-between text-xs text-muted">
              <span>Profile completed</span>
              <span>{profile.completion}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${profile.completion}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-3">
        {[
          { label: "About", icon: User },
          { label: "Portfolio", icon: Code2 },
        ].map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setTab(label)}
            className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors ${
              tab === label ? "bg-primary text-white" : "bg-blue-50 text-text hover:bg-blue-100"
            }`}
          >
            <Icon size={16} /> {label}
            {label === "Portfolio" && ` (${projects.length})`}
          </button>
        ))}
      </div>

      {/* About tab */}
      {tab === "About" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Panel icon={Star} title="Skills">
              {technical.length === 0 && soft.length === 0 ? (
                <p className="text-sm italic text-muted">
                  Add your skills with Edit Profile so alumni and staff can see what you do.
                </p>
              ) : (
                <div className="space-y-4">
                  {technical.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-sidebar">Technical skills</p>
                      <Tags list={technical} />
                    </div>
                  )}
                  {soft.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-sidebar">Soft skills</p>
                      <Tags list={soft} />
                    </div>
                  )}
                </div>
              )}
            </Panel>

            <Panel icon={BookOpen} title="Academic Information">
              <Row label="Programme" value={profile.programme} />
              <Row label="Joined" value={profile.joinYear} />
              <Row label="Student ID" value={profile.studentId} />
              <Row label="College" value="College of Science and Technology (CST)" />
              <Row label="University" value="Royal University of Bhutan (RUB)" />
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel
              icon={Code2}
              title="Portfolio"
              subtitle="Projects I have worked on."
              action={
                projects.length > 2 && (
                  <button
                    onClick={() => setTab("Portfolio")}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    View All <ArrowRight size={14} />
                  </button>
                )
              }
            >
              {projects.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="mb-3 text-sm text-muted">No projects added yet.</p>
                  <button
                    onClick={openEdit}
                    className="rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-blue-50"
                  >
                    Add your projects
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {projects.slice(0, 2).map((p, i) => (
                    <ProjectCard key={`${p.title}-${i}`} project={p} />
                  ))}
                </div>
              )}
            </Panel>

            <Panel icon={IdCard} title="Personal Details">
              <Row label="Full Name" value={profile.name} />
              <Row label="Email" value={profile.email} />
              <Row label="Phone" value={profile.phone} />
              <Row label="Location" value={location} />
            </Panel>
          </div>
        </div>
      )}

           {/* Portfolio tab */}
      {tab === "Portfolio" && (
        <div className="space-y-6">
          <Panel
            icon={Code2}
            title="My Portfolio"
            subtitle="Showcase the projects you are proud of."
            action={
              <button
                onClick={openEdit}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Pencil size={14} /> Edit Projects
              </button>
            }
          >
            {projects.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center text-sm text-muted">
                <FolderOpen size={36} className="mb-3 text-gray-300" />
                No projects yet. Use Edit Projects to add your first one.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {projects.map((p, i) => (
                  <ProjectCard key={`${p.title}-${i}`} project={p} />
                ))}
              </div>
            )}
          </Panel>

          <PortfolioSection />
        </div>
      )}

      {/* Edit profile modal */}
      {editing && (
        <Modal title="Edit Profile" onClose={() => setEditing(false)}>
          <form onSubmit={saveProfile} className="space-y-4">
            <Field
              label="Name and email"
              hint="Name, email, programme and student ID were verified at signup and can't be changed here."
            >
              <input
                value={`${profile.name} · ${profile.email}`}
                disabled
                className={`${inputStyle} bg-gray-50 text-muted`}
              />
            </Field>
            <Field label="Phone number">
              <input
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value.replace(/\D/g, "") })}
                placeholder="8 digits, e.g. 17123456"
                maxLength={8}
                inputMode="numeric"
                className={inputStyle}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Dzongkhag">
                <select
                  value={draft.dzongkhag}
                  onChange={(e) => setDraft({ ...draft, dzongkhag: e.target.value })}
                  className={inputStyle}
                >
                  <option value="">Select</option>
                  {dzongkhagOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Gewog">
                <input
                  value={draft.gewog}
                  onChange={(e) => setDraft({ ...draft, gewog: e.target.value })}
                  maxLength={20}
                  className={inputStyle}
                />
              </Field>
            </div>
            <Field label="Technical skills" hint="Separate with commas.">
              <textarea
                value={draft.technicalSkills}
                onChange={(e) => setDraft({ ...draft, technicalSkills: e.target.value })}
                rows={2}
                maxLength={2000}
                placeholder="React, Node.js, MySQL"
                className={inputStyle}
              />
            </Field>
            <Field label="Soft skills" hint="Separate with commas.">
              <textarea
                value={draft.softSkills}
                onChange={(e) => setDraft({ ...draft, softSkills: e.target.value })}
                rows={2}
                maxLength={2000}
                placeholder="Teamwork, Communication"
                className={inputStyle}
              />
            </Field>
            <Field
              label="Projects"
              hint="One project per line. Add a link after the name to get a View Project button."
            >
              <textarea
                value={draft.projects}
                onChange={(e) => setDraft({ ...draft, projects: e.target.value })}
                rows={4}
                maxLength={2000}
                placeholder={"Alumni Portal - https://github.com/you/repo\nLibrary Management System"}
                className={inputStyle}
              />
            </Field>
            {editError && <p className="text-sm text-danger">{editError}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}