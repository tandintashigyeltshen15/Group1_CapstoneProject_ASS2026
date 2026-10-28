"use client";

import { useState } from "react";
import { PageHeader, Card, Field, Toggle, Notice, inputCls, btnPrimary, btnOutline } from "@/components/ui";
import { useStore, resetDemoData } from "@/lib/store";

export default function AdminSettingsPage() {
  const [profile, setProfile] = useStore("adminProfile");
  const [settings, setSettings] = useStore("adminSettings");
  const [draft, setDraft] = useState(null);
  const [flash, setFlash] = useState(null);

  const form = draft ?? profile;
  const set = (k) => (e) => setDraft({ ...form, [k]: e.target.value });
  const toggle = (k) => (v) => {
    setSettings({ ...settings, [k]: v });
    setFlash("Preferences saved.");
  };

  const saveProfile = (e) => {
    e.preventDefault();
    setProfile(form);
    setDraft(null);
    setFlash("Profile saved.");
  };

  const reset = () => {
    if (!window.confirm("Reset all demo data (contributions, users, events...) back to the starting values?")) return;
    resetDemoData();
    setDraft(null);
    setFlash("Demo data was reset.");
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your admin profile and portal preferences." />
      {flash && <Notice>{flash}</Notice>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Admin profile">
          <form onSubmit={saveProfile} className="space-y-4">
            <Field label="Full name" required><input className={inputCls} value={form.name} onChange={set("name")} required /></Field>
            <Field label="Email" required><input type="email" className={inputCls} value={form.email} onChange={set("email")} required /></Field>
            <Field label="Phone"><input className={inputCls} value={form.phone} onChange={set("phone")} /></Field>
            <div className="flex gap-3">
              <button type="submit" className={btnPrimary}>Save profile</button>
              <button type="button" className={btnOutline} onClick={() => setDraft(null)}>Discard</button>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card title="Notifications">
            <div className="divide-y divide-gray-100">
              <Toggle label="Email notifications" description="Receive portal alerts by email." checked={settings.emailNotifications} onChange={toggle("emailNotifications")} />
              <Toggle label="Contribution alerts" description="When a new contribution needs verification." checked={settings.contributionAlerts} onChange={toggle("contributionAlerts")} />
              <Toggle label="Approval alerts" description="New alumni, postings and events waiting for approval." checked={settings.approvalAlerts} onChange={toggle("approvalAlerts")} />
              <Toggle label="Weekly digest" description="A summary of portal activity every Monday." checked={settings.weeklyDigest} onChange={toggle("weeklyDigest")} />
            </div>
          </Card>

          <Card title="Approval rules">
            <div className="divide-y divide-gray-100">
              <Toggle label="Approve events before they are published" checked={settings.requireEventApproval} onChange={toggle("requireEventApproval")} />
              <Toggle label="Approve job and internship postings first" checked={settings.requireOpportunityApproval} onChange={toggle("requireOpportunityApproval")} />
            </div>
          </Card>

          <Card title="Demo data">
            <p className="mb-3 text-sm text-muted">Everything on the admin pages is saved in this browser only. Reset to start again from the sample data.</p>
            <button type="button" className={btnOutline} onClick={reset}>Reset demo data</button>
          </Card>
        </div>
      </div>
    </div>
  );
}
