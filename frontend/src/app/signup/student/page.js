"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, GraduationCap } from "lucide-react";

/* Students must sign up with their CST email.
   Change this if the college email domain is different. */
const STUDENT_EMAIL_DOMAIN = "rub.edu.bt";

const inputClass =
  "w-full border border-[#D7E0EE] rounded-lg px-4 py-3 text-sm font-normal text-[#192B50] placeholder:text-[#9AA6BC] focus:outline-none focus:border-[#2563EB]";

export default function StudentSignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    studentId: "",
    department: "",
    password: "",
    confirmPassword: "",
    agreed: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email.toLowerCase().endsWith(`@${STUDENT_EMAIL_DOMAIN}`)) {
      setError(`Please use your CST email (@${STUDENT_EMAIL_DOMAIN}).`);
      return;
    }
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

    // TODO (backend phase): POST /api/auth/register with role "STUDENT"
    console.log("Student signup:", { ...formData, role: "STUDENT" });
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
        <h1 className="text-[34px] font-bold text-[#192B50]">Create your student account</h1>
        <p className="text-[#71809D] mt-1">
          Join the CST community and connect with opportunities.
        </p>
      </div>

      {/* Card */}
      <div className="max-w-6xl mx-auto px-10 pb-16">
        <div className="flex border border-gray-300 rounded-2xl overflow-hidden">
          {/* Left panel */}
          <div className="w-[315px] shrink-0 bg-[#071D3B] text-white flex flex-col items-center justify-center text-center px-8 py-10">
            <div className="bg-[#0D2A55] rounded-full w-20 h-20 flex items-center justify-center mb-5">
              <GraduationCap className="text-[#2563EB]" size={34} strokeWidth={1.75} />
            </div>
            <h2 className="text-xl font-bold mb-1">Student Registration</h2>
            <p className="text-sm text-gray-300 mb-8">Create your student account</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Your information is secure<br />and used only for CST services.
            </p>
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
              <p className="mt-1.5 text-xs text-[#71809D]">
                Use your CST email (@{STUDENT_EMAIL_DOMAIN}). 
              </p>
            </Field>

            <Field label="Student ID">
              <input
                type="text"
                inputMode="numeric"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                placeholder="Enter your student ID"
                required
                pattern="[0-9]{8}"
                title="Student ID is 8 digits, for example 02250373"
                className={inputClass}
              />
            </Field>

            <Field label="Department">
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className={`w-full border border-[#D7E0EE] rounded-lg px-4 py-3 text-sm font-normal appearance-none bg-white focus:outline-none focus:border-[#2563EB] ${
                  formData.department ? "text-[#192B50]" : "text-[#9AA6BC]"
                }`}
              >
                <option value="">Select your department</option>
                <option value="cse" className="text-[#192B50]">Computer Science & Engineering</option>
                <option value="ece" className="text-[#192B50]">Electronics & Communication</option>
                <option value="civil" className="text-[#192B50]">Civil Engineering</option>
                <option value="electrical" className="text-[#192B50]">Electrical Engineering</option>
              </select>
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

            {/* Terms */}
            <div className="flex items-center gap-2 mt-2 mb-4">
              <input
                type="checkbox"
                name="agreed"
                checked={formData.agreed}
                onChange={handleChange}
                className="w-4 h-4 accent-[#2563EB]"
              />
              <span className="text-sm text-[#71809D]">
                I agree to the{" "}
                <a href="#" className="text-[#192B50] font-medium">Terms &amp; Conditions</a>{" "}
                and{" "}
                <a href="#" className="text-[#192B50] font-medium">Privacy Policy</a>
              </span>
            </div>

            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-[#2563EB] hover:bg-[#1D4FC4] text-white py-3.5 rounded-lg text-[15px] font-semibold transition-colors"
            >
              Create Student Account
            </button>

            <p className="text-center text-sm text-[#71809D] mt-5">
              Already have an account?{" "}
              <Link href="/login" className="text-[#2563EB] font-medium">
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