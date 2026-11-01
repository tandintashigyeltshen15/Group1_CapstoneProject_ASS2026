"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, Check, Circle, ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

const inputClass =
  "w-full rounded-lg border border-[#D7E0EE] py-3 pl-11 pr-11 text-sm text-[#192B50] placeholder:text-[#9AA6BC] focus:border-primary focus:outline-none";

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-xs font-medium text-sidebar">{label}</label>
      <div className="relative">
        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA6BC]" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="new-password"
          required
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9AA6BC]"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function ResetForm() {
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const rules = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "One uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "One lowercase letter", ok: /[a-z]/.test(password) },
    { label: "One number", ok: /\d/.test(password) },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!rules.every((r) => r.ok)) {
      setError("Your password does not meet all the requirements.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    // TODO (backend phase): POST /api/auth/reset-password with { token, password }
    // Show an error here if the server says the link is invalid or expired.
    setDone(true);
  };

  if (!token) {
    return (
      <AuthLayout
        icon={Lock}
        title="Link Not Valid"
        text="This password reset link is missing or incomplete."
      >
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-danger">
            <Lock size={28} />
          </div>
          <h1 className="text-xl font-bold text-sidebar">Invalid or expired link</h1>
          <p className="mt-3 text-sm text-muted">
            Reset links expire after 15 minutes. Please request a new one.
          </p>
          <Link
            href="/forgot-password"
            className="mt-8 block w-full rounded-lg bg-sidebar py-3 text-[15px] font-semibold text-white hover:bg-[#0f1f3a]"
          >
            Request a new link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout
        icon={ShieldCheck}
        title="Password Reset Successful"
        text="Your password has been reset successfully. You can now log in with your new password."
      >
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-primary">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-xl font-bold text-sidebar">Password Reset Successful</h1>
          <p className="mt-3 text-sm text-muted">
            Your password has been reset successfully.
            <br />
            You can now log in to your account.
          </p>
          <Link
            href="/login"
            className="mt-8 block w-full rounded-lg bg-sidebar py-3 text-[15px] font-semibold text-white hover:bg-[#0f1f3a]"
          >
            Go to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title="Create New Password"
      text="Your new password must be strong and secure."
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-primary">
            <Lock size={28} />
          </div>
          <h1 className="text-xl font-bold text-sidebar">Reset Password</h1>
          <p className="mt-2 text-sm text-muted">Enter your new password below.</p>
        </div>

        <PasswordField
          label="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
        />

        <div className="mb-4 rounded-lg bg-gray-50 p-4">
          <p className="mb-2 text-xs font-medium text-sidebar">Password must contain:</p>
          <ul className="space-y-1.5">
            {rules.map((r) => (
              <li
                key={r.label}
                className={`flex items-center gap-2 text-xs ${r.ok ? "text-success" : "text-muted"}`}
              >
                {r.ok ? <Check size={14} /> : <Circle size={14} />} {r.label}
              </li>
            ))}
          </ul>
        </div>

        <PasswordField
          label="Confirm New Password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
        />

        {error && <p className="mb-4 text-sm text-danger">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg bg-sidebar py-3 text-[15px] font-semibold text-white hover:bg-[#0f1f3a]"
        >
          Reset Password
        </button>
      </form>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}