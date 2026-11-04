"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GraduationCap,
  Users,
  Briefcase,
  ShieldCheck,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { api } from "@/lib/api";
import { saveSession, HOME } from "@/lib/auth";

/* One config per role, so the four designs share the same page */
const roles = {
  student: {
    label: "Student",
    icon: GraduationCap,
    journey: "CST student journey.",
    tags: ["Learn", "Grow", "Build Your Future"],
    field: { label: "Student ID or Email", placeholder: "Enter your student ID or email", type: "text", icon: User },
    footer: { text: "Don't have an account?", link: "Register here", href: "/signup/student" },
  },
  alumni: {
    label: "Alumni",
    icon: Users,
    journey: "CST alumni journey.",
    tags: ["Stay Connected", "Give Back", "Make an Impact"],
    field: { label: "Email Address", placeholder: "Enter your email address", type: "email", icon: Mail },
    footer: { text: "Don't have an account?", link: "Register here", href: "/signup/alumni" },
  },
  staff: {
    label: "Staff",
    icon: Briefcase,
    journey: "CST staff journey.",
    tags: ["Support", "Collaborate", "Create Impact"],
    field: { label: "Staff ID or Email", placeholder: "Enter your staff ID or email", type: "text", icon: User },
    footer: { text: "Don't have an account?", link: "Contact your administrator", href: null },
  },
  admin: {
    label: "Admin",
    icon: ShieldCheck,
    journey: "CST administration journey.",
    tags: ["Manage", "Oversee", "Build a Better CST"],
    field: { label: "Username or Email", placeholder: "Enter your username or email", type: "text", icon: User },
    footer: { text: "Don't have an account?", link: "Contact the system administrator", href: null },
  },
};

const inputClass =
  "w-full rounded-lg border border-[#D7E0EE] py-3 pl-11 pr-4 text-sm text-[#192B50] placeholder:text-[#9AA6BC] focus:border-primary focus:outline-none";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const roleKey = roles[params.get("role")] ? params.get("role") : "student";
  const role = roles[roleKey];
  const RoleIcon = role.icon;
  const FieldIcon = role.field.icon;

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setRejectionReason("");

    if (!identifier.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          role: roleKey,
        }),
      });

      saveSession(data.token, data.user);
      router.replace(HOME[data.user.role] || "/login");

    } catch (err) {
      setError(err.message || "Unable to log in.");

      // Capture the rejection reason returned by the backend.
      const reason =
        err.rejectionReason ||
        err.data?.rejectionReason ||
        err.response?.data?.rejectionReason ||
        "";

      setRejectionReason(reason);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

        {/* Left panel */}
        <div className="relative hidden w-[42%] shrink-0 flex-col bg-sidebar text-white md:flex">
          <div className="relative z-10 px-10 pt-12">
            <h2 className="text-3xl font-bold">Welcome Back!</h2>
            <p className="mt-5 text-lg leading-snug text-white/90">
              Log in to continue your
              <br />
              {role.journey}
            </p>
            <p className="mt-5 text-sm text-white/80">
              {role.tags.join("  •  ")}
            </p>
          </div>

          {/* Campus photo */}
          <div
            className="mt-auto h-64 w-full bg-cover bg-center"
            style={{
              backgroundImage: "url('/campus.jpg')",
              clipPath: "ellipse(80% 70% at 50% 100%)",
            }}
          />
        </div>

        {/* Right: form */}
        <form onSubmit={handleSubmit} className="flex-1 px-8 py-10 md:px-14">

          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-primary">
              <RoleIcon size={28} />
            </div>

            <h1 className="text-xl font-bold tracking-wide text-sidebar">
              CST ALUMNI PORTAL
            </h1>
            <p className="mt-1 font-semibold text-sidebar">
              {role.label} Login
            </p>
            <p className="text-xs text-muted">Connect. Learn. Grow.</p>
          </div>

          {/* Identifier */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-sidebar">
              {role.field.label}
            </label>

            <div className="relative">
              <FieldIcon
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA6BC]"
              />

              <input
                type={role.field.type}
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError("");
                  setRejectionReason("");
                }}
                placeholder={role.field.placeholder}
                autoComplete="username"
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="mb-1.5 block text-xs font-medium text-sidebar">
              Password
            </label>

            <div className="relative">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA6BC]"
              />

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                  setRejectionReason("");
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className={`${inputClass} pr-11`}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9AA6BC]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div className="mb-5 text-right text-xs">
            <Link
              href="/forgot-password"
              className="font-medium text-primary hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Login error and rejection reason */}
          {error && (
            <div className="mb-5">
              <p className="text-sm text-danger">{error}</p>

              {rejectionReason && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="mb-1 text-sm font-semibold text-red-800">
                    Reason for rejection
                  </p>
                  <p className="text-sm leading-relaxed text-red-700">
                    {rejectionReason}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Login button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sidebar py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#0f1f3a] disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="mt-5 text-center text-xs text-muted">
            {role.footer.text}{" "}
            {role.footer.href ? (
              <Link
                href={role.footer.href}
                className="font-medium text-primary hover:underline"
              >
                {role.footer.link}
              </Link>
            ) : (
              <span className="font-medium text-primary">
                {role.footer.link}
              </span>
            )}
          </p>

          {/* Switch role */}
          <div className="mt-8 border-t border-gray-100 pt-5 text-center text-xs text-muted">
            Log in as{" "}
            {Object.entries(roles).map(([key, r], i) => (
              <span key={key}>
                {i > 0 && " · "}
                <Link
                  href={`/login?role=${key}`}
                  className={
                    key === roleKey
                      ? "font-semibold text-sidebar"
                      : "text-primary hover:underline"
                  }
                >
                  {r.label}
                </Link>
              </span>
            ))}
          </div>

        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
