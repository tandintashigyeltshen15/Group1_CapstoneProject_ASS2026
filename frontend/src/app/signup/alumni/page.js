"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, User } from "lucide-react";

export default function AlumniSignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    graduationYear: "",
    department: "",
    currentDesignation: "",
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
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (!formData.agreed) {
      alert("Please agree to the Terms & Conditions");
      return;
    }
    console.log("Alumni signup:", formData);
  };

  const years = Array.from({ length: 2026 - 1980 + 1 }, (_, i) => 2026 - i);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex justify-between items-center px-10 pt-8 pb-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="CST Logo" width={44} height={44} />
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
        <h1 className="text-[34px] font-bold text-[#192B50]">Create your alumni account</h1>
        <p className="text-[#71809D] mt-1">
          Join the CST community and connect with opportunities.
        </p>
      </div>

      {/* Card */}
      <div className="max-w-6xl mx-auto px-10 pb-16">
        <div className="flex border border-gray-300 rounded-2xl overflow-hidden">
          {/* Left panel */}
          <div className="relative w-[315px] shrink-0 bg-[#071D3B] text-white flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8 pt-10 relative z-10">
              <div className="bg-[#0C3A2E] rounded-full w-20 h-20 flex items-center justify-center mb-5">
                <User className="text-[#12B76A]" size={32} strokeWidth={1.75} />
              </div>
              <h2 className="text-xl font-bold mb-1">Alumni Registration</h2>
              <p className="text-sm text-gray-300 mb-8">Create your alumni account</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Your information is secure<br />and used only for CST services.
              </p>
            </div>

            {/* Curved campus photo */}
            <div
              className="relative h-56 w-full"
              style={{ clipPath: "ellipse(70% 55% at 50% 100%)" }}
            >
              <Image src="/campus.jpg" alt="CST Campus" fill className="object-cover" />
            </div>
            <div className="absolute inset-0 -z-10 bg-[#071D3B]" />
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
                className="w-full border border-[#D7E0EE] rounded-lg px-4 py-3 text-sm text-[#192B50] placeholder:text-[#9AA6BC] focus:outline-none focus:border-[#078F63]"
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
                className="w-full border border-[#D7E0EE] rounded-lg px-4 py-3 text-sm text-[#192B50] placeholder:text-[#9AA6BC] focus:outline-none focus:border-[#078F63]"
              />
            </Field>

            <Field label="Graduation Year">
              <select
                name="graduationYear"
                value={formData.graduationYear}
                onChange={handleChange}
                required
                className="w-full border border-[#D7E0EE] rounded-lg px-4 py-3 text-sm text-[#192B50] appearance-none bg-white focus:outline-none focus:border-[#078F63]"
              >
                <option value="">Select your graduation year</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </Field>

            <Field label="Department">
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full border border-[#D7E0EE] rounded-lg px-4 py-3 text-sm text-[#192B50] appearance-none bg-white focus:outline-none focus:border-[#078F63]"
              >
                <option value="">Select your department</option>
                <option value="cse">Computer Science & Engineering</option>
                <option value="ece">Electronics & Communication</option>
                <option value="civil">Civil Engineering</option>
                <option value="electrical">Electrical Engineering</option>
              </select>
            </Field>

            <Field label="Current Designation">
              <input
                type="text"
                name="currentDesignation"
                value={formData.currentDesignation}
                onChange={handleChange}
                placeholder="Enter your current job title"
                className="w-full border border-[#D7E0EE] rounded-lg px-4 py-3 text-sm text-[#192B50] placeholder:text-[#9AA6BC] focus:outline-none focus:border-[#078F63]"
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
                  className="w-full border border-[#D7E0EE] rounded-lg px-4 py-3 pr-11 text-sm text-[#192B50] placeholder:text-[#9AA6BC] focus:outline-none focus:border-[#078F63]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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
                  className="w-full border border-[#D7E0EE] rounded-lg px-4 py-3 pr-11 text-sm text-[#192B50] placeholder:text-[#9AA6BC] focus:outline-none focus:border-[#078F63]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9AA6BC]"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            {/* Terms */}
            <div className="flex items-center gap-2 mt-2 mb-6">
              <input
                type="checkbox"
                name="agreed"
                checked={formData.agreed}
                onChange={handleChange}
                className="w-4 h-4 accent-[#078F63] border-[#078F63]"
              />
              <span className="text-sm">
                <a href="#" className="text-[#192B50] font-medium">Terms &amp; Conditions</a>
                {"   "}
                <a href="#" className="text-[#192B50] font-medium">Privacy Policy</a>
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-[#078F63] hover:bg-[#067350] text-white py-3.5 rounded-lg text-[15px] font-semibold transition-colors"
            >
              Create Alumni Account
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