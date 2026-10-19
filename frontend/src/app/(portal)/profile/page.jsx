/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import {
  Camera,
  Pencil,
  Plus,
  Trash2,
  X,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  CalendarDays,
  User,
  BookOpen,
  Code as Code2,
  Link2,
  ArrowRight,
  ExternalLink,
  Briefcase,
  Globe,
  Star,
  FolderOpen,
} from "lucide-react";

/* ------------------------------------------------------------------
   DATA (temporary): lives in the browser only, so it resets on refresh.
   Later, load and save these through the backend.

   profile:  { photo, about, programme, yearOfStudy, location, phone,
               interests: [], languages, motto, github, linkedin, website }
   projects: { id, title, description, link, image }
------------------------------------------------------------------- */
const emptyProfile = {
  photo: "",
  about: "",
  programme: "",
  yearOfStudy: "",
  location: "",
  phone: "",
  interests: [],
  languages: "",
  motto: "",
  github: "",
  linkedin: "",
  website: "",
};

const yearOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];
const MAX_IMAGE_MB = 2;

const inputStyle =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-text outline-none focus:border-primary";

/* ----------------------------- helpers ----------------------------- */
const initials = (name) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

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

function readImage(file, onDone, onError) {
  if (!file) return;
  if (!file.type.startsWith("image/")) return onError("Please choose an image file.");
  if (file.size > MAX_IMAGE_MB * 1024 * 1024)
    return onError(`Image must be under ${MAX_IMAGE_MB} MB.`);
  onError("");
  const reader = new FileReader();
  reader.onload = () => onDone(reader.result);
  reader.readAsDataURL(file);
}

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

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-text">{label}</label>
      {children}
    </div>
  );
}

function ProjectCard({ project, onEdit, onDelete }) {
  const link = safeUrl(project.link);
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {project.image ? (
        <img src={project.image} alt={project.title} className="h-36 w-full object-cover" />
      ) : (
        <div className="flex h-36 items-center justify-center bg-linear-to-br from-sidebar to-primary text-3xl font-bold text-white/80">
          {initials(project.title)}
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-sidebar">{project.title}</h3>
        {project.description && (
          <p className="mt-1 line-clamp-3 text-sm text-muted">{project.description}</p>
        )}
        <div className="mt-auto flex items-center gap-2 pt-4">
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary py-2 text-sm font-medium text-primary hover:bg-blue-50"
            >
              View Project <ExternalLink size={14} />
            </a>
          ) : (
            <span className="flex-1 rounded-lg bg-gray-50 py-2 text-center text-sm text-muted">
              No link
            </span>
          )}
          {onEdit && (
            <>
              <button
                onClick={() => onEdit(project)}
                aria-label="Edit project"
                className="rounded-lg border border-gray-200 p-2 text-muted hover:text-primary"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => onDelete(project.id)}
                aria-label="Delete project"
                className="rounded-lg border border-gray-200 p-2 text-muted hover:text-danger"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- page ------------------------------ */
export default function ProfilePage() {
  const [user, setUser] = useState({ name: "", email: "", role: "Student" });
  const [profile, setProfile] = useState(emptyProfile);
  const [projects, setProjects] = useState([]);
  const [tab, setTab] = useState("About");

  const [photoError, setPhotoError] = useState("");

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(emptyProfile);
  const [interestsText, setInterestsText] = useState("");
  const [nameText, setNameText] = useState("");

  const [projectDraft, setProjectDraft] = useState(null); // null = closed
  const [projectError, setProjectError] = useState("");

  // The login page will save { name, email, role } as "user" in localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user"));
      if (stored) {
        setUser({
          name: stored.name || "",
          email: stored.email || "",
          role: stored.role || "Student",
        });
      }
    } catch {}
  }, []);

  /* ---- profile completion (the dashboard's % should use this same list) ---- */
  const checks = [
    !!profile.photo,
    !!profile.about,
    !!profile.programme,
    !!profile.yearOfStudy,
    !!profile.phone,
    profile.interests.length > 0,
    !!(profile.github || profile.linkedin || profile.website),
  ];
  const completion = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  /* ---- photo ---- */
  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    readImage(file, (photo) => setProfile((p) => ({ ...p, photo })), setPhotoError);
    // TODO (backend phase): upload the file and save the returned URL
  };

  /* ---- edit profile ---- */
  const openEdit = () => {
    setDraft(profile);
    setInterestsText(profile.interests.join(", "));
    setNameText(user.name);
    setEditing(true);
  };

  const saveProfile = (e) => {
    e.preventDefault();

    const newName = nameText.trim();
    if (newName && newName !== user.name) {
      setUser((u) => ({ ...u, name: newName }));
      try {
        const stored = JSON.parse(localStorage.getItem("user")) || {};
        localStorage.setItem(
          "user",
          JSON.stringify({ ...stored, name: newName, role: stored.role || user.role })
        );
      } catch {}
      // TODO (backend phase): send the new name to PUT /api/profile
    }

    // TODO (backend phase): PUT /api/profile
    setProfile({
      ...draft,
      interests: interestsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8),
      github: safeUrl(draft.github),
      linkedin: safeUrl(draft.linkedin),
      website: safeUrl(draft.website),
    });
    setEditing(false);
  };

  /* ---- portfolio ---- */
  const openNewProject = () => {
    setProjectError("");
    setProjectDraft({ id: null, title: "", description: "", link: "", image: "" });
  };

  const openEditProject = (p) => {
    setProjectError("");
    setProjectDraft(p);
  };

  const saveProject = (e) => {
    e.preventDefault();
    if (projectDraft.link.trim() && !safeUrl(projectDraft.link)) {
      return setProjectError("Please enter a valid link (https://...).");
    }
    // TODO (backend phase): POST / PUT /api/portfolio
    const cleaned = {
      ...projectDraft,
      title: projectDraft.title.trim(),
      link: safeUrl(projectDraft.link),
    };
    setProjects((prev) =>
      cleaned.id
        ? prev.map((p) => (p.id === cleaned.id ? cleaned : p))
        : [{ ...cleaned, id: Date.now() }, ...prev]
    );
    setProjectDraft(null);
  };

  const deleteProject = (id) => {
    if (!window.confirm("Delete this project?")) return;
    // TODO (backend phase): DELETE /api/portfolio/:id
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const socialLinks = [
    { label: "GitHub", href: profile.github, icon: Code2 },
    { label: "LinkedIn", href: profile.linkedin, icon: Briefcase },
    { label: "Personal Website", href: profile.website, icon: Globe },
  ].filter((l) => l.href);

  return (
    <div>
      {/* Header card */}
      <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="h-32 bg-linear-to-r from-sidebar to-primary" />
        <div className="px-6 pb-6">
          <div className="-mt-14 flex flex-wrap items-end gap-6">
            <div className="relative">
              {profile.photo ? (
                <img
                  src={profile.photo}
                  alt="Profile"
                  className="h-28 w-28 rounded-full border-4 border-white object-cover shadow"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-sidebar text-3xl font-semibold text-white shadow">
                  {user.name ? initials(user.name) : "?"}
                </div>
              )}
              <label
                title="Upload photo"
                className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-primary text-white hover:bg-blue-700"
              >
                <Camera size={16} />
                <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
              </label>
            </div>

            <div className="min-w-64 flex-1 pb-1 pt-16 sm:pt-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-sidebar">{user.name || "Your name"}</h1>
                <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-primary">
                  {user.role}
                </span>
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-text">
                <span className="flex items-center gap-1.5">
                  <GraduationCap size={15} className="text-primary" />
                  {profile.programme || <NotAdded />}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={15} className="text-primary" />
                  {profile.yearOfStudy || <NotAdded />}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={15} className="text-primary" />
                  {profile.location || <NotAdded />}
                </span>
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-text">
                <span className="flex items-center gap-1.5">
                  <Mail size={15} className="text-primary" />
                  {user.email || <NotAdded />}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone size={15} className="text-primary" />
                  {profile.phone || <NotAdded />}
                </span>
              </p>
            </div>

            <button
              onClick={openEdit}
              className="flex items-center gap-2 rounded-lg border border-primary bg-blue-50 px-4 py-2 text-sm font-medium text-primary hover:bg-blue-100"
            >
              <Pencil size={14} /> Edit Profile
            </button>
          </div>

          {photoError && <p className="mt-3 text-sm text-danger">{photoError}</p>}

          <div className="mt-5 max-w-md">
            <div className="mb-1 flex justify-between text-xs text-muted">
              <span>Profile completed</span>
              <span>{completion}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${completion}%` }}
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
            <Panel icon={User} title="About Me">
              {profile.about ? (
                <p className="whitespace-pre-line text-sm text-text">{profile.about}</p>
              ) : (
                <p className="text-sm italic text-muted">
                  Tell others about yourself. Use Edit Profile to add a short bio.
                </p>
              )}
              {profile.interests.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Star size={14} className="text-primary" />
                  {profile.interests.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs text-primary"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </Panel>

            <Panel icon={BookOpen} title="Academic Information">
              <Row label="Programme" value={profile.programme} />
              <Row label="Year of Study" value={profile.yearOfStudy} />
              <Row label="College" value="College of Science and Technology (CST)" />
              <Row label="University" value="Royal University of Bhutan (RUB)" />
            </Panel>

            <Panel icon={Link2} title="Contact & Social Links">
              {socialLinks.length === 0 && !user.email ? (
                <p className="text-sm italic text-muted">No links added yet.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map(({ label, href, icon: Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-full border border-gray-200 bg-blue-50/50 px-4 py-2 text-sm text-text hover:bg-blue-50"
                    >
                      <Icon size={16} className="text-primary" /> {label}
                    </a>
                  ))}
                  {user.email && (
                    <a
                      href={`mailto:${user.email}`}
                      className="flex items-center gap-2 rounded-full border border-gray-200 bg-blue-50/50 px-4 py-2 text-sm text-text hover:bg-blue-50"
                    >
                      <Mail size={16} className="text-primary" /> Email
                    </a>
                  )}
                </div>
              )}
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel
              icon={Code2}
              title="Portfolio"
              subtitle="Explore my projects, designs, and work."
              action={
                projects.length > 0 && (
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
                    onClick={() => {
                      setTab("Portfolio");
                      openNewProject();
                    }}
                    className="rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-blue-50"
                  >
                    Add your first project
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {projects.slice(0, 2).map((p) => (
                    <ProjectCard key={p.id} project={p} />
                  ))}
                </div>
              )}
            </Panel>

            <Panel icon={User} title="Personal Details">
              <Row label="Full Name" value={user.name} />
              <Row label="Email" value={user.email} />
              <Row label="Phone" value={profile.phone} />
              <Row label="Languages" value={profile.languages} />
              <Row label="Motto" value={profile.motto} />
            </Panel>
          </div>
        </div>
      )}

      {/* Portfolio tab */}
      {tab === "Portfolio" && (
        <Panel
          icon={Code2}
          title="My Portfolio"
          subtitle="Showcase the projects, designs and work you are proud of."
          action={
            <button
              onClick={openNewProject}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={16} /> Add Project
            </button>
          }
        >
          {projects.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center text-sm text-muted">
              <FolderOpen size={36} className="mb-3 text-gray-300" />
              No projects yet. Add your first one to start your portfolio.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onEdit={openEditProject}
                  onDelete={deleteProject}
                />
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* Edit profile modal */}
      {editing && (
        <Modal title="Edit Profile" onClose={() => setEditing(false)}>
          <form onSubmit={saveProfile} className="space-y-4">
            <Field label="Full name">
              <input
                value={nameText}
                onChange={(e) => setNameText(e.target.value)}
                placeholder="Your full name"
                maxLength={100}
                className={inputStyle}
                required
              />
            </Field>
            <Field label="About me">
              <textarea
                value={draft.about}
                onChange={(e) => setDraft({ ...draft, about: e.target.value })}
                rows={4}
                maxLength={500}
                placeholder="A short introduction about you"
                className={inputStyle}
              />
            </Field>
            <Field label="Interests (separate with commas)">
              <input
                value={interestsText}
                onChange={(e) => setInterestsText(e.target.value)}
                placeholder="Coding, Reading, Trekking"
                className={inputStyle}
              />
            </Field>
            <Field label="Programme">
              <input
                value={draft.programme}
                onChange={(e) => setDraft({ ...draft, programme: e.target.value })}
                placeholder="e.g. B.E. Software Engineering"
                className={inputStyle}
              />
            </Field>
            <Field label="Year of study">
              <select
                value={draft.yearOfStudy}
                onChange={(e) => setDraft({ ...draft, yearOfStudy: e.target.value })}
                className={inputStyle}
              >
                <option value="">Select year</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Location">
              <input
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                placeholder="e.g. CST, Phuentsholing"
                className={inputStyle}
              />
            </Field>
            <Field label="Phone number">
              <input
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                placeholder="+975 17 123456"
                className={inputStyle}
              />
            </Field>
            <Field label="Languages">
              <input
                value={draft.languages}
                onChange={(e) => setDraft({ ...draft, languages: e.target.value })}
                placeholder="English, Dzongkha"
                className={inputStyle}
              />
            </Field>
            <Field label="Motto">
              <input
                value={draft.motto}
                onChange={(e) => setDraft({ ...draft, motto: e.target.value })}
                className={inputStyle}
              />
            </Field>
            <Field label="GitHub link">
              <input
                value={draft.github}
                onChange={(e) => setDraft({ ...draft, github: e.target.value })}
                placeholder="github.com/username"
                className={inputStyle}
              />
            </Field>
            <Field label="LinkedIn link">
              <input
                value={draft.linkedin}
                onChange={(e) => setDraft({ ...draft, linkedin: e.target.value })}
                placeholder="linkedin.com/in/username"
                className={inputStyle}
              />
            </Field>
            <Field label="Personal website">
              <input
                value={draft.website}
                onChange={(e) => setDraft({ ...draft, website: e.target.value })}
                className={inputStyle}
              />
            </Field>
            <button
              type="submit"
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Save Changes
            </button>
          </form>
        </Modal>
      )}

      {/* Add / edit project modal */}
      {projectDraft && (
        <Modal
          title={projectDraft.id ? "Edit Project" : "Add Project"}
          onClose={() => setProjectDraft(null)}
        >
          <form onSubmit={saveProject} className="space-y-4">
            <Field label="Project title">
              <input
                value={projectDraft.title}
                onChange={(e) => setProjectDraft({ ...projectDraft, title: e.target.value })}
                className={inputStyle}
                required
              />
            </Field>
            <Field label="Short description">
              <textarea
                value={projectDraft.description}
                onChange={(e) => setProjectDraft({ ...projectDraft, description: e.target.value })}
                rows={3}
                maxLength={300}
                className={inputStyle}
              />
            </Field>
            <Field label="Project link (GitHub, live site, etc.)">
              <input
                value={projectDraft.link}
                onChange={(e) => setProjectDraft({ ...projectDraft, link: e.target.value })}
                placeholder="https://github.com/you/project"
                className={inputStyle}
              />
            </Field>
            <Field label="Cover image (optional)">
              {projectDraft.image && (
                <img
                  src={projectDraft.image}
                  alt="Cover preview"
                  className="mb-2 h-32 w-full rounded-lg object-cover"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  readImage(
                    file,
                    (image) => setProjectDraft((d) => ({ ...d, image })),
                    setProjectError
                  );
                }}
                className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-blue-100"
              />
            </Field>
            {projectError && <p className="text-sm text-danger">{projectError}</p>}
            <button
              type="submit"
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              {projectDraft.id ? "Save Project" : "Add Project"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}