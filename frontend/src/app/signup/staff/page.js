"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Square } from "lucide-react";

export default function StaffSignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    employeeId: "",
    department: "",
    designation: "",
    password: "",
    confirmPassword: "",
    agreed: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!formData.agreed) {
      alert("Please agree to the Terms & Conditions");
      return;
    }

    console.log("Staff signup:", formData);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-10 pb-4 pt-8">
        <div className="flex items-center gap-3">
          <Image
            src="/cst-logo.png"
            alt="CST Logo"
            width={44}
            height={44}
            style={{ width: 44, height: "auto" }}
          />

          <span className="text-[17px] font-bold leading-tight text-[#192B50]">
            CST ALUMNI
            <br />
            PORTAL
          </span>
        </div>

        <Link
          href="/signup"
          className="text-sm font-medium text-[#2563EB]"
        >
          ← Back to Role Selection
        </Link>
      </div>

      {/* Page heading */}
      <div className="mx-auto mb-6 max-w-6xl px-10">
        <h1 className="text-[34px] font-bold text-[#192B50]">
          Create your staff account
        </h1>

        <p className="mt-1 text-[#71809D]">
          Join the CST community and connect with opportunities.
        </p>
      </div>

      {/* Signup container */}
      <div className="mx-auto max-w-6xl px-10 pb-16">
        <div className="flex overflow-hidden rounded-2xl border border-gray-300">
          {/* Left panel */}
          <div className="relative flex w- [315px] shrink-0 flex-col bg-[#071D3B] text-white">
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 pt-10 text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-accent/20">
                <Square
                  className="fill-accent text-accent"
                  size={26}
                  strokeWidth={2}
                />
              </div>

              <h2 className="mb-1 text-xl font-bold">
                Staff Registration
              </h2>

              <p className="mb-8 text-sm text-gray-300">
                Create your staff account
              </p>

              <p className="text-xs leading-relaxed text-gray-400">
                Your information is secure
                <br />
                and used only for CST services.
              </p>
            </div>

            {/* Campus photo with wave-shaped edge */}
            <div className="relative h-60 w-full">
              <Image
                src="/campus.jpg"
                alt="CST Campus"
                fill
                sizes="315px"
                className="object-cover"
              />

              {/* Wave edge on top of the photo */}
              <svg
                aria-hidden="true"
                viewBox="0 0 315 70"
                preserveAspectRatio="none"
                className="absolute -top-px left-0 h- 17 w-full"
              >
                <path
                  d="M0 0H315V18C270 -4 235 4 195 28C150 54 95 62 50 44C30 36 12 36 0 42Z"
                  fill="#071D3B"
                />
              </svg>
            </div>

            <div className="absolute inset-0 -z-10 bg-[#071D3B]" />
          </div>

          {/* Right form */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 bg-white px-12 py-10"
          >
            <Field label="Full Name">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                className="w-full rounded-lg border border-[#D7E0EE] px-4 py-3 text-sm text-[#192B50] placeholder:text-[#9AA6BC] focus:border-accent focus:outline-none"
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
                className="w-full rounded-lg border border-[#D7E0EE] px-4 py-3 text-sm text-[#192B50] placeholder:text-[#9AA6BC] focus:border-accent focus:outline-none"
              />
            </Field>

            <Field label="Employee ID">
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                placeholder="Enter your employee ID"
                required
                className="w-full rounded-lg border border-[#D7E0EE] px-4 py-3 text-sm text-[#192B50] placeholder:text-[#9AA6BC] focus:border-accent focus:outline-none"
              />
            </Field>

            <Field label="Department">
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full appearance-none rounded-lg border border-[#D7E0EE] bg-white px-4 py-3 text-sm text-[#192B50] focus:border-accent focus:outline-none"
              >
                <option value="">Select your department</option>
                <option value="student-affairs">Student Affairs</option>
                <option value="alumni-relations">Alumni Relations</option>
                <option value="it-services">IT Services</option>
                <option value="administration">Administration</option>
              </select>
            </Field>

            <Field label="Designation">
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="Enter your designation"
                required
                className="w-full rounded-lg border border-[#D7E0EE] px-4 py-3 text-sm text-[#192B50] placeholder:text-[#9AA6BC] focus:border-accent focus:outline-none"
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
                  className="w-full rounded-lg border border-[#D7E0EE] px-4 py-3 pr-11 text-sm text-[#192B50] placeholder:text-[#9AA6BC] focus:border-accent focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9AA6BC]"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
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
                  className="w-full rounded-lg border border-[#D7E0EE] px-4 py-3 pr-11 text-sm text-[#192B50] placeholder:text-[#9AA6BC] focus:border-accent focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9AA6BC]"
                >
                  {showConfirm ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </Field>

            {/* Terms and conditions */}
            <div className="mb-6 mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                name="agreed"
                checked={formData.agreed}
                onChange={handleChange}
                className="h-4 w-4 accent-accent"
              />

              <span className="text-sm">
                <a href="#" className="font-medium text-[#192B50]">
                  Terms &amp; Conditions
                </a>

                {"   "}

                <a href="#" className="font-medium text-[#192B50]">
                  Privacy Policy
                </a>
              </span>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-accent py-3.5 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Create Staff Account
            </button>

            <p className="mt-5 text-center text-sm text-[#71809D]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-[#2563EB]"
              >
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
      <label className="mb-1.5 block text-xs font-medium text-[#192B50]">
        {label}
      </label>

      {children}
    </div>
  );
}