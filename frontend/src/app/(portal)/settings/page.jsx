"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Settings,
  User,
  ShieldCheck,
  Lock,
  Pencil,
  Mail,
  Phone,
  GraduationCap,
  CalendarDays,
  IdCard,
  Building2,
  MapPin,
  LifeBuoy,
  ChevronRight,
  X,
} from "lucide-react";

/* Set this to your team's support email */
const SUPPORT_EMAIL = "";

const sections = [
  { id: "profile", label: "Profile Settings", desc: "Update your personal information", icon: User },
  { id: "account", label: "Account Settings", desc: "Manage your account details", icon: ShieldCheck },
  { id: "privacy", label: "Privacy", desc: "How your information is shared", icon: Lock },
];

const DZONGKHAGS = [
  "Bumthang", "Chukha", "Dagana", "Gasa", "Haa", "Lhuentse", "Mongar", "Paro",
  "Pemagatshel", "Punakha", "Samdrup Jongkhar", "Samtse", "Sarpang", "Thimphu",
  "Trashigang", "Trashiyangtse", "Trongsa", "Tsirang", "Wangdue Phodrang", "Zhemgang",
];

const inputStyle =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-text outline-none focus:border-primary";

const initials = (name = "") =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const emptyProfile = {
  name: "",
  email: "",
  role: "Student",
  accountStatus: "",
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

/* ----------------------------- pieces ----------------------------- */
function Panel({ id, icon: Icon, title, subtitle, action, children }) {
  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
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

function InfoRow({ icon: Icon, value }) {
  return (
    <p className="flex items-center gap-3 text-sm">
      <Icon size={16} className="shrink-0 text-primary" />
      {value ? (
        <span className="text-text">{value}</span>
      ) : (
        <span className="italic text-muted">Not added yet</span>
      )}
    </p>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
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

/* ------------------------------- page ------------------------------ */
export default function SettingsPage() {
  const [profile, setProfile] = useState(emptyProfile);
  const [active, setActive] = useState("profile");

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(emptyProfile);
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwDone, setPwDone] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    api("/student/profile")
      .then(setProfile)
      .catch((err) => console.warn(err.message));
  }, []);

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

  const openPassword = () => {
    setPw({ current: "", next: "", confirm: "" });
    setPwError("");
    setPwDone(false);
    setPwOpen(true);
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.next.length < 8) return setPwError("New password must be at least 8 characters.");
    if (pw.next !== pw.confirm) return setPwError("Passwords do not match.");
    setPwError("");
    setPwBusy(true);
    try {
      await api("/student/change-password", {
        method: "POST",
        body: JSON.stringify({ current: pw.current, next: pw.next }),
      });
      setPwDone(true);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwBusy(false);
    }
  };

  const goTo = (id) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isActive = ["Active", "Approved"].includes(profile.accountStatus);
  const location = [profile.gewog, profile.dzongkhag].filter(Boolean).join(", ");
  const dzongkhagOptions =
    draft.dzongkhag && !DZONGKHAGS.includes(draft.dzongkhag)
      ? [draft.dzongkhag, ...DZONGKHAGS]
      : DZONGKHAGS;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
          <Settings size={30} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-sidebar">Settings</h1>
          <p className="text-sm text-muted">Manage your account and profile.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr]">
        {/* Left menu */}
        <aside className="h-fit space-y-4">
          <nav className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
            {sections.map(({ id, label, desc, icon: Icon }) => (
              <button
                key={id}
                onClick={() => goTo(id)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                  active === id ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <Icon size={20} className="shrink-0 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-sidebar">{label}</p>
                  <p className="text-xs text-muted">{desc}</p>
                </div>
                <ChevronRight size={16} className="text-muted" />
              </button>
            ))}
          </nav>

          <div className="rounded-xl bg-blue-50 p-5">
            <div className="mb-3 flex items-center gap-3">
              <LifeBuoy size={28} className="text-primary" />
              <div>
                <p className="text-sm font-semibold text-sidebar">Need help?</p>
                <p className="text-xs text-muted">Contact our support team if you face any issues.</p>
              </div>
            </div>
            <a
              href={SUPPORT_EMAIL ? `mailto:${SUPPORT_EMAIL}` : "#"}
              className="block rounded-lg border border-primary bg-white py-2 text-center text-sm font-medium text-primary hover:bg-blue-50"
            >
              Contact Support
            </a>
          </div>
        </aside>

        {/* Right content */}
        <div className="space-y-6">
          {/* Profile */}
          <Panel
            id="profile"
            icon={User}
            title="Profile Settings"
            action={
              <button
                onClick={openEdit}
                className="flex items-center gap-2 rounded-lg border border-primary bg-blue-50 px-4 py-2 text-sm font-medium text-primary hover:bg-blue-100"
              >
                <Pencil size={14} /> Edit Profile
              </button>
            }
          >
            <div className="flex flex-wrap items-start gap-8">
              <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-sidebar text-3xl font-semibold text-white">
                {profile.name ? initials(profile.name) : "?"}
              </div>

              <div className="min-w-72 flex-1">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-bold text-sidebar">{profile.name || "Your name"}</h3>
                  <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-primary">
                    {profile.role}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-3">
                    <InfoRow icon={Mail} value={profile.email} />
                    <InfoRow icon={Phone} value={profile.phone} />
                    <InfoRow icon={MapPin} value={location} />
                    <InfoRow icon={Building2} value="College of Science and Technology (CST)" />
                  </div>
                  <div className="space-y-3">
                    <InfoRow icon={GraduationCap} value={profile.programme} />
                    <InfoRow icon={CalendarDays} value={profile.joinYear && `Joined: ${profile.joinYear}`} />
                    <InfoRow icon={IdCard} value={profile.studentId && `Student ID: ${profile.studentId}`} />
                  </div>
                </div>

                {(profile.technicalSkills || profile.softSkills || profile.projects) && (
                  <div className="mt-5 space-y-3 border-t border-gray-100 pt-4 text-sm">
                    {profile.technicalSkills && (
                      <p className="whitespace-pre-line">
                        <span className="font-medium text-sidebar">Technical skills: </span>
                        <span className="text-text">{profile.technicalSkills}</span>
                      </p>
                    )}
                    {profile.softSkills && (
                      <p className="whitespace-pre-line">
                        <span className="font-medium text-sidebar">Soft skills: </span>
                        <span className="text-text">{profile.softSkills}</span>
                      </p>
                    )}
                    {profile.projects && (
                      <p className="whitespace-pre-line">
                        <span className="font-medium text-sidebar">Projects: </span>
                        <span className="text-text">{profile.projects}</span>
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-5">
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
          </Panel>

          {/* Account */}
          <Panel id="account" icon={ShieldCheck} title="Account Settings">
            <div className="flex flex-wrap items-center gap-6">
              <div className="min-w-60 flex-1">
                <p className="flex items-center gap-3 text-sm font-medium text-sidebar">
                  Account Status
                  {profile.accountStatus && (
                    <span
                      className={`rounded-full px-3 py-0.5 text-xs font-medium ${
                        isActive ? "bg-green-100 text-success" : "bg-orange-100 text-warning"
                      }`}
                    >
                      {profile.accountStatus}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {isActive
                    ? "Your account is active and in good standing."
                    : "Your account is not fully active yet."}
                </p>
              </div>

              <div className="flex flex-1 flex-wrap items-center gap-4 border-gray-200 md:border-l md:pl-6">
                <Lock size={22} className="text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-sidebar">Change Password</p>
                  <p className="text-sm text-muted">Keep your account secure.</p>
                </div>
                <button
                  onClick={openPassword}
                  className="rounded-lg border border-primary px-5 py-2 text-sm font-medium text-primary hover:bg-blue-50"
                >
                  Change Password
                </button>
              </div>
            </div>
          </Panel>

          {/* Privacy (information only) */}
          <Panel
            id="privacy"
            icon={Lock}
            title="Privacy"
            subtitle="How your information is shared on the portal."
          >
            <ul className="space-y-2 text-sm text-text">
              <li>
                Your contact email is shared with a mentor only after they accept your mentorship
                request.
              </li>
              <li>You can see your own mentorship, internship and event activity under My Applications.</li>
              <li>Your password is stored securely and is never visible to anyone, including staff.</li>
            </ul>
          </Panel>
        </div>
      </div>

      {/* Edit profile modal */}
      {editing && (
        <Modal title="Edit Profile" onClose={() => setEditing(false)}>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-text">Name</label>
              <input value={profile.name} disabled className={`${inputStyle} bg-gray-50 text-muted`} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-text">Email</label>
              <input value={profile.email} disabled className={`${inputStyle} bg-gray-50 text-muted`} />
              <p className="mt-1 text-xs text-muted">
                Name, email, programme and student ID were verified at signup and can&apos;t be
                changed here.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm text-text">Phone number</label>
              <input
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value.replace(/\D/g, "") })}
                placeholder="8 digits, e.g. 17123456"
                maxLength={8}
                inputMode="numeric"
                className={inputStyle}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-text">Dzongkhag</label>
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
              </div>
              <div>
                <label className="mb-1 block text-sm text-text">Gewog</label>
                <input
                  value={draft.gewog}
                  onChange={(e) => setDraft({ ...draft, gewog: e.target.value })}
                  maxLength={20}
                  className={inputStyle}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-text">Technical skills</label>
              <textarea
                value={draft.technicalSkills}
                onChange={(e) => setDraft({ ...draft, technicalSkills: e.target.value })}
                rows={2}
                placeholder="e.g. React, Node.js, MySQL"
                className={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-text">Soft skills</label>
              <textarea
                value={draft.softSkills}
                onChange={(e) => setDraft({ ...draft, softSkills: e.target.value })}
                rows={2}
                placeholder="e.g. Teamwork, communication"
                className={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-text">Projects</label>
              <textarea
                value={draft.projects}
                onChange={(e) => setDraft({ ...draft, projects: e.target.value })}
                rows={3}
                placeholder="Projects you have worked on"
                className={inputStyle}
              />
            </div>
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

      {/* Change password modal */}
      {pwOpen && (
        <Modal title="Change Password" onClose={() => setPwOpen(false)}>
          {pwDone ? (
            <div className="text-center">
              <p className="mb-4 text-sm text-success">Password updated.</p>
              <button
                onClick={() => setPwOpen(false)}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={changePassword} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-text">Current password</label>
                <input
                  type="password"
                  value={pw.current}
                  onChange={(e) => setPw({ ...pw, current: e.target.value })}
                  className={inputStyle}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-text">New password</label>
                <input
                  type="password"
                  value={pw.next}
                  onChange={(e) => setPw({ ...pw, next: e.target.value })}
                  className={inputStyle}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-text">Confirm new password</label>
                <input
                  type="password"
                  value={pw.confirm}
                  onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                  className={inputStyle}
                  required
                />
              </div>
              {pwError && <p className="text-sm text-danger">{pwError}</p>}
              <button
                type="submit"
                disabled={pwBusy}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {pwBusy ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}