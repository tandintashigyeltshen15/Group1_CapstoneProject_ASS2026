"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import AvatarUpload from "@/components/AvatarUpload";
import { Pencil, GraduationCap, BadgeCheck, BookOpen, Heart, Briefcase, FolderOpen } from "lucide-react";
import { Card, Badge, Field, Toggle, EmptyState, Notice, inputCls, btnPrimary, btnOutline } from "@/components/ui";

const TABS = [
  ["overview", "Overview"],
  ["publications", "Publications"],
  ["career", "Career History"],
  ["projects", "Projects"],
];

const emptyProfile = {
  GraduationYear: "",
  ProfessionalBackground: "",
  ExpertiseArea: "",
  MentorshipAvailable: false,
  IsProfilePublic: true,
  user: { Name: "", ProfilePhoto: "" },
  programme: { ProgrammeName: "", department: { DepartmentName: "" } },
  career_history: [],
  project: [],
  publication: [],
  contribution: [],
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
const fmtMonth = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "";

function Row({ title, sub, meta, badge }) {
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium text-sidebar">{title}</p>
        {badge}
      </div>
      {sub && <p className="text-sm text-text">{sub}</p>}
      {meta && <p className="text-xs text-muted">{meta}</p>}
    </li>
  );
}

export default function AlumniProfilePage() {
  const [profile, setProfile] = useState(emptyProfile);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/alumni/me")
      .then((d) => {
        setProfile(d);
        setLoaded(true);
      })
      .catch((err) => {
        setError(err.message);
        setLoaded(true);
      });
  }, []);

  const current = profile.career_history.find((c) => !c.EndDate);

  function startEdit() {
    setForm({
      ProfessionalBackground: profile.ProfessionalBackground || "",
      ExpertiseArea: profile.ExpertiseArea || "",
      MentorshipAvailable: profile.MentorshipAvailable,
      IsProfilePublic: profile.IsProfilePublic,
    });
    setError("");
    setEditing(true);
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const updated = await api("/alumni/me", { method: "PUT", body: JSON.stringify(form) });
      setProfile({ ...profile, ...updated });
      setEditing(false);
      setSaved("Profile saved.");
      setTimeout(() => setSaved(""), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {saved && <Notice>{saved}</Notice>}
      {error && !editing && <Notice tone="red">{error}</Notice>}

      {/* Hero */}
      <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex h-28 items-center justify-end bg-gradient-to-r from-sidebar to-primary px-8">
          <div className="hidden text-right text-white sm:block">
            <p className="font-serif text-lg italic">&ldquo;Once a CSTian, always a CSTian.&rdquo;</p>
            <p className="text-sm text-white/80">- CST Alumni</p>
          </div>
        </div>
        <div className="flex flex-wrap items-start gap-5 px-6 pb-6">
          <div className="-mt-12">
            <AvatarUpload
              name={profile.user.Name}
              photoUrl={profile.user.ProfilePhoto || ""}
              onChange={(url) => setProfile({ ...profile, user: { ...profile.user, ProfilePhoto: url } })}
              className="border-4 border-white shadow"
            />
          </div>
          <div className="min-w-64 flex-1 pt-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-sidebar">
                {profile.user.Name || (loaded ? "Profile not found" : "Loading...")}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-primary">
                <BadgeCheck size={14} /> Verified Alumni
              </span>
              {profile.MentorshipAvailable && <Badge tone="green">Available for mentorship</Badge>}
              {!profile.IsProfilePublic && <Badge>Private</Badge>}
            </div>
            <p className="mt-1 text-text">
              {current ? (
                <>
                  Currently working as <b className="text-sidebar">{current.Position}</b> at{" "}
                  <b className="text-sidebar">{current.Organization}</b>
                </>
              ) : (
                "Add your current job in Career History"
              )}
            </p>
            <p className="mt-2 flex items-center gap-1 text-sm text-muted">
              <GraduationCap size={14} /> {profile.programme.ProgrammeName}, Class of {profile.GraduationYear}
            </p>
          </div>
          {!editing && (
            <button onClick={startEdit} disabled={!loaded} className={btnOutline + " mt-3"}>
              <Pencil size={14} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {editing && (
        <Card title="Edit profile" className="mb-6">
          <form onSubmit={save} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {error && (
              <div className="md:col-span-2">
                <Notice tone="red">{error}</Notice>
              </div>
            )}
            <Field label="Area of expertise">
              <input
                className={inputCls}
                value={form.ExpertiseArea}
                maxLength={255}
                placeholder="e.g. Software Development, Career Guidance"
                onChange={(e) => setForm({ ...form, ExpertiseArea: e.target.value })}
              />
            </Field>
            <div />
            <div className="md:col-span-2">
              <Field label="About me">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={form.ProfessionalBackground}
                  onChange={(e) => setForm({ ...form, ProfessionalBackground: e.target.value })}
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Toggle
                checked={form.MentorshipAvailable}
                onChange={(v) => setForm({ ...form, MentorshipAvailable: v })}
                label="Available as a mentor"
              />
            </div>
            <div className="md:col-span-2">
              <Toggle
                checked={form.IsProfilePublic}
                onChange={(v) => setForm({ ...form, IsProfilePublic: v })}
                label="Public profile (visible in the alumni directory)"
              />
            </div>
            <p className="text-xs text-muted md:col-span-2">
              Name, programme and graduation year were verified by staff. Contact staff if they are wrong.
            </p>
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? "Saving..." : "Save profile"}
              </button>
              <button type="button" onClick={() => setEditing(false)} className={btnOutline}>
                Cancel
              </button>
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

      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <Card title="About Me">
              <p className="text-sm leading-relaxed text-text">
                {profile.ProfessionalBackground || "Add a short introduction using Edit Profile."}
              </p>
              {profile.ExpertiseArea && (
                <p className="mt-3 text-sm text-text">
                  <b className="text-sidebar">Expertise:</b> {profile.ExpertiseArea}
                </p>
              )}
            </Card>
            <Card title="Quick Stats">
              <div className="grid grid-cols-2 gap-4">
                {[
                  [profile.publication.length, "Publications"],
                  [profile.contribution.length, "Contributions"],
                  [profile.project.length, "Projects"],
                  [profile.career_history.length, "Jobs"],
                ].map(([v, l]) => (
                  <div key={l} className="text-center">
                    <p className="text-xl font-bold text-sidebar">{v}</p>
                    <p className="text-xs text-muted">{l}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <Card title="My Contributions" icon={Heart}>
              {profile.contribution.length === 0 ? (
                <EmptyState message="No contributions yet." />
              ) : (
                <ul className="divide-y divide-gray-100">
                  {profile.contribution.slice(0, 3).map((c) => (
                    <Row key={c.ContributionID} title={c.CategoryType} sub={c.Description} meta={fmtDate(c.ContributionDate)} />
                  ))}
                </ul>
              )}
            </Card>
            <Card title="My Career History" icon={Briefcase}>
              {profile.career_history.length === 0 ? (
                <EmptyState message="No career history added yet." />
              ) : (
                <ul className="divide-y divide-gray-100">
                  {profile.career_history.slice(0, 3).map((c) => (
                    <Row
                      key={c.CareerID}
                      title={c.Position}
                      sub={c.Organization}
                      meta={`${fmtMonth(c.StartDate)} - ${c.EndDate ? fmtMonth(c.EndDate) : "Present"}`}
                      badge={!c.EndDate && <Badge tone="green">Current</Badge>}
                    />
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === "publications" && (
        <Card title="Publications" icon={BookOpen}>
          {profile.publication.length === 0 ? (
            <EmptyState message="No publications added yet." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {profile.publication.map((p) => (
                <Row key={p.PublicationID} title={p.Title} sub={p.PublicationType} meta={fmtDate(p.PublicationDate)} />
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "career" && (
        <Card title="Career History" icon={Briefcase}>
          {profile.career_history.length === 0 ? (
            <EmptyState message="No career history added yet." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {profile.career_history.map((c) => (
                <Row
                  key={c.CareerID}
                  title={c.Position}
                  sub={c.Organization}
                  meta={`${fmtMonth(c.StartDate)} - ${c.EndDate ? fmtMonth(c.EndDate) : "Present"}`}
                  badge={!c.EndDate && <Badge tone="green">Current</Badge>}
                />
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "projects" && (
        <Card title="Projects" icon={FolderOpen}>
          {profile.project.length === 0 ? (
            <EmptyState message="No projects added yet." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {profile.project.map((p) => (
                <Row
                  key={p.ProjectID}
                  title={p.Title}
                  sub={p.Description}
                  meta={[
                    p.StartDate && `${fmtDate(p.StartDate)} - ${p.EndDate ? fmtDate(p.EndDate) : "Present"}`,
                    p.FundingAgency,
                  ]
                    .filter(Boolean)
                    .join(" | ")}
                />
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}