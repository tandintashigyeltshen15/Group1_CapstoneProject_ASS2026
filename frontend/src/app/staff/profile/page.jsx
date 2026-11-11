"use client";

import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { api } from "@/lib/api";
import AvatarUpload from "@/components/AvatarUpload";
import { PageHeader, Card, Field, Notice, inputCls, btnPrimary, btnOutline } from "@/components/ui";

const emptyProfile = {
  name: "",
  email: "",
  employeeId: "",
  phone: "",
  department: "",
  designation: "",
  photoUrl: "",
};

export default function StaffProfilePage() {
  const [profile, setProfile] = useState(emptyProfile);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyProfile);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/staff/me")
      .then((d) => {
        setProfile(d);
        setLoaded(true);
      })
      .catch((err) => {
        setError(err.message);
        setLoaded(true);
      });
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function startEdit() {
    setForm(profile);
    setError("");
    setEditing(true);
  }

  async function save(e) {
    e.preventDefault();
    const name = form.name.trim();
    const phone = form.phone.trim();
    if (name.length < 2 || name.length > 50) return setError("Name must be 2 to 50 characters.");
    if (phone && !/^\d{8}$/.test(phone)) return setError("Phone number must be exactly 8 digits.");
    if (form.designation.trim().length > 100) return setError("Designation must be 100 characters or less.");

    setError("");
    setSaving(true);
    try {
      const updated = await api("/staff/me", {
        method: "PUT",
        body: JSON.stringify({ name, phone, designation: form.designation.trim() }),
      });
      setProfile(updated);
      setEditing(false);
      setSaved("Profile updated.");
      setTimeout(() => setSaved(""), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const rows = [
    ["Employee ID", profile.employeeId],
    ["Email", profile.email],
    ["Phone", profile.phone || "—"],
    ["Department", profile.department],
    ["Designation", profile.designation || "—"],
  ];

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="My Profile"
        subtitle="Your staff account details."
        action={
          !editing && (
            <button onClick={startEdit} disabled={!loaded || !profile.name} className={btnPrimary}>
              <Pencil size={16} /> Edit profile
            </button>
          )
        }
      />
      {saved && <Notice>{saved}</Notice>}
      {error && !editing && <Notice tone="red">{error}</Notice>}

      {!editing ? (
        <Card>
          <div className="mb-6 flex items-start gap-5">
            <AvatarUpload
              name={profile.name}
              photoUrl={profile.photoUrl}
              onChange={(url) => setProfile({ ...profile, photoUrl: url })}
              size="h-20 w-20"
              text="text-2xl"
            />
            <div className="pt-2">
              <h2 className="text-xl font-bold text-sidebar">
                {profile.name || (loaded ? "Profile not found" : "Loading...")}
              </h2>
              <p className="text-sm text-muted">
                {[profile.designation, profile.department].filter(Boolean).join(" · ")}
              </p>
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
            {error && (
              <div className="md:col-span-2">
                <Notice tone="red">{error}</Notice>
              </div>
            )}
            <Field label="Full name" required>
              <input className={inputCls} value={form.name} onChange={set("name")} maxLength={50} />
            </Field>
            <Field label="Employee ID">
              <input className={inputCls + " bg-gray-50"} value={form.employeeId} readOnly />
            </Field>
            <Field label="Email">
              <input className={inputCls + " bg-gray-50"} value={form.email} readOnly />
            </Field>
            <Field label="Phone">
              <input
                className={inputCls}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                placeholder="8 digits, e.g. 17123456"
                maxLength={8}
                inputMode="numeric"
              />
            </Field>
            <Field label="Department">
              <input className={inputCls + " bg-gray-50"} value={form.department} readOnly />
            </Field>
            <Field label="Designation">
              <input className={inputCls} value={form.designation} onChange={set("designation")} maxLength={100} />
            </Field>
            <p className="text-xs text-muted md:col-span-2">
              Email and employee ID are your login details, and your department is set by an administrator,
              so they can&apos;t be changed here.
            </p>
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button type="button" onClick={() => setEditing(false)} className={btnOutline}>
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}