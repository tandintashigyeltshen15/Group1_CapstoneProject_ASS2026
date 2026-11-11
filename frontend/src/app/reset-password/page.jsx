"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { api } from "@/lib/api";

const inputClass =
  "w-full rounded-lg border border-[#D7E0EE] py-3 pl-11 pr-11 text-sm text-[#192B50] placeholder:text-[#9AA6BC] focus:border-primary focus:outline-none";

function PasswordField({ label, value, onChange, show, onToggle, placeholder }) {
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
          onClick={onToggle}
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
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      await api("/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
    } catch (err) {
      setError(err.message || "Could not reset your password.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold text-sidebar">Link not valid</h1>
        <p className="mt-2 text-sm text-muted">This reset link is missing or incomplete. Please request a new one.</p>
        <Link
          href="/forgot-password"
          className="mt-6 block w-full rounded-lg bg-sidebar py-3 text-[15px] font-semibold text-white hover:bg-[#0f1f3a]"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 size={30} />
        </div>
        <h1 className="text-xl font-bold text-sidebar">Password updated</h1>
        <p className="mt-2 text-sm text-muted">You can now log in with your new password.</p>
        <Link
          href="/login"
          className="mt-6 block w-full rounded-lg bg-sidebar py-3 text-[15px] font-semibold text-white hover:bg-[#0f1f3a]"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-sidebar">Choose a new password</h1>
        <p className="mt-1 text-xs text-muted">Use at least 8 characters.</p>
      </div>

      <PasswordField
        label="New password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError("");
        }}
        show={showPassword}
        onToggle={() => setShowPassword(!showPassword)}
        placeholder="Enter a new password"
      />
      <PasswordField
        label="Confirm new password"
        value={confirm}
        onChange={(e) => {
          setConfirm(e.target.value);
          setError("");
        }}
        show={showConfirm}
        onToggle={() => setShowConfirm(!showConfirm)}
        placeholder="Re-enter your new password"
      />

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-sidebar py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#0f1f3a] disabled:opacity-60"
      >
        {loading ? "Saving..." : "Reset Password"}
      </button>

      <p className="mt-5 text-center text-xs text-muted">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to Login
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Reset Your Password"
      text="Choose a new password for your CST Alumni Portal account."
      icon={KeyRound}
    >
      <Suspense>
        <ResetForm />
      </Suspense>
    </AuthLayout>
  );
}