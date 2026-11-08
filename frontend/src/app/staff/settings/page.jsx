"use client";

import { useState } from "react";
import { useStore, resetDemoData } from "@/lib/store";
import { PageHeader, Card, Toggle, Field, Notice, inputCls, btnPrimary, btnOutline } from "@/components/ui";

export default function StaffSettingsPage() {
  const [settings, setSettings] = useStore("staffSettings");
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState(null);
  const [saved, setSaved] = useState("");

  const flash = (m) => { setSaved(m); setTimeout(() => setSaved(""), 2500); };
  const toggle = (k) => (v) => { setSettings({ ...settings, [k]: v }); flash("Preferences saved."); };

  function changePassword(e) {
    e.preventDefault();
    if (!pw.current) return setPwMsg({ tone: "red", text: "Enter your current password." });
    if (pw.next.length < 8) return setPwMsg({ tone: "red", text: "The new password must be at least 8 characters." });
    if (pw.next !== pw.confirm) return setPwMsg({ tone: "red", text: "The new passwords do not match." });
    setPw({ current: "", next: "", confirm: "" });
    // Frontend only: a real password change needs the backend (hashed password in the User table)
    setPwMsg({ tone: "green", text: "Password updated." });
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your preferences and account." />
      {saved && <Notice>{saved}</Notice>}

      <Card title="Notification preferences" className="mb-6">
        <div className="divide-y divide-gray-100">
          <Toggle checked={settings.emailNotifications} onChange={toggle("emailNotifications")} label="Email notifications" />
          <Toggle checked={settings.verificationAlerts} onChange={toggle("verificationAlerts")} label="New alumni verification requests" />
          <Toggle checked={settings.applicationAlerts} onChange={toggle("applicationAlerts")} label="New application alerts" />
          <Toggle checked={settings.eventReminders} onChange={toggle("eventReminders")} label="Event reminders" />
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