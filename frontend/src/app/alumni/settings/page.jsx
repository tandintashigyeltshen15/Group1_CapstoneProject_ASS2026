"use client";

import { useState } from "react";
import { useStore, update, resetDemoData } from "@/lib/store";
import { PageHeader, Card, Toggle, Field, Notice, inputCls, btnPrimary, btnOutline } from "@/components/ui";

export default function SettingsPage() {
  const [settings, setSettings] = useStore("settings");
  const [profile] = useStore("profile");
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState(null);
  const [saved, setSaved] = useState("");

  const flash = (m) => { setSaved(m); setTimeout(() => setSaved(""), 2500); };
  const toggle = (k) => (v) => { setSettings({ ...settings, [k]: v }); flash("Preferences saved."); };
  const updateProfile = (k) => (v) => { update("profile", (p) => ({ ...p, [k]: v })); flash("Preferences saved."); };

  function changePassword(e) {
    e.preventDefault();
    if (!pw.current) return setPwMsg({ tone: "red", text: "Enter your current password." });
    if (pw.next.length < 8) return setPwMsg({ tone: "red", text: "The new password must be at least 8 characters." });
    if (pw.next !== pw.confirm) return setPwMsg({ tone: "red", text: "The new passwords do not match." });
    setPw({ current: "", next: "", confirm: "" });
    // Frontend only: real password change needs the backend (bcrypt hash in User.Password)
    setPwMsg({ tone: "green", text: "Password updated." });
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your preferences and account." />
      {saved && <Notice>{saved}</Notice>}

      <Card title="Privacy and mentorship" className="mb-6">
        <div className="divide-y divide-gray-100">
          <Toggle checked={profile.isProfilePublic} onChange={updateProfile("isProfilePublic")} label="Public profile" description="Let students and other alumni see your profile." />
          <Toggle checked={profile.isAvailableForMentorship} onChange={updateProfile("isAvailableForMentorship")} label="Available for mentorship" description="Students can send you mentorship requests." />
        </div>
      </Card>

      <Card title="Notification preferences" className="mb-6">
        <div className="divide-y divide-gray-100">
          <Toggle checked={settings.emailNotifications} onChange={toggle("emailNotifications")} label="Email notifications" />
          <Toggle checked={settings.mentorshipAlerts} onChange={toggle("mentorshipAlerts")} label="Mentorship request alerts" />
          <Toggle checked={settings.eventReminders} onChange={toggle("eventReminders")} label="Event reminders" />
          <Toggle checked={settings.applicationUpdates} onChange={toggle("applicationUpdates")} label="Application updates" />
        </div>
      </Card>

      <Card title="Change password" className="mb-6">
        {pwMsg && <Notice tone={pwMsg.tone}>{pwMsg.text}</Notice>}
        <form onSubmit={changePassword} className="space-y-4">
          <Field label="Current password"><input type="password" className={inputCls} value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
          <Field label="New password"><input type="password" className={inputCls} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
          <Field label="Confirm new password"><input type="password" className={inputCls} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
          <button type="submit" className={btnPrimary}>Update password</button>
        </form>
      </Card>

      <Card title="Demo data">
        <p className="mb-3 text-sm text-muted">Everything you change is saved in this browser only. Reset to restore the original sample data.</p>
        <button onClick={() => { resetDemoData(); flash("Sample data restored."); }} className={btnOutline}>Reset sample data</button>
      </Card>
    </div>
  );
}
