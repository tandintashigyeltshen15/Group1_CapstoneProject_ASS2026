"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, UploadCloud, FileText, X } from "lucide-react";
import { api } from "@/lib/api";
import { PROGRAMMES } from "@/lib/catalog";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_MB = 5;

const formatSize = (bytes) =>
  bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const inputClass =
  "w-full border border-[#D7E0EE] rounded-lg px-4 py-3 text-sm font-normal text-[#192B50] placeholder:text-[#9AA6BC] focus:outline-none focus:border-[#078F63]";

const selectClass = (value) =>
  `w-full border border-[#D7E0EE] rounded-lg px-4 py-3 text-sm font-normal appearance-none bg-white focus:outline-none focus:border-[#078F63] ${
    value ? "text-[#192B50]" : "text-[#9AA6BC]"
  }`;

export default function AlumniSignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [programmes, setProgrammes] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    graduationYear: "",
    programmeId: "",
    currentDesignation: "",
    password: "",
    confirmPassword: "",
    agreed: false,
  });

  useEffect(() => {
    api("/catalog/programmes")
      .then((list) => setProgrammes(Array.isArray(list) && list.length ? list : PROGRAMMES))
      .catch(() => setProgrammes(PROGRAMMES));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const pickFile = (file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError("Please upload a PDF, JPG or PNG file.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setFileError(`File must be smaller than ${MAX_MB} MB.`);
      return;
    }
    setFileError("");
    setProofFile(file);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setFileError("");

  if (formData.password.length < 8) {
    setError("Password must be at least 8 characters.");
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    setError("Passwords do not match.");
    return;
  }

  if (!proofFile) {
    setFileError("Please upload your proof of graduation.");
    return;
  }

  if (!formData.agreed) {
    setError("Please agree to the Terms & Conditions.");
    return;
  }

  setLoading(true);

  try {
    const data = new FormData();

    data.append("role", "ALUMNI");
    data.append("fullName", formData.fullName.trim());
    data.append("email", formData.email.trim());
    data.append("password", formData.password);
    data.append("programmeId", String(Number(formData.programmeId)));
    data.append("graduationYear", String(Number(formData.graduationYear)));
    data.append("proof", proofFile);

    const response = await api("/auth/register", {
      method: "POST",
      body: data,
    });

    setSuccess(response.message);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2001 + 1 }, (_, i) => currentYear - i);

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
        <h1 className="text-[34px] font-bold text-[#192B50]">Create your alumni account</h1>
        <p className="text-[#71809D] mt-1">
          Join the CST community and connect with opportunities.
        </p>
      </div>

      {/* Card */}
      <div className="max-w-6xl mx-auto px-10 pb-16">
        <div className="flex border border-gray-300 rounded-2xl overflow-hidden">
          {/* Left panel */}
          <div className="relative hidden w-[315px] shrink-0 flex-col bg-sidebar text-white md:flex">
            <div className="relative z-10 px-10 pt-12">
              <h2 className="text-3xl font-bold">Alumni Registration</h2>
              <p className="mt-5 text-lg leading-snug text-white/90">
                Create your alumni account
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

            <Field label="Graduation Year">
              <select
                name="graduationYear"
                value={formData.graduationYear}
                onChange={handleChange}
                required
                className={selectClass(formData.graduationYear)}
              >
                <option value="">Select your graduation year</option>
                {years.map((y) => (
                  <option key={y} value={y} className="text-[#192B50]">
                    {y}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Programme">
              <select
                name="programmeId"
                value={formData.programmeId}
                onChange={handleChange}
                required
                className={selectClass(formData.programmeId)}
              >
                <option value="">Select your programme</option>
                {programmes.map((p) => (
                  <option key={p.id} value={p.id} className="text-[#192B50]">
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Current Designation">
              <input
                type="text"
                name="currentDesignation"
                value={formData.currentDesignation}
                onChange={handleChange}
                placeholder="Enter your current job title"
                className={inputClass}
              />
            </Field>

            {/* Proof of graduation */}
            <Field label="Proof of CST graduation *">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  pickFile(e.dataTransfer.files?.[0]);
                }}
                className={`flex flex-col items-center rounded-2xl border px-6 py-7 text-center transition-colors ${
                  dragging
                    ? "border-[#2563EB] bg-blue-50"
                    : fileError
                    ? "border-red-400 bg-white"
                    : "border-[#D7E0EE] bg-white"
                }`}
              >
                <UploadCloud size={30} className="mb-2 text-[#2563EB]" />
                <p className="text-[15px] font-semibold text-[#192B50]">
                  Upload graduation document
                </p>
                <p className="mt-1 max-w-md text-sm text-[#71809D]">
                  Choose a graduation certificate, degree certificate, or another document
                  accepted by CST.
                </p>
                <p className="mt-2 text-xs text-[#9AA6BC]">
                  PDF, JPG or PNG · Max {MAX_MB} MB
                </p>

                <label className="mt-4 cursor-pointer rounded-full border border-[#D7E0EE] px-6 py-2 text-sm font-medium text-[#192B50] hover:bg-gray-50">
                  Choose file
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(e) => {
                      pickFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </label>

                {proofFile && (
                  <div className="mt-4 flex w-full max-w-md items-center gap-3 rounded-lg bg-[#F8FAFC] px-4 py-2.5 text-left">
                    <FileText size={20} className="shrink-0 text-[#078F63]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#192B50]">
                        {proofFile.name}
                      </p>
                      <p className="text-xs text-[#71809D]">{formatSize(proofFile.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProofFile(null)}
                      aria-label="Remove file"
                      className="text-[#9AA6BC] hover:text-red-500"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
              {fileError && <p className="mt-2 text-sm text-red-500">{fileError}</p>}
              <p className="mt-2 text-xs text-[#71809D]">
                Your account will remain pending until staff verifies your submitted
                information. Your document is only seen by CST staff.
              </p>
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
            <div className="flex items-center gap-2 mt-2 mb-6">
              <input
                type="checkbox"
                name="agreed"
                checked={formData.agreed}
                onChange={handleChange}
                className="w-4 h-4 accent-[#078F63] border-[#078F63]"
              />
              <span className="text-sm text-[#71809D]">
                I agree to the{" "}
                <a href="#" className="text-[#192B50] font-medium">Terms &amp; Conditions</a> and{" "}
                <a href="#" className="text-[#192B50] font-medium">Privacy Policy</a>
              </span>
            </div>

            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

            {/* Submit */}
            {success ? (
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
                {success}{" "}
                <Link href="/login?role=alumni" className="font-semibold underline">
                  Go to login
                </Link>
              </div>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#078F63] hover:bg-[#067350] text-white py-3.5 rounded-lg text-[15px] font-semibold transition-colors disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create Alumni Account"}
              </button>
            )}

            <p className="text-center text-sm text-[#71809D] mt-5">
              Already have an account?{" "}
              <Link href="/login?role=alumni" className="text-[#2563EB] font-medium">
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