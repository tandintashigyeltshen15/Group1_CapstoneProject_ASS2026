"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader, Card, Field, Notice, inputCls, btnPrimary, btnOutline } from "@/components/ui";

const DEPARTMENTS = ["Student Affairs", "Alumni Relations", "IT Services", "Administration"];

const initials = (name) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export default function StaffProfilePage() {
  const [profile, setProfile] = useStore("staffProfile");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(profile);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function startEdit() {
    setForm(profile);
    setError("");
    setEditing(true);
  }

  function save(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return setError("Name and email are required.");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Enter a valid email address.");
    setProfile({ ...form, name: form.name.trim(), email: form.email.trim() });
    setEditing(false);
    setSaved("Profile updated.");
    setTimeout(() => setSaved(""), 2500);
  }

  const rows = [
    ["Employee ID", profile.employeeId],
    ["Email", profile.email],
    ["Phone", profile.phone || "—"],
    ["Department", profile.department],
    ["Designation", profile.designation],
  ];

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="My Profile"
        subtitle="Your staff account details."
        action={
          !editing && (
            <button onClick={startEdit} className={btnPrimary}>
              <Pencil size={16} /> Edit profile
            </button>
          )
        }
      />
      {saved && <Notice>{saved}</Notice>}

      {!editing ? (
        <Card>
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sidebar text-xl font-semibold text-white">
              {initials(profile.name)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-sidebar">{profile.name}</h2>
              <p className="text-sm text-muted">{profile.designation} &middot; {profile.department}</p>
            </div>
          </div>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium uppercase text-muted">{label}</dt>
                <dd className="mt-0.5 text-sm text-sidebar">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      ) : (
        <Card title="Edit profile">
          <form onSubmit={save} noValidate className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {error && <div className="md:col-span-2"><Notice tone="red">{error}</Notice></div>}
            <Field label="Full name" required><input className={inputCls} value={form.name} onChange={set("name")} /></Field>
            <Field label="Employee ID"><input className={inputCls + " bg-gray-50"} value={form.employeeId} readOnly /></Field>
            <Field label="Email" required><input type="email" className={inputCls} value={form.email} onChange={set("email")} /></Field>
            <Field label="Phone"><input className={inputCls} value={form.phone} onChange={set("phone")} /></Field>
            <Field label="Department">
              <select className={inputCls} value={form.department} onChange={set("department")}>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Designation"><input className={inputCls} value={form.designation} onChange={set("designation")} /></Field>
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" className={btnPrimary}>Save changes</button>
              <button type="button" onClick={() => setEditing(false)} className={btnOutline}>Cancel</button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}