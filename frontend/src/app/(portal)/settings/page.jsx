"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  User,
  ShieldCheck,
  Lock,
  Bell,
  Pencil,
  Mail,
  Phone,
  GraduationCap,
  CalendarDays,
  IdCard,
  Building2,
  Briefcase,
  Megaphone,
  Users,
  LifeBuoy,
  ChevronRight,
  X,
} from "lucide-react";

/* Set this to your team's support email */
const SUPPORT_EMAIL = "";

const sections = [
  { id: "profile", label: "Profile Settings", desc: "Update your personal information", icon: User },
  { id: "account", label: "Account Settings", desc: "Manage your account details", icon: ShieldCheck },
  { id: "notifications", label: "Notification Settings", desc: "Choose what you want to be notified about", icon: Bell },
  { id: "privacy", label: "Privacy Settings", desc: "Control your profile visibility", icon: Lock },
];

const yearOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

const inputStyle =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-text outline-none focus:border-primary";

const initials = (name) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

/* ----------------------------- pieces ----------------------------- */
function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-5.5" : "left-0.5"
        }`}
      />
    </button>
  );
}

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

function ToggleRow({ icon: Icon, title, desc, checked, onChange }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
      {Icon && <Icon size={20} className="shrink-0 text-primary" />}
      <div className="flex-1">
        <p className="text-sm font-medium text-sidebar">{title}</p>
        {desc && <p className="text-xs text-muted">{desc}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
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
  const [user, setUser] = useState({ name: "", email: "", role: "Student" });
  const [profile, setProfile] = useState({
    phone: "",
    programme: "",
    yearOfStudy: "",
    studentId: "",
  });
  const [active, setActive] = useState("profile");

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);

  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwDone, setPwDone] = useState(false);

  const [notif, setNotif] = useState({
    mentorship: true,
    internships: true,
    events: true,
    announcements: true,
  });
  const [privacy, setPrivacy] = useState({ showEmail: false, showPhone: false });

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

  // Profile completion: the dashboard's % will use the same idea
  const fields = Object.values(profile);
  const completion = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  const openEdit = () => {
    setDraft(profile);
    setEditing(true);
  };

  const saveProfile = (e) => {
    e.preventDefault();
    // TODO (backend phase): PUT /api/profile
    setProfile(draft);
    setEditing(false);
  };

  const openPassword = () => {
    setPw({ current: "", next: "", confirm: "" });
    setPwError("");
    setPwDone(false);
    setPwOpen(true);
  };

  const changePassword = (e) => {
    e.preventDefault();
    if (pw.next.length < 8) return setPwError("New password must be at least 8 characters.");
    if (pw.next !== pw.confirm) return setPwError("Passwords do not match.");
    // TODO (backend phase): POST /api/auth/change-password
    setPwError("");
    setPwDone(true);
  };

  const goTo = (id) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
          <Settings size={30} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-sidebar">Settings</h1>
          <p className="text-sm text-muted">Manage your account preferences and portal settings.</p>
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
                {user.name ? initials(user.name) : "?"}
              </div>

              <div className="min-w-72 flex-1">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-bold text-sidebar">{user.name || "Your name"}</h3>
                  <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-primary">
                    {user.role}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-3">
                    <InfoRow icon={Mail} value={user.email} />
                    <InfoRow icon={Phone} value={profile.phone} />
                    <InfoRow icon={Building2} value="College of Science and Technology (CST)" />
                  </div>
                  <div className="space-y-3">
                    <InfoRow icon={GraduationCap} value={profile.programme} />
                    <InfoRow icon={CalendarDays} value={profile.yearOfStudy && `Year of Study: ${profile.yearOfStudy}`} />
                    <InfoRow icon={IdCard} value={profile.studentId && `Student ID: ${profile.studentId}`} />
                  </div>
                </div>

                <div className="mt-5">
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
          </Panel>

          {/* Account */}
          <Panel id="account" icon={ShieldCheck} title="Account Settings">
            <div className="flex flex-wrap items-center gap-6">
              <div className="min-w-60 flex-1">
                <p className="flex items-center gap-3 text-sm font-medium text-sidebar">
                  Account Status
                  <span className="rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-success">
                    Active
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted">Your account is active and in good standing.</p>
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

          {/* Notifications */}
          <Panel
            id="notifications"
            icon={Bell}
            title="Notification Settings"
            subtitle="Choose which in-app updates you want to receive."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ToggleRow
                icon={Users}
                title="Mentorship Updates"
                desc="When a mentor answers your request"
                checked={notif.mentorship}
                onChange={(v) => setNotif({ ...notif, mentorship: v })}
              />
              <ToggleRow
                icon={Briefcase}
                title="Internship Updates"
                desc="New internships and application status"
                checked={notif.internships}
                onChange={(v) => setNotif({ ...notif, internships: v })}
              />
              <ToggleRow
                icon={CalendarDays}
                title="Events & Workshops"
                desc="New events and reminders"
                checked={notif.events}
                onChange={(v) => setNotif({ ...notif, events: v })}
              />
              <ToggleRow
                icon={Megaphone}
                title="General Announcements"
                desc="News from CST staff and administration"
                checked={notif.announcements}
                onChange={(v) => setNotif({ ...notif, announcements: v })}
              />
            </div>
          </Panel>

          {/* Privacy */}
          <Panel
            id="privacy"
            icon={Lock}
            title="Privacy Settings"
            subtitle="Control what information is visible to other users."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ToggleRow
                icon={Mail}
                title="Show my email on my profile"
                checked={privacy.showEmail}
                onChange={(v) => setPrivacy({ ...privacy, showEmail: v })}
              />
              <ToggleRow
                icon={Phone}
                title="Show my phone number"
                checked={privacy.showPhone}
                onChange={(v) => setPrivacy({ ...privacy, showPhone: v })}
              />
            </div>
            <p className="mt-3 text-xs text-muted">
              Both are off by default. Your contact details are only shared with a mentor after they
              accept your request.
            </p>
          </Panel>
        </div>
      </div>

      {/* Edit profile modal */}
      {editing && (
        <Modal title="Edit Profile" onClose={() => setEditing(false)}>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-text">Name</label>
              <input value={user.name} disabled className={`${inputStyle} bg-gray-50 text-muted`} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-text">Email</label>
              <input value={user.email} disabled className={`${inputStyle} bg-gray-50 text-muted`} />
              <p className="mt-1 text-xs text-muted">Your CST email can&apos;t be changed.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm text-text">Phone number</label>
              <input
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                placeholder="+975 17 123456"
                className={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-text">Programme</label>
              <input
                value={draft.programme}
                onChange={(e) => setDraft({ ...draft, programme: e.target.value })}
                placeholder="e.g. B.E. Software Engineering"
                className={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-text">Year of study</label>
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
            </div>
            <div>
              <label className="mb-1 block text-sm text-text">Student ID</label>
              <input
                value={draft.studentId}
                onChange={(e) => setDraft({ ...draft, studentId: e.target.value })}
                placeholder="Your student number"
                className={inputStyle}
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Save Changes
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
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Update Password
              </button>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}