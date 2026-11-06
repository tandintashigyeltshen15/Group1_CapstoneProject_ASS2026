"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-text outline-none focus:border-primary";

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-text">{label}</label>
      {children}
    </div>
  );
}

export default function CreateAccountModal({ onClose, onCreated }) {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    role: "STAFF",
    fullName: "",
    email: "",
    employeeId: "",
    username: "",
    departmentId: "",
    designation: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api("/catalog/departments").then(setDepartments).catch(() => {});
  }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = {
        role: form.role,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      };
      if (form.role === "STAFF") {
        body.employeeId = form.employeeId.trim();
        body.departmentId = Number(form.departmentId);
        body.designation = form.designation.trim();
      } else {
        body.username = form.username.trim();
      }
      const data = await api("/admin/users", { method: "POST", body: JSON.stringify(body) });
      setDone(data.message);
      onCreated?.(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-sidebar">Create account</h3>
          <button onClick={onClose} aria-label="Close">
            <X size={18} className="text-muted" />
          </button>
        </div>

        {done ? (
          <div>
            <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{done}</p>
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Field label="Account type">
              <select value={form.role} onChange={set("role")} className={inputClass}>
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </Field>

            <Field label="Full name">
              <input value={form.fullName} onChange={set("fullName")} maxLength={50} required className={inputClass} />
            </Field>

            <Field label="Email">
              <input type="email" value={form.email} onChange={set("email")} required className={inputClass} />
            </Field>

            {form.role === "STAFF" ? (
              <>
                <Field label="Employee ID (3 to 10 characters)">
                  <input value={form.employeeId} onChange={set("employeeId")} maxLength={10} required className={inputClass} />
                </Field>
                <Field label="Department">
                  <select value={form.departmentId} onChange={set("departmentId")} required className={inputClass}>
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Designation">
                  <input value={form.designation} onChange={set("designation")} className={inputClass} />
                </Field>
              </>
            ) : (
              <Field label="Username">
                <input value={form.username} onChange={set("username")} required className={inputClass} />
              </Field>
            )}

            <Field label="Temporary password (at least 8 characters)">
              <input type="text" value={form.password} onChange={set("password")} minLength={8} required className={inputClass} />
            </Field>

            {error && <p className="text-sm text-danger">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}