"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { DEPARTMENTS } from "@/lib/catalog";

const inputClass =
  "w-full border border-[#D7E0EE] rounded-lg px-4 py-3 text-sm font-normal text-[#192B50] placeholder:text-[#9AA6BC] focus:outline-none focus:border-[#7C3AED]";

const selectClass = (value) =>
  `w-full border border-[#D7E0EE] rounded-lg px-4 py-3 text-sm font-normal appearance-none bg-white focus:outline-none focus:border-[#7C3AED] ${
    value ? "text-[#192B50]" : "text-[#9AA6BC]"
  }`;

export default function StaffSignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    employeeId: "",
    departmentId: "",
    designation: "",
    password: "",
    confirmPassword: "",
    agreed: false,
  });

  useEffect(() => {
    api("/catalog/departments")
      .then((list) => setDepartments(Array.isArray(list) && list.length ? list : DEPARTMENTS))
      .catch(() => setDepartments(DEPARTMENTS));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!formData.agreed) {
      setError("Please agree to the Terms & Conditions.");
      return;
    }

    setLoading(true);
    try {
      const data = await api("/staff-signup", {
        method: "POST",
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          employeeId: formData.employeeId.trim(),
          departmentId: Number(formData.departmentId),
          designation: formData.designation.trim(),
          password: formData.password,
        }),
      });
      setSuccess(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex justify-between items-center px-10 pt-8 pb-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <Image src="/cst-logo.png" alt="CST Logo" width={44} height={44} />
          <span className="text-[17px] font-bold text-[#192B50] leading-tight">
            CST ALUMNI<br />PORTAL
          </span>
        </div>
        <Link href="/signup" className="text-[#2563EB] text-sm font-medium">
          ← Back to Role Selection
        </Link>
      </div>

      {/* Heading */}
      <div className="max-w-6xl mx-auto px-10 mb-6">
        <h1 className="text-[34px] font-bold text-[#192B50]">Create your staff account</h1>
        <p className="text-[#71809D] mt-1">
          Register with your Employee ID. An administrator will approve your account.
        </p>
      </div>

      {/* Card */}
      <div className="max-w-6xl mx-auto px-10 pb-16">
        <div className="flex border border-gray-300 rounded-2xl overflow-hidden">
          {/* Left panel */}
          <div className="relative hidden w-[315px] shrink-0 flex-col bg-sidebar text-white md:flex">
            <div className="relative z-10 px-10 pt-12">
              <h2 className="text-3xl font-bold">Staff Registration</h2>
              <p className="mt-5 text-lg leading-snug text-white/90">
                Create your staff account
              </p>
              <p className="mt-5 text-sm text-white/80">
                Your information is secure
                <br />
                and used only for CST services.
              </p>
            </div>

            {/* Campus photo with wave-shaped edge */}
            <div className="relative mt-auto h-64 w-full">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/campus.jpg')" }}
              />
              <svg
                aria-hidden="true"
                viewBox="0 0 315 70"
                preserveAspectRatio="none"
                className="absolute -top-px left-0 w-full text-sidebar"
                style={{ height: 70 }}
              >
                <path
                  d="M0 0H315V18C270 -4 235 4 195 28C150 54 95 62 50 44C30 36 12 36 0 42Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>

          {/* Right form */}
          <form onSubmit={handleSubmit} className="flex-1 bg-white px-12 py-10">
            <Field label="Full Name">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                maxLength={50}
                required
                className={inputClass}
              />
            </Field>

            <Field label="Email Address">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                required
                className={inputClass}
              />
            </Field>

            <Field label="Employee ID">
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                placeholder="Enter your Employee ID"
                maxLength={10}
                required
                className={inputClass}
              />
            </Field>

            <Field label="Department">
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                required
                className={selectClass(formData.departmentId)}
              >
                <option value="">Select your department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id} className="text-[#192B50]">
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Designation">
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="Enter your designation"
                className={inputClass}
              />
            </Field>

            <Field label="Password">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  required
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9AA6BC]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            <Field label="Confirm Password">
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9AA6BC]"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            <div className="flex items-center gap-2 mt-2 mb-6">
              <input
                type="checkbox"
                name="agreed"
                checked={formData.agreed}
                onChange={handleChange}
                className="w-4 h-4 accent-[#7C3AED]"
              />
              <span className="text-sm text-[#71809D]">
                I agree to the{" "}
                <a href="#" className="text-[#192B50] font-medium">Terms &amp; Conditions</a> and{" "}
                <a href="#" className="text-[#192B50] font-medium">Privacy Policy</a>
              </span>
            </div>

            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

            {success ? (
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
                {success}{" "}
                <Link href="/login?role=staff" className="font-semibold underline">
                  Go to login
                </Link>
              </div>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-3.5 rounded-lg text-[15px] font-semibold transition-colors disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Create Staff Account"}
              </button>
            )}

            <p className="text-center text-sm text-[#71809D] mt-5">
              Already have an account?{" "}
              <Link href="/login?role=staff" className="text-[#2563EB] font-medium">
                Login here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-[#192B50] mb-1.5">{label}</label>
      {children}
    </div>
  );
}